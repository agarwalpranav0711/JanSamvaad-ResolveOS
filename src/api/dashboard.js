const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/authenticateToken');
const logger = require('../utils/logger');
const { generateResolutionSummary } = require('../services/llm');

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

router.get('/api/tickets/ai-summary', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         t.id,
         t.ref,
         t.category,
         t.severity,
         t.status,
         t.created_at,
         t.closed_at,
         t.ward_id,
         COALESCE(w.name, 'Ward ' || t.ward_id) AS ward_name
       FROM tickets t
       LEFT JOIN wards w ON w.id = t.ward_id
       WHERE t.status = 'open'
       ORDER BY t.created_at DESC
       LIMIT 5`
    );
    const summary = await generateResolutionSummary(rows);
    res.json(summary);
  } catch (error) {
    (req.log || logger).error({ err: error }, 'Failed to generate AI ticket summary');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ───── PUBLIC ENDPOINTS (no auth) ───── */

router.get('/api/public/stats', async (req, res) => {
  try {
    const { rows: countRows } = await pool.query(
      `SELECT
         COUNT(*)::int AS total_tickets,
         COUNT(*) FILTER (WHERE status = 'closed')::int AS resolved_count,
         COUNT(*) FILTER (WHERE status = 'open')::int AS open_count,
         COUNT(*) FILTER (WHERE status = 'open' AND sla_deadline < NOW())::int AS sla_breached,
         COALESCE(
           ROUND(EXTRACT(EPOCH FROM AVG(closed_at - created_at) FILTER (WHERE status = 'closed')) / 3600, 1),
           0
         ) AS avg_resolution_hours
       FROM tickets`
    );
    const stats = countRows[0];
    const total = stats.total_tickets || 0;
    const resolved = stats.resolved_count || 0;
    const resolution_rate = total === 0 ? 100 : parseFloat(((resolved / total) * 100).toFixed(1));
    const sla_compliance_pct = total === 0 ? 100 : parseFloat((((total - (stats.sla_breached || 0)) / total) * 100).toFixed(1));

    const { rows: catRows } = await pool.query(
      `SELECT category AS name, COUNT(*)::int AS value
       FROM tickets GROUP BY category ORDER BY value DESC`
    );

    const { rows: wardRows } = await pool.query(
      `SELECT
         COALESCE(w.name, 'Ward ' || t.ward_id) AS ward,
         COUNT(*) FILTER (WHERE t.status = 'open')::int AS open,
         COUNT(*) FILTER (WHERE t.status = 'closed')::int AS resolved,
         COUNT(*) FILTER (WHERE t.status = 'open' AND t.sla_deadline < NOW())::int AS sla_breached
       FROM tickets t
       LEFT JOIN wards w ON w.id = t.ward_id
       GROUP BY COALESCE(w.name, 'Ward ' || t.ward_id)
       ORDER BY (COUNT(*) FILTER (WHERE t.status = 'open')) DESC`
    );

    const { rows: trendRows } = await pool.query(
      `SELECT
         TO_CHAR(date_trunc('month', created_at), 'Mon') AS month,
         COUNT(*)::int AS complaints,
         COUNT(*) FILTER (WHERE status = 'closed')::int AS resolved
       FROM tickets
       WHERE created_at >= NOW() - INTERVAL '6 months'
       GROUP BY date_trunc('month', created_at)
       ORDER BY date_trunc('month', created_at)`
    );

    const { rows: recentRows } = await pool.query(
      `SELECT
         t.ref,
         t.category,
         t.closed_at,
         COALESCE(w.name, 'Ward ' || t.ward_id) AS ward_name
       FROM tickets t
       LEFT JOIN wards w ON w.id = t.ward_id
       WHERE t.status = 'closed'
       ORDER BY t.closed_at DESC NULLS LAST
       LIMIT 5`
    );

    res.json({
      total_tickets: total,
      resolved_count: resolved,
      open_count: stats.open_count || 0,
      resolution_rate,
      avg_resolution_hours: parseFloat(stats.avg_resolution_hours) || 0,
      sla_compliance_pct,
      category_breakdown: catRows,
      ward_stats: wardRows,
      monthly_trend: trendRows,
      recent_resolved: recentRows
    });
  } catch (error) {
    (req.log || logger).error({ err: error }, 'Failed to fetch public stats');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/api/public/tickets', async (req, res) => {
  try {
    const { ref } = req.query;
    if (!ref) {
      return res.status(400).json({ error: 'Query parameter "ref" is required' });
    }

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
         t.closed_at,
         c.phone,
         COALESCE(w.name, 'Ward ' || t.ward_id) AS ward_name
       FROM tickets t
       LEFT JOIN contacts c ON c.id = t.contact_id
       LEFT JOIN wards w ON w.id = t.ward_id
       WHERE t.ref = $1
       LIMIT 1`,
      [ref.trim().toUpperCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = rows[0];
    res.json({
      id: ticket.id,
      ref: ticket.ref,
      category: ticket.category,
      severity: ticket.severity,
      status: ticket.status,
      sla_deadline: ticket.sla_deadline,
      evidence_url: ticket.evidence_url,
      created_at: ticket.created_at,
      closed_at: ticket.closed_at,
      phone: maskPhone(ticket.phone),
      ward_name: ticket.ward_name
    });
  } catch (error) {
    (req.log || logger).error({ err: error }, 'Failed to fetch public ticket');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/tickets/:id/feedback', async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { rating, comment } = req.body || {};

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const { rows } = await pool.query('SELECT id FROM tickets WHERE id = $1', [ticketId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    try {
      await pool.query(
        'UPDATE tickets SET citizen_rating = $1, citizen_feedback = $2 WHERE id = $3',
        [rating, comment || null, ticketId]
      );
    } catch (_) {
      // Columns may not exist yet
    }

    (req.log || logger).info({ ticketId, rating, comment }, 'Citizen feedback received');
    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    (req.log || logger).error({ err: error }, 'Failed to save feedback');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/tickets/ref/:ref/feedback', async (req, res) => {
  try {
    const ref = req.params.ref.trim().toUpperCase();
    const { rating, comment } = req.body || {};

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const { rows } = await pool.query('SELECT id FROM tickets WHERE ref = $1', [ref]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    try {
      await pool.query(
        'UPDATE tickets SET citizen_rating = $1, citizen_feedback = $2 WHERE ref = $3',
        [rating, comment || null, ref]
      );
    } catch (_) {
      // Columns may not exist yet
    }

    (req.log || logger).info({ ref, rating, comment }, 'Citizen feedback received (by ref)');
    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    (req.log || logger).error({ err: error }, 'Failed to save feedback');
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
