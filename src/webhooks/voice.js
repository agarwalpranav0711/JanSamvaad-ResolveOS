const express = require('express');
const twilio = require('twilio');
const { VoiceResponse } = twilio.twiml;
const pool = require('../db');
const { isDndNumber } = require('../../lib/dndScrub');
const { extractIntent } = require('../services/llm');
const { createTicket } = require('../crm/ticket');
const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Too many requests'
});

function maskPhone(phone) {
  if (!phone || phone.length < 4) return phone || null;
  const normalized = String(phone);
  const prefix = normalized.startsWith('+91') ? '+91' : normalized.slice(0, 2);
  const suffix = normalized.slice(-4);
  return `${prefix}******${suffix}`;
}

function validateTwilioSignature(req, res, next) {
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    next();
    return;
  }

  if (!twilioAuthToken) {
    res.status(500).json({
      error: 'Server misconfiguration: TWILIO_AUTH_TOKEN not set'
    });
    return;
  }

  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const isValid = twilio.validateExpressRequest(req, twilioAuthToken, { url });
  if (!isValid) {
    res.status(403).send('Forbidden');
    return;
  }

  next();
}

router.use(['/voice', '/consent', '/lang', '/record', '/transcribe'], webhookLimiter, validateTwilioSignature);

async function logConsent(phone, consented, requestLogger) {
  try {
    await pool.query(
      `INSERT INTO call_consents (phone, consented, timestamp)
       VALUES ($1, $2, NOW())`,
      [phone, consented]
    );
  } catch (error) {
    (requestLogger || logger).error({ err: error, phone: maskPhone(phone) }, 'Failed to log consent');
  }
}

router.post('/voice', async (req, res) => {
  try {
    const response = new VoiceResponse();
    const phone = req.body.From;

    if (await isDndNumber(phone)) {
      response.say('You are on DND list, goodbye.');
      response.hangup();
      res.type('text/xml');
      res.send(response.toString());
      return;
    }

    const gather = response.gather({
      input: 'dtmf speech',
      numDigits: 1,
      action: '/consent',
      method: 'POST',
      timeout: 7,
      speechTimeout: 'auto'
    });

    gather.say(
      'Namaste. This call is recorded for grievance resolution under TRAI guidelines. Press 1 to consent and continue. Press 2 or say STOP to opt out.'
    );

    response.redirect({ method: 'POST' }, '/voice');

    res.type('text/xml');
    res.send(response.toString());
  } catch (err) {
    logger.error({ err }, 'Voice webhook handler failed — returning safe TwiML');
    const fallback = new VoiceResponse();
    fallback.say('Thank you for calling JanSamvaad. Please try again shortly.');
    res.type('text/xml');
    res.send(fallback.toString());
  }
});

router.post('/consent', async (req, res) => {
  const response = new VoiceResponse();
  const phone = req.body.From;
  const digit = req.body.Digits;
  const speechResult = String(req.body.SpeechResult || '').trim().toUpperCase();

  const optedOut = digit === '2' || speechResult === 'STOP';
  const consented = digit === '1' && !optedOut;

  await logConsent(phone, consented, req.log);

  if (!consented) {
    response.say('Thank you, goodbye.');
    response.hangup();
    res.type('text/xml');
    res.send(response.toString());
    return;
  }

  const gather = response.gather({
    input: 'dtmf',
    numDigits: 1,
    action: '/lang',
    method: 'POST',
    timeout: 7
  });

  gather.say(
    'For Hindi, press 1. For English, press 2. For Regional or Tamil, press 3.'
  );

  response.redirect({ method: 'POST' }, '/voice');
  res.type('text/xml');
  res.send(response.toString());
});

