// src/middleware/auth.js
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Unahitaji kuingia kwanza' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token si sahihi au imekwisha' });
  }
}

function requireAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') ||
                  req.headers['x-admin-token'] ||
                  req.query.token;
    if (!token) return res.status(401).json({ error: 'Admin access inahitajika' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Huna ruhusa' });
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Admin token si sahihi' });
  }
}

module.exports = { requireAuth, requireAdmin };
