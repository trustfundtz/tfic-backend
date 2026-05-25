const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.post('/survey', async (req, res) => {
  try {
    const { level, reason, hasInvested, topicInterest, financialGoal, submittedAt } = req.body;
    if (!level || !reason || !hasInvested || !topicInterest || !financialGoal) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const result = await pool.query(
      `INSERT INTO community_surveys (level,reason,has_invested,topic_interest,financial_goal,submitted_at,ip_address) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [level, reason, hasInvested, topicInterest, financialGoal, submittedAt || new Date().toISOString(), ip]
    );
    console.log(`[Community Survey] #${result.rows[0].id} saved`);
    return res.status(201).json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('[Community Survey Error]', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

router.get('/surveys', async (req, res) => {
  try {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (token !== process.env.ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized.' });
    const { rows } = await pool.query('SELECT * FROM community_surveys ORDER BY submitted_at DESC LIMIT 500');
    return res.json({ total: rows.length, surveys: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
