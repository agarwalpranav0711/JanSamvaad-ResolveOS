const express = require('express');
const twilio = require('twilio');
const { VoiceResponse } = twilio.twiml;
const pool = require('../db');
const { isDndNumber } = require('../../lib/dndScrub');
const { extractIntent } = require('../services/llm');
const { createTicket } = require('../crm/ticket');
const logger = require('../utils/logger');

const router = express.Router();
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

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

router.use(['/voice', '/consent', '/lang', '/record', '/transcribe'], validateTwilioSignature);

async function logConsent(phone, consented, requestLogger) {
  try {
    await pool.query(
      `INSERT INTO call_consents (phone, consented, timestamp)
       VALUES ($1, $2, NOW())`,
      [phone, consented]
    );
  } catch (error) {
    (requestLogger || logger).error({ err: error, phone }, 'Failed to log consent');
  }
}

router.post('/voice', async (req, res) => {
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
  const transcript = req.body.TranscriptionText || '';
  const phone = req.body.From || req.body.Called || '';

  try {
    const grievanceIntent = await extractIntent(transcript);
    const severityMap = { high: 'High', medium: 'Medium', low: 'Low' };
    const ticketPayload = {
      category: grievanceIntent.category || 'other',
      ward_id: grievanceIntent.ward ? Number(grievanceIntent.ward) || null : null,
      severity: severityMap[String(grievanceIntent.urgency || '').toLowerCase()] || 'Medium'
    };
    const ticket = await createTicket(phone, ticketPayload);
    (req.log || logger).info({ ticketRef: ticket.ref }, 'Ticket created from transcription');

    if (twilioClient && phone) {
      await twilioClient.messages.create({
        to: phone,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: `JanSamvaad: Your complaint has been registered. Ticket ref: ${ticket.ref}. We will resolve it within SLA.`
      });
    }
  } catch (error) {
    (req.log || logger).error({ err: error }, 'Transcription callback failed');
  }

  res.status(200).send('');
});

module.exports = router;
