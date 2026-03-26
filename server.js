const express = require('express');
const http = require('http');
const crypto = require('crypto');
const cors = require('cors');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const pool = require('./src/db');
const { setIo } = require('./src/crm/ticket');
const logger = require('./src/utils/logger');

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  'https://jansamvaad-resolveos.vercel.app',
  'https://jansamvaad-resolveos.vercel.app.',
  'http://localhost:5173'
];

function resolveCorsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }
  if (allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error('Not allowed by CORS'));
}

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

const PORT = Number(process.env.PORT || 3000);
app.set('io', io);
setIo(io);

const voiceWebhookRouter = require('./src/webhooks/voice');
const authRouter = require('./src/api/auth');
const dashboardRouter = require('./src/api/dashboard');
const evidenceRouter = require('./src/api/evidence');

app.use(cors({
  origin: resolveCorsOrigin,
  credentials: true
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  req.log = logger.child({ requestId });
  next();
});

app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch (_) { /* ignore */ }

  res.json({
    status: 'ok',
    uptime: parseFloat(process.uptime().toFixed(2)),
    timestamp: Date.now(),
    version: '1.0.0',
    services: {
      database: dbStatus,
      gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY ? 'configured' : 'not_configured',
      twilio: process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN ? 'configured' : 'not_configured'
    }
  });
});

app.use('/', voiceWebhookRouter);
app.use('/', authRouter);
app.use('/', dashboardRouter);
app.use('/', evidenceRouter);

async function runSlaBreachAlerts() {
  try {
    const { rows } = await pool.query(
      `SELECT id, ref, category, severity, status, sla_deadline, created_at
       FROM tickets
       WHERE status = 'open'
         AND sla_deadline < NOW() + INTERVAL '2 hours'`
    );

    if (rows.length === 0) {
      return;
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const alertEmail = process.env.ALERT_EMAIL;

    const canSendEmail = smtpHost && smtpUser && smtpPass && alertEmail;
    const transporter = canSendEmail
      ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      })
      : null;

    for (const ticket of rows) {
      io.emit('sla_breach', ticket);

      if (!transporter) {
        continue;
      }

      try {
        await transporter.sendMail({
          from: smtpUser,
          to: alertEmail,
          subject: `SLA Breach Alert: Ticket ${ticket.ref}`,
          text: `Ticket ${ticket.ref} is approaching SLA breach.\nCategory: ${ticket.category}\nSeverity: ${ticket.severity}\nDeadline: ${ticket.sla_deadline}`
        });
      } catch (emailError) {
        logger.warn({ err: emailError, ticketRef: ticket.ref }, 'Email notification failed — SMTP unreachable, skipping');
      }
    }
  } catch (error) {
    logger.error({ err: error }, 'SLA breach cron failed');
  }
}

let cronTask = null;
let escalationCronTask = null;
if (process.env.ENABLE_SLA_CRON !== 'false' && process.env.NODE_ENV !== 'test') {
  cronTask = cron.schedule('0 * * * *', () => {
    runSlaBreachAlerts();
  });

  // Auto-escalation: escalate stale open tickets to High severity (Polish 2)
  escalationCronTask = cron.schedule('30 * * * *', async () => {
    try {
      const { rows } = await pool.query(
        `UPDATE tickets
         SET severity = 'High'
         WHERE status = 'open'
           AND severity != 'High'
           AND created_at < NOW() - INTERVAL '24 hours'
         RETURNING id, ref, category, severity, status, sla_deadline, created_at`
      );
      if (rows.length > 0) {
        logger.info({ count: rows.length }, 'Auto-escalated stale tickets to High severity');
        for (const ticket of rows) {
          io.emit('ticket_escalated', ticket);
        }
      }
    } catch (error) {
      logger.warn({ err: error }, 'Auto-escalation cron failed');
    }
  });
}

function startServer() {
  return server.listen(PORT, () => {
    logger.info({ port: PORT }, 'JanSamvaad ResolveOS server listening');

    // Pre-warm Gemini AI on startup (Reliability 1)
    setTimeout(async () => {
      try {
        const { extractIntent } = require('./src/services/llm');
        await extractIntent('test complaint water leak');
        logger.info('Gemini AI pre-warmed successfully');
      } catch (e) {
        logger.warn({ err: e }, 'Gemini pre-warm failed — will retry on first real call');
      }
    }, 5000);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  io,
  server,
  startServer,
  runSlaBreachAlerts,
  cronTask
};
