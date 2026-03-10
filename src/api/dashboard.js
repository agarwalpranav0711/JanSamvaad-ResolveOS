const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/authenticateToken');
const logger = require('../utils/logger');

const router = express.Router();

function maskPhone(phone) {
  if (!phone || phone.length < 4) {
    return phone || null;
  }

  const normalized = String(phone);
  const prefix = normalized.startsWith('+91') ? '+91' : normalized.slice(0, 2);
  const suffix = normalized.slice(-4);
  return `${prefix}******${suffix}`;
}

router.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         t.id,
         t.ref,
         t.category,
         t.severity,
         t.status,
         t.sla_deadline,
         t.evidence_url,
         t.created_at,
         c.phone,
         w.id AS ward_id
       FROM tickets t
       LEFT JOIN contacts c ON c.id = t.contact_id
       LEFT JOIN wards w ON w.id = t.ward_id
       ORDER BY t.created_at DESC
       LIMIT 50`
    );

    const tickets = rows.map((row) => ({
      id: row.id,
      ref: row.ref,
      category: row.category,
      ward_id: row.ward_id,
      severity: row.severity,
      status: row.status,
      sla_deadline: row.sla_deadline,
      created_at: row.created_at,
      evidence_url: row.evidence_url,
      phone: maskPhone(row.phone)
    }));

    res.json(tickets);
  } catch (error) {
    (req.log || logger).error({ err: error }, 'Failed to fetch tickets');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'open')::int AS open,
         COUNT(*) FILTER (WHERE status = 'closed')::int AS closed,
         COUNT(*) FILTER (
           WHERE status = 'open'
             AND sla_deadline <= NOW() + INTERVAL '12 hours'
         )::int AS breach_risk
       FROM tickets`
    );

    const open = rows[0].open || 0;
    const closed = rows[0].closed || 0;
    const total = open + closed;
    const slaHitRate = total === 0 ? '100.0%' : `${((closed / total) * 100).toFixed(1)}%`;

    res.json({
      open,
      closed,
      breach_risk: rows[0].breach_risk || 0,
      slaHitRate
    });
  } catch (error) {
    (req.log || logger).error({ err: error }, 'Failed to fetch dashboard stats');
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
