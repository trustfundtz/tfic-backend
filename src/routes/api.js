// src/routes/api.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendWelcomeEmail, sendMarketUpdate, sendContactReply, notifyAdminNewSignup, notifyAdminNewMessage } = require('../services/emailService');
const { getMarkets, fetchLiveMarkets } = require('../services/marketService');

const router = express.Router();

// ══════════════════════════════════════════
// AUTH ROUTES
// ══════════════════════════════════════════

// POST /api/auth/signup
router.post('/auth/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, city, userType, password, wantsUpdates } = req.body;

    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ error: 'Jaza sehemu zote zinazohitajika' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password lazima iwe na angalau herufi 8' });

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length)
      return res.status(409).json({ error: 'Email hii tayari imesajiliwa' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      `INSERT INTO users (first_name,last_name,email,phone,city,user_type,password_hash,wants_updates)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,first_name,last_name,email,phone,city,user_type,wants_updates,joined_at`,
      [firstName, lastName, email.toLowerCase(), phone||null, city||null, userType||null, hash, wantsUpdates !== false]
    );

    const user = rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' });

    // Send emails (async, don't wait)
    sendWelcomeEmail({ ...user, first_name: user.first_name, last_name: user.last_name }).catch(console.error);
    notifyAdminNewSignup({ ...user, first_name: user.first_name, last_name: user.last_name, user_type: user.user_type }).catch(console.error);

    res.json({ success: true, token, user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, wantsUpdates: user.wants_updates } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Kuna tatizo la seva. Jaribu tena.' });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Weka email na password' });

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email.toLowerCase()]);
    if (!rows.length) return res.status(401).json({ error: 'Hakuna akaunti na email hii' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Password si sahihi' });

    await db.query('UPDATE users SET last_login=NOW(), login_count=login_count+1 WHERE id=$1', [user.id]);

    const token = jwt.sign({ id: user.id, email: user.email, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, wantsUpdates: user.wants_updates } });
  } catch (err) {
    res.status(500).json({ error: 'Kuna tatizo la seva.' });
  }
});

// GET /api/auth/me
router.get('/auth/me', requireAuth, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id,first_name,last_name,email,phone,city,user_type,wants_updates,joined_at,last_login FROM users WHERE id=$1',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Mtumiaji hapatikani' });
  res.json(rows[0]);
});

// ══════════════════════════════════════════
// MARKET ROUTES
// ══════════════════════════════════════════

// GET /api/markets (public)
router.get('/markets', async (req, res) => {
  try {
    const data = await getMarkets();
    res.json(data || { error: 'Data haipatikani kwa sasa' });
  } catch (err) {
    res.status(500).json({ error: 'Market data fetch failed' });
  }
});

// ══════════════════════════════════════════
// CONTACT ROUTES
// ══════════════════════════════════════════

