const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/public', async (req, res) => {
  try {
    const [members, courses] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS count FROM users WHERE is_active = true OR created_at IS NOT NULL`),
      pool.query(`SELECT COUNT(*) AS count FROM courses WHERE is_published = true`).catch(() => ({ rows: [{ count: 0 }] }))
    ]);
    const memberCount = parseInt(members.rows[0].count) || 0;
    const courseCount = parseInt(courses.rows[0].count) || 0;
    return res.json({
      memberCount,
      courseCount,
      yearsActive: 5,
      coverageRegion: 'Worldwide',
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    return res.json({ memberCount: null, courseCount: null, yearsActive: 5, coverageRegion: 'Worldwide' });
  }
});

router.get('/admin', async (req, res) => {
  try {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (token !== process.env.ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
    const [members, surveys, chats] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total, COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) AS new_this_month FROM users`),
      pool.query(`SELECT COUNT(*) AS total FROM community_surveys`),
      pool.query(`SELECT COUNT(DISTINCT session_id) AS sessions, COUNT(CASE WHEN should_escalate THEN 1 END) AS escalated FROM chat_messages`)
    ]);
    return res.json({
      members: members.rows[0],
      surveys: surveys.rows[0],
      chats: chats.rows[0],
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