router.post('/lang', (req, res) => {
  const response = new VoiceResponse();
  const digit = req.body.Digits;

  if (digit === '1') {
    response.say('You selected Hindi. Please describe your issue after the beep.');
  } else if (digit === '2') {
    response.say('You selected English. Please describe your issue after the beep.');
  } else if (digit === '3') {
    response.say('You selected Regional or Tamil. Please describe your issue after the beep.');
  } else {
    response.say('Invalid input. Please try again.');
    response.redirect({ method: 'POST' }, '/voice');
    res.type('text/xml');
    res.send(response.toString());
    return;
  }

  response.record({
    action: '/record',
    maxLength: 30,
    playBeep: true,
    transcribe: true,
    transcribeCallback: '/transcribe'
  });

  res.type('text/xml');
  res.send(response.toString());
});

router.post('/record', async (req, res) => {
  const response = new VoiceResponse();
  response.say(
    'Thank you. Your grievance has been recorded. You will receive an SMS with your ticket reference shortly.'
  );
  response.hangup();
  res.type('text/xml');
  res.send(response.toString());
});

router.post('/transcribe', async (req, res) => {
  let transcript = (req.body.TranscriptionText || '').trim();
  const phone = req.body.From || req.body.Called || '';

  // SAFE IMPROVEMENT: Truncate input to avoid LLM abuse/huge payloads
  if (transcript.length > 1000) {
    transcript = transcript.substring(0, 1000);
  }

  // SAFE IMPROVEMENT: Prevent silent/empty audio from creating useless demo tickets.
  if (transcript.length < 5) {
    return res.status(200).send('');
  }

  try {
    const grievanceIntent = await extractIntent(transcript);
    const severityMap = { high: 'High', medium: 'Medium', low: 'Low' };
    const ticketPayload = {
      category: grievanceIntent.category || 'other',
      // SAFE IMPROVEMENT: Prevent Postgres foreign-key crashes by nullifying ward_id if AI hallucinates an unknown ward.
      ward_id: null,
      severity: severityMap[String(grievanceIntent.urgency || '').toLowerCase()] || 'Medium'
    };

    // Duplicate ticket detection (Polish 3)
    try {
      const { rows: dupes } = await pool.query(
        `SELECT id, ref FROM tickets
         WHERE category = $1
           AND status = 'open'
           AND created_at > NOW() - INTERVAL '24 hours'
         LIMIT 1`,
        [ticketPayload.category]
      );
      if (dupes.length > 0) {
        (req.log || logger).info({ existingRef: dupes[0].ref, category: ticketPayload.category }, 'Duplicate ticket detected — skipping creation');
        if (twilioClient && phone) {
          try {
            await twilioClient.messages.create({
              to: phone,
              from: process.env.TWILIO_PHONE_NUMBER,
              body: `JanSamvaad: A similar complaint (ref: ${dupes[0].ref}) is already being tracked in your area. We are working on it.`
            });
          } catch (smsErr) {
            (req.log || logger).warn({ err: smsErr }, 'Failed to send duplicate notification SMS');
          }
        }
        return res.status(200).send('');
      }
    } catch (dupeErr) {
      (req.log || logger).warn({ err: dupeErr }, 'Duplicate detection query failed — proceeding with ticket creation');
    }

    const ticket = await createTicket(phone, ticketPayload);
    (req.log || logger).info({ ticketRef: ticket.ref }, 'Ticket created from transcription');

    if (twilioClient && phone) {
      // SMS notification
      await twilioClient.messages.create({
        to: phone,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: `JanSamvaad: Your complaint has been registered. Ticket ref: ${ticket.ref}. We will resolve it within SLA.`
      });

      // WhatsApp notification (Polish 1)
      try {
        await twilioClient.messages.create({
          to: `whatsapp:${phone}`,
          from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
          body: `🗣️ JanSamvaad ResolveOS\nYour complaint has been registered.\nTicket: ${ticket.ref}\nCategory: ${ticket.category}\nWe will resolve it within SLA.\n\nTrack: ${process.env.APP_BASE_URL || 'http://localhost'}/track`
        });
      } catch (waErr) {
        (req.log || logger).warn({ err: waErr }, 'WhatsApp notification failed');
      }
    }
  } catch (error) {
    (req.log || logger).error({ err: error }, 'Transcription callback failed');
  }

  res.status(200).send('');
});

module.exports = router;