// POST /api/contact
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Jaza sehemu zote zinazohitajika' });

    const { rows } = await db.query(
      `INSERT INTO contact_messages (name,email,phone,subject,message) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [name, email, phone||null, subject||'Ujumbe wa Jumla', message]
    );

    notifyAdminNewMessage({ name, email, phone, subject, message }).catch(console.error);
    res.json({ success: true, id: rows[0].id, message: 'Ujumbe wako umefika! Tutawasiliana nawe hivi karibuni.' });
  } catch (err) {
    res.status(500).json({ error: 'Ujumbe haukutumwa. Jaribu tena.' });
  }
});

// ══════════════════════════════════════════
// NEWSLETTER ROUTES
// ══════════════════════════════════════════

// POST /api/newsletter/subscribe
router.post('/newsletter/subscribe', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Weka email' });

    await db.query(
      `INSERT INTO newsletter_subscribers (email,name) VALUES ($1,$2) ON CONFLICT (email) DO UPDATE SET is_active=true`,
      [email.toLowerCase(), name||null]
    );
    res.json({ success: true, message: 'Umejisajili! Utaanza kupokea TFIC Daily Brief.' });
  } catch (err) {
    res.status(500).json({ error: 'Kuna tatizo. Jaribu tena.' });
  }
});

// GET /api/newsletter/unsubscribe?email=...
router.get('/newsletter/unsubscribe', async (req, res) => {
  const { email } = req.query;
  if (email) {
    await db.query(`UPDATE newsletter_subscribers SET is_active=false WHERE email=$1`, [email]);
    await db.query(`UPDATE users SET wants_updates=false WHERE email=$1`, [email]);
  }
  res.send(`<html><body style="font-family:Arial;background:#050a05;color:#e8ede8;text-align:center;padding:60px"><h2 style="color:#e8c97a">Umefanikiwa</h2><p>Umeondolewa kwenye orodha ya barua za TFIC.</p><a href="${process.env.SITE_URL}" style="color:#2dba56">Rudi TFIC</a></body></html>`);
});

// ══════════════════════════════════════════
// ADMIN ROUTES (protected)
// ══════════════════════════════════════════

// POST /api/admin/login
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Admin credentials si sahihi' });

  const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ success: true, token });
});

// GET /api/admin/stats
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [users, msgs, subs, emails] = await Promise.all([
      db.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE DATE(joined_at)=CURRENT_DATE) as today, COUNT(*) FILTER (WHERE wants_updates=true) as wants_updates FROM users`),
      db.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_read=false) as unread FROM contact_messages`),
      db.query(`SELECT COUNT(*) as total FROM newsletter_subscribers WHERE is_active=true`),
      db.query(`SELECT COUNT(*) as total FROM email_logs WHERE DATE(sent_at)=CURRENT_DATE`),
    ]);
    res.json({
      users: users.rows[0],
      messages: msgs.rows[0],
      subscribers: subs.rows[0],
      emailsToday: emails.rows[0].total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/admin/users', requireAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const search = req.query.search ? `%${req.query.search}%` : null;

  const where = search ? `WHERE email ILIKE $3 OR first_name ILIKE $3 OR last_name ILIKE $3 OR phone ILIKE $3` : '';
  const params = search ? [limit, offset, search] : [limit, offset];

  const { rows } = await db.query(
    `SELECT id,first_name,last_name,email,phone,city,user_type,wants_updates,joined_at,last_login,login_count FROM users ${where} ORDER BY joined_at DESC LIMIT $1 OFFSET $2`,
    params
  );
  const { rows: count } = await db.query(`SELECT COUNT(*) FROM users ${where}`, search ? [search] : []);
  res.json({ users: rows, total: parseInt(count[0].count), page, limit });
});

// GET /api/admin/messages
router.get('/admin/messages', requireAdmin, async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100`
  );
  res.json(rows);
});

// PATCH /api/admin/messages/:id/read
router.patch('/admin/messages/:id/read', requireAdmin, async (req, res) => {
  await db.query(`UPDATE contact_messages SET is_read=true WHERE id=$1`, [req.params.id]);
  res.json({ success: true });
});

// POST /api/admin/messages/:id/reply
router.post('/admin/messages/:id/reply', requireAdmin, async (req, res) => {
  const { replyText } = req.body;
  const { rows } = await db.query(`SELECT * FROM contact_messages WHERE id=$1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Ujumbe haupatikani' });

  const msg = rows[0];
  await sendContactReply(msg.email, msg.name, msg.subject, replyText);
  await db.query(`UPDATE contact_messages SET is_read=true, replied_at=NOW() WHERE id=$1`, [req.params.id]);
  res.json({ success: true });
});

// POST /api/admin/send-market-update (manual trigger)
router.post('/admin/send-market-update', requireAdmin, async (req, res) => {
  try {
    const marketData = await fetchLiveMarkets();
    const result = await sendMarketUpdate(marketData);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/email-logs
router.get('/admin/email-logs', requireAdmin, async (req, res) => {
  const { rows } = await db.query(`SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 200`);
  res.json(rows);
});

// DELETE /api/admin/users/:id
router.delete('/admin/users/:id', requireAdmin, async (req, res) => {
  await db.query(`UPDATE users SET is_active=false WHERE id=$1`, [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
