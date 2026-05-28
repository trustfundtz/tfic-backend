const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || process.env.EMAIL_FROM,
    pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required.' });

    // Check if user exists
    const user = await pool.query('SELECT id, name FROM users WHERE email = $1', [email]);
    
    // Always return success (security - don't reveal if email exists)
    if (user.rows.length === 0) {
      return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
    }

    const { id, name } = user.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // Save token to DB
    await pool.query(
      `INSERT INTO password_resets (user_id, token, expires_at) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id) DO UPDATE SET token=$2, expires_at=$3`,
      [id, token, expires]
    );

    const resetLink = `${process.env.SITE_URL || 'https://tfic-backend.onrender.com'}?reset=${token}`;
    const firstName = name ? name.split(' ')[0] : 'Member';

    await transporter.sendMail({
      from: `"TFIC Security" <${process.env.GMAIL_USER || process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'TFIC — Reset Your Password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#0d1810;padding:28px;text-align:center">
            <h1 style="color:#c9a84c;margin:0;font-size:22px">TRUST FUND INVESTMENT CLUB</h1>
            <p style="color:#a0b0a0;margin:8px 0 0;font-size:13px">Password Reset Request</p>
          </div>
          <div style="padding:32px;background:#f9f9f9">
            <p style="font-size:16px;color:#333">Hello ${firstName},</p>
            <p style="color:#555;line-height:1.6">We received a request to reset your TFIC account password. Click the button below to create a new password.</p>
            <div style="text-align:center;margin:32px 0">
              <a href="${resetLink}" style="background:#c9a84c;color:#0a0f0a;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">
                Reset My Password
              </a>
            </div>
            <p style="color:#888;font-size:13px">This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.</p>
            <p style="color:#888;font-size:12px;margin-top:20px">Or copy this link: <br><span style="color:#1a6632;word-break:break-all">${resetLink}</span></p>
          </div>
          <div style="background:#0d1810;padding:14px;text-align:center">
            <p style="color:#607060;margin:0;font-size:11px">TFIC Security · trustfundinvestmentclub38@gmail.com</p>
          </div>
        </div>`
    });

    return res.json({ success: true, message: 'Reset link sent! Check your email.' });
  } catch (err) {
    console.error('[Forgot Password]', err.message);
    return res.status(500).json({ error: 'Could not send reset email. Please try again.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password required.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    // Find valid token
    const result = await pool.query(
      `SELECT pr.user_id, pr.expires_at FROM password_resets pr 
       WHERE pr.token = $1`,
      [token]
    );

    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired reset link.' });

    const { user_id, expires_at } = result.rows[0];
    if (new Date() > new Date(expires_at)) {
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    // Update password
    const hashed = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, user_id]);
    await pool.query('DELETE FROM password_resets WHERE user_id = $1', [user_id]);

    return res.json({ success: true, message: 'Password updated! You can now sign in.' });
  } catch (err) {
    console.error('[Reset Password]', err.message);
    return res.status(500).json({ error: 'Could not reset password. Please try again.' });
  }
});

module.exports = router;
