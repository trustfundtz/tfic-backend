// src/services/emailService.js
require('dotenv').config();
const nodemailer = require('nodemailer');
const db = require('../db');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ── Email Templates ──────────────────────────────────

function welcomeTemplate(user) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:'Outfit',Arial,sans-serif;background:#050a05;color:#e8ede8;margin:0;padding:0}
.wrap{max-width:600px;margin:0 auto;background:#0d160d;border:1px solid rgba(100,200,80,.15)}
.header{background:linear-gradient(135deg,#090f09,#0d180d);padding:40px;text-align:center;border-bottom:1px solid rgba(100,200,80,.15)}
.logo-text{font-size:24px;font-weight:700;color:#e8c97a;letter-spacing:.04em}
.logo-sub{font-size:11px;color:#607060;letter-spacing:.18em;text-transform:uppercase;margin-top:4px}
.body{padding:40px}
.title{font-size:28px;font-weight:600;color:#e8ede8;margin-bottom:12px}
.subtitle{color:#c9a84c;font-style:italic;font-size:16px;margin-bottom:24px}
.text{color:#a0b0a0;font-size:15px;line-height:1.8;margin-bottom:20px}
.btn{display:inline-block;padding:14px 32px;background:#2dba56;color:#030603;font-weight:600;text-decoration:none;border-radius:8px;font-size:14px;margin:16px 0}
.stat-row{display:flex;gap:16px;margin:24px 0;flex-wrap:wrap}
.stat{flex:1;background:#111b11;border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:16px;text-align:center;min-width:120px}
.stat-val{font-size:22px;font-weight:600;color:#e8c97a}
.stat-lbl{font-size:11px;color:#607060;text-transform:uppercase;letter-spacing:.06em;margin-top:4px}
.divider{border:none;border-top:1px solid rgba(255,255,255,.06);margin:24px 0}
.footer{padding:24px 40px;background:#080e08;text-align:center;border-top:1px solid rgba(255,255,255,.06)}
.footer-text{font-size:11px;color:#607060;line-height:1.8}
.green{color:#4edd74}.gold{color:#e8c97a}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo-text">TRUST FUND</div>
    <div class="logo-sub">Investment Club · Tanzania</div>
  </div>
  <div class="body">
    <div class="title">Karibu kwenye TFIC, <span class="gold">${user.first_name}</span>! 🎉</div>
    <div class="subtitle">Empowering Financial Freedom in Tanzania</div>
    <p class="text">Hongera kwa kujiunga na <strong class="gold">Trust Fund Investment Club</strong> — jukwaa la kwanza la elimu ya fedha Tanzania. Unajiunga na familia ya wawekezaji wanaokua kila siku.</p>
    <div class="stat-row">
      <div class="stat"><div class="stat-val">12,400+</div><div class="stat-lbl">Wanachama</div></div>
      <div class="stat"><div class="stat-val">340+</div><div class="stat-lbl">Kozi & Mwongozo</div></div>
      <div class="stat"><div class="stat-val">5+</div><div class="stat-lbl">Miaka ya Uzoefu</div></div>
    </div>
    <hr class="divider">
    <p class="text"><strong>Utapata nini kama mwanachama?</strong></p>
    <p class="text">✅ <span class="green">Market Updates za Kila Siku</span> — viwango vya forex, crypto, na masoko ya ulimwengu<br>
    ✅ <span class="green">Makala ya Uchambuzi</span> — analysis ya kina kwa lugha unayoielewa<br>
    ✅ <span class="green">Zana za Uwekezaji</span> — calculator, currency converter, na zaidi<br>
    ✅ <span class="green">Jamii ya Wawekezaji</span> — WhatsApp, Telegram, na matukio ya ana kwa ana</p>
    <a href="${process.env.SITE_URL}" class="btn">Tembelea TFIC →</a>
    <hr class="divider">
    <p class="text" style="font-size:13px">Taarifa zako: <strong>${user.email}</strong> ${user.phone ? '· ' + user.phone : ''} ${user.city ? '· ' + user.city : ''}</p>
  </div>
  <div class="footer">
    <div class="footer-text">© 2026 Trust Fund Investment Club · Dar es Salaam, Tanzania 🇹🇿<br>
    Unataka kuacha kupokea barua? <a href="${process.env.SITE_URL}/unsubscribe?email=${user.email}" style="color:#c9a84c">Bonyeza hapa</a></div>
  </div>
</div>
</body>
</html>`;
}

function marketUpdateTemplate(data, recipientName) {
  const r = data.forex || {};
  const c = data.crypto || {};
  const fmt = (n, d=2) => n ? Number(n).toLocaleString('en-US', {minimumFractionDigits:d,maximumFractionDigits:d}) : '—';
  const chgColor = (n) => (n >= 0) ? '#4edd74' : '#e05555';
  const chgStr = (n) => n ? `${n>=0?'▲ +':'▼ '}${Math.abs(n).toFixed(2)}%` : '—';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;background:#050a05;color:#e8ede8;margin:0;padding:0}
.wrap{max-width:600px;margin:0 auto;background:#0d160d;border:1px solid rgba(100,200,80,.15)}
.header{background:linear-gradient(135deg,#090f09,#0d180d);padding:32px 40px;border-bottom:1px solid rgba(100,200,80,.15);display:flex;justify-content:space-between;align-items:center}
.logo-text{font-size:20px;font-weight:700;color:#e8c97a}
.date-badge{font-size:11px;color:#607060;background:#111b11;padding:6px 12px;border-radius:100px;border:1px solid rgba(255,255,255,.06)}
.body{padding:32px 40px}
.greeting{font-size:22px;font-weight:600;margin-bottom:6px}
.subline{color:#a0b0a0;font-size:14px;margin-bottom:28px}
.section-title{font-size:11px;color:#c9a84c;text-transform:uppercase;letter-spacing:.12em;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.section-title::before{content:'';flex:1;height:1px;background:rgba(201,168,76,.2)}
.market-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:28px}
.market-item{background:#111b11;border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:14px}
.m-name{font-size:10px;color:#607060;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
.m-price{font-size:18px;font-weight:600;color:#e8ede8;margin-bottom:2px}
.m-chg{font-size:12px}
.divider{border:none;border-top:1px solid rgba(255,255,255,.06);margin:20px 0}
.tip-box{background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.2);border-radius:10px;padding:18px;margin-bottom:24px}
.tip-title{font-size:13px;font-weight:600;color:#e8c97a;margin-bottom:8px}
.tip-text{font-size:13px;color:#a0b0a0;line-height:1.7}
.btn{display:inline-block;padding:12px 28px;background:#2dba56;color:#030603;font-weight:600;text-decoration:none;border-radius:8px;font-size:13px}
.footer{padding:20px 40px;background:#080e08;text-align:center;border-top:1px solid rgba(255,255,255,.06)}
.footer-text{font-size:11px;color:#607060;line-height:1.8}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <div><div class="logo-text">📊 TFIC Market Brief</div></div>
    <div class="date-badge">${new Date().toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})}</div>
  </div>
  <div class="body">
    <div class="greeting">Habari za Masoko, ${recipientName || 'Mwanachama'}!</div>
    <div class="subline">Hapa ni muhtasari wa masoko ya leo — viwango vya sasa.</div>

    <div class="section-title">Forex Markets</div>
    <div class="market-grid">
      <div class="market-item"><div class="m-name">USD / TZS</div><div class="m-price">${fmt(r.TZS, 2)}</div><div class="m-chg" style="color:${chgColor(0.38)}">${chgStr(0.38)}</div></div>
      <div class="market-item"><div class="m-name">USD / KES</div><div class="m-price">${fmt(r.KES, 2)}</div><div class="m-chg" style="color:${chgColor(-0.32)}">${chgStr(-0.32)}</div></div>
      <div class="market-item"><div class="m-name">EUR / USD</div><div class="m-price">${r.EUR ? (1/r.EUR).toFixed(4) : '—'}</div><div class="m-chg" style="color:${chgColor(0.24)}">${chgStr(0.24)}</div></div>
      <div class="market-item"><div class="m-name">GBP / USD</div><div class="m-price">${r.GBP ? (1/r.GBP).toFixed(4) : '—'}</div><div class="m-chg" style="color:${chgColor(0.15)}">${chgStr(0.15)}</div></div>
    </div>

    <div class="section-title">Crypto Markets</div>
    <div class="market-grid">
      <div class="market-item"><div class="m-name">Bitcoin (BTC)</div><div class="m-price">$${fmt(c.BTC?.price, 0)}</div><div class="m-chg" style="color:${chgColor(c.BTC?.chg)}">${chgStr(c.BTC?.chg)}</div></div>
      <div class="market-item"><div class="m-name">Ethereum (ETH)</div><div class="m-price">$${fmt(c.ETH?.price, 0)}</div><div class="m-chg" style="color:${chgColor(c.ETH?.chg)}">${chgStr(c.ETH?.chg)}</div></div>
    </div>

    <hr class="divider">
    <div class="tip-box">
      <div class="tip-title">💡 Ufahamu wa Leo</div>
      <div class="tip-text">USD/TZS inaendelea kushikilia nguvu. Kwa waagizaji wa bidhaa kutoka nje, ni wakati mzuri wa kupanga malipo mapema. Kwa wawekezaji wa crypto, BTC imeonyesha nguvu — angalia viwango vya usaidizi kabla ya kuingia.</div>
    </div>
    <a href="${process.env.SITE_URL}" class="btn">Tembelea TFIC kwa Uchambuzi Zaidi →</a>
  </div>
  <div class="footer">
    <div class="footer-text">© 2026 Trust Fund Investment Club · Tanzania 🇹🇿<br>
    <a href="${process.env.SITE_URL}/unsubscribe?email=" style="color:#c9a84c">Acha kupokea</a> · <a href="${process.env.SITE_URL}" style="color:#c9a84c">Tembelea TFIC</a></div>
  </div>
</div>
</body>
</html>`;
}

// ── Send Functions ────────────────────────────────────

async function sendWelcomeEmail(user) {
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: user.email,
      subject: `🎉 Karibu TFIC, ${user.first_name}! Akaunti yako iko tayari`,
      html: welcomeTemplate(user),
    });
    await db.query(`INSERT INTO email_logs (type,recipient,subject,status) VALUES ($1,$2,$3,$4)`,
      ['welcome', user.email, `Karibu TFIC, ${user.first_name}!`, 'sent']);
    console.log(`✅ Welcome email sent to ${user.email}`);
    return true;
  } catch (err) {
    console.error(`❌ Welcome email failed for ${user.email}:`, err.message);
    await db.query(`INSERT INTO email_logs (type,recipient,subject,status) VALUES ($1,$2,$3,$4)`,
      ['welcome', user.email, 'Welcome', 'failed']);
    return false;
  }
}

async function sendMarketUpdate(marketData) {
  try {
    // Pata wanachama wote wanaotaka updates
    const { rows: subscribers } = await db.query(
      `SELECT id, first_name, email FROM users WHERE wants_updates = true AND is_active = true`
    );
    // Pia newsletter subscribers
    const { rows: nlSubs } = await db.query(
      `SELECT email, name FROM newsletter_subscribers WHERE is_active = true`
    );

    const allRecipients = [
      ...subscribers.map(u => ({ email: u.email, name: u.first_name })),
      ...nlSubs.filter(n => !subscribers.find(u => u.email === n.email)).map(n => ({ email: n.email, name: n.name || 'Mwanachama' }))
    ];

    let sent = 0;
    for (const recipient of allRecipients) {
      try {
        await transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: recipient.email,
          subject: `📊 TFIC Market Brief — ${new Date().toLocaleDateString('en-GB', {day:'numeric',month:'short'})}`,
          html: marketUpdateTemplate(marketData, recipient.name),
        });
        sent++;
        // Pause ndogo kati ya emails (Gmail limit)
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.error(`Failed for ${recipient.email}: ${e.message}`);
      }
    }

    await db.query(`INSERT INTO email_logs (type,recipient,subject,status) VALUES ($1,$2,$3,$4)`,
      ['market_update', `${sent} recipients`, `Market Brief ${new Date().toLocaleDateString()}`, 'sent']);

    console.log(`✅ Market update sent to ${sent}/${allRecipients.length} subscribers`);
    return { sent, total: allRecipients.length };
  } catch (err) {
    console.error('Market update failed:', err.message);
    return { sent: 0, error: err.message };
  }
}

async function sendContactReply(toEmail, toName, subject, replyText) {
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: toEmail,
      subject: `Re: ${subject} — TFIC`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#050a05;color:#e8ede8;padding:40px;max-width:600px;margin:0 auto">
          <h2 style="color:#e8c97a">Trust Fund Investment Club</h2>
          <p>Habari ${toName},</p>
          <p style="line-height:1.8;color:#a0b0a0">${replyText}</p>
          <hr style="border-color:rgba(255,255,255,.06)">
          <p style="font-size:12px;color:#607060">TFIC Team · Dar es Salaam, Tanzania 🇹🇿</p>
        </div>`,
    });
    return true;
  } catch (err) {
    console.error('Reply email failed:', err.message);
    return false;
  }
}

async function notifyAdminNewSignup(user) {
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `🆕 TFIC: Mwanachama Mpya — ${user.first_name} ${user.last_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#050a05;color:#e8ede8;padding:40px;max-width:600px;margin:0 auto">
          <h2 style="color:#e8c97a">Mwanachama Mpya Amejiunga! 🎉</h2>
          <table style="width:100%;border-collapse:collapse">
            ${[
              ['Jina', `${user.first_name} ${user.last_name}`],
              ['Email', user.email],
              ['Simu', user.phone || '—'],
              ['Mji', user.city || '—'],
              ['Aina', user.user_type || '—'],
              ['Market Updates', user.wants_updates ? 'Ndio ✅' : 'Hapana'],
              ['Tarehe', new Date().toLocaleString('sw-TZ')],
            ].map(([k,v]) => `<tr><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.06);color:#607060;font-size:13px">${k}</td><td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.06);font-size:13px">${v}</td></tr>`).join('')}
          </table>
          <a href="${process.env.SITE_URL}/admin" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#2dba56;color:#030603;text-decoration:none;border-radius:8px;font-weight:600">Angalia Admin Dashboard →</a>
        </div>`,
    });
  } catch (err) {
    console.error('Admin notification failed:', err.message);
  }
}

async function notifyAdminNewMessage(msg) {
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `📩 TFIC: Ujumbe Mpya — ${msg.subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#050a05;color:#e8ede8;padding:40px;max-width:600px;margin:0 auto">
          <h2 style="color:#e8c97a">Ujumbe Mpya wa Mawasiliano</h2>
          <p><strong>Kutoka:</strong> ${msg.name} &lt;${msg.email}&gt;</p>
          <p><strong>Simu:</strong> ${msg.phone || '—'}</p>
          <p><strong>Mada:</strong> ${msg.subject}</p>
          <hr style="border-color:rgba(255,255,255,.06)">
          <p style="line-height:1.8;color:#a0b0a0">${msg.message}</p>
          <a href="${process.env.SITE_URL}/admin#messages" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#c9a84c;color:#0a0f0a;text-decoration:none;border-radius:8px;font-weight:600">Angalia na Jibu →</a>
        </div>`,
    });
  } catch (err) {
    console.error('Admin message notification failed:', err.message);
  }
}

module.exports = { sendWelcomeEmail, sendMarketUpdate, sendContactReply, notifyAdminNewSignup, notifyAdminNewMessage };
