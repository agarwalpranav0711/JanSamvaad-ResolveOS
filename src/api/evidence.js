const express = require('express');
const crypto = require('crypto');
const twilio = require('twilio');
const pool = require('../db');
const authenticateToken = require('../middleware/authenticateToken');
const logger = require('../utils/logger');

const router = express.Router();

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFromNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioClient = twilioAccountSid && twilioAuthToken
  ? twilio(twilioAccountSid, twilioAuthToken)
  : null;

function generateEvidenceHash(seed) {
  return crypto
    .createHash('sha256')
    .update(`${seed}:${new Date().toISOString()}`)
    .digest('hex');
}

function buildEvidenceUploadUrl(hash) {
  const evidenceBaseUrl = process.env.EVIDENCE_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000';
  return `${evidenceBaseUrl.replace(/\/$/, '')}/evidence/${hash}`;
}

router.post('/api/evidence/upload', authenticateToken, async (req, res) => {
  const ticketId = Number(req.body.ticket_id);

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    res.status(400).json({ error: 'Invalid ticket_id' });
    return;
  }

  const evidenceHash = generateEvidenceHash(`evidence-upload:${ticketId}`);
  const uploadUrl = buildEvidenceUploadUrl(evidenceHash);

  try {
    const { rows } = await pool.query(
      `UPDATE tickets
       SET evidence_url = $2
       WHERE id = $1
       RETURNING id, ref, category, ward_id, severity, status, sla_deadline, created_at, closed_at, evidence_url`,
      [ticketId, uploadUrl]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    res.json({
      hash: evidenceHash,
      url: uploadUrl,
      ticket_id: ticketId,
      evidence_hash: evidenceHash,
      upload_url: uploadUrl,
      ticket: rows[0]
    });
  } catch (error) {
    (req.log || logger).error({ err: error, ticketId }, 'Failed to generate evidence upload URL');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/tickets/:id/resolve', authenticateToken, async (req, res) => {
  const ticketId = Number(req.params.id);

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    res.status(400).json({ error: 'Invalid ticket id' });
    return;
  }

  const dbClient = await pool.connect();
  let transactionStarted = false;

  try {
    await dbClient.query('BEGIN');
    transactionStarted = true;

    const ticketResult = await dbClient.query(
      `SELECT
         t.id,
         t.ref,
         t.status,
         t.evidence_url,
         c.phone
       FROM tickets t
       JOIN contacts c ON c.id = t.contact_id
       WHERE t.id = $1
       LIMIT 1`,
      [ticketId]
    );

    if (ticketResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      transactionStarted = false;
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const ticket = ticketResult.rows[0];

    if (!ticket.phone) {
      await dbClient.query('ROLLBACK');
      transactionStarted = false;
      res.status(400).json({ error: 'Citizen phone number not available for this ticket' });
      return;
    }

    const resolutionHash = generateEvidenceHash(`ticket-resolve:${ticket.ref}`);
    const fallbackUploadUrl = buildEvidenceUploadUrl(resolutionHash);

    const updatedTicketResult = await dbClient.query(
      `UPDATE tickets
       SET status = 'closed',
           closed_at = NOW(),
           evidence_url = COALESCE(evidence_url, $2)
       WHERE id = $1
       RETURNING id, ref, category, ward_id, severity, status, sla_deadline, created_at, closed_at, evidence_url`,
      [ticketId, fallbackUploadUrl]
    );

    const updatedTicket = updatedTicketResult.rows[0];

    if (!twilioClient || !twilioFromNumber) {
      throw new Error('Twilio client or sender phone number is not configured');
    }

    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const resolutionCardUrl = `${appBaseUrl.replace(/\/$/, '')}/card/${resolutionHash}`;
    const evidenceUploadUrl = updatedTicket.evidence_url || fallbackUploadUrl;
    await twilioClient.messages.create({
      to: ticket.phone,
      from: twilioFromNumber,
      body: `JanSamvaad Update: Your ticket ${ticket.ref} is resolved. Upload final evidence here: ${evidenceUploadUrl}. Resolution Card: ${resolutionCardUrl}`
    });

    await dbClient.query('COMMIT');
    transactionStarted = false;

    const io = req.app.get('io');
    if (io) {
      io.emit('ticket_resolved', updatedTicket);
    }

    res.json(updatedTicket);
  } catch (error) {
    if (transactionStarted) {
      await dbClient.query('ROLLBACK');
    }

    (req.log || logger).error({ err: error, ticketId }, 'Failed to resolve ticket');
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    dbClient.release();
  }
});

module.exports = router;
