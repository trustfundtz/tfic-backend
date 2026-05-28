// src/server.js — TFIC Backend Main Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const path = require('path');

const apiRoutes = require('./routes/api');
const communityRoutes = require('./routes/community');
const { sendMarketUpdate } = require('./services/emailService');
const { fetchLiveMarkets } = require('./services/marketService');

const app = express();
app.set('trust proxy', 1);
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// ── Security Middleware ──────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Maombi mengi sana. Subiri dakika 15.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Majaribio mengi ya kuingia. Subiri dakika 15.' } });
app.use('/api', limiter);
app.use('/api/forgot', require('./routes/forgot-password'));
app.use('/api/auth', authLimiter);
app.use('/api/community', communityRoutes);
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/chat', require('./routes/chat'));

// ── API Routes ───────────────────────────────────
app.use('/api', apiRoutes);

// ── Admin Dashboard (static HTML) ───────────────
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/index.html')));
app.get('/admin/*', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/index.html')));

// ── Health Check ─────────────────────────────────
app.get('/frontend', (req, res) => res.json({
  name: 'Trust Fund Investment Club API',
  version: '1.0.0',
  status: 'online',
  timestamp: new Date().toISOString(),
}));

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ── 404 Handler ──────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));
app.use((req, res, next) => { res.header('Access-Control-Allow-Origin', '*'); res.header('Access-Control-Allow-Headers', '*'); res.header('Access-Control-Allow-Methods', '*'); next(); });
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.use('*', (req, res) => res.status(404).json({ error: 'Route haipatikani' }));

// ── Error Handler ────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Kuna tatizo la seva' });
});

// ══════════════════════════════════════════════════
// SCHEDULED JOBS (Automatic Market Updates)
// ══════════════════════════════════════════════════

// Market update email — kila siku saa 2 asubuhi EAT (UTC+3 = 23:00 UTC previous day)
// Cron: "0 23 * * *" = 11pm UTC = 2am EAT
cron.schedule('0 23 * * *', async () => {
  console.log('⏰ Running scheduled morning market update...');
  try {
    const marketData = await fetchLiveMarkets();
    const result = await sendMarketUpdate(marketData);
    console.log(`✅ Scheduled update sent: ${result.sent} emails`);
  } catch (err) {
    console.error('❌ Scheduled update failed:', err.message);
  }
}, { timezone: 'UTC' });

// Pre-fetch market data kila dakika 5 (cache update)
cron.schedule('*/5 * * * *', async () => {
  try {
    await fetchLiveMarkets();
  } catch (err) {
    // Silent fail — cache itatumiwa
  }
});

// ── Start Server ─────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║  TRUST FUND INVESTMENT CLUB           ║');
  console.log('║  Backend Server — Running! 🚀         ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');
  console.log(`🌐 API:     http://localhost:${PORT}/api`);
  console.log(`🔧 Admin:   http://localhost:${PORT}/admin`);
  console.log(`❤️  Health:  http://localhost:${PORT}/health`);
  console.log(`🌍 Env:     ${process.env.NODE_ENV}`);
  console.log('');
});

module.exports = app;


