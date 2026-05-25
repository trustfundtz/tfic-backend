const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const nodemailer = require('nodemailer');

// ═══════════════════════════════════════════════════════════════
// ARIA Smart Response Engine — No external API needed
// Professional rule-based AI for TFIC
// ═══════════════════════════════════════════════════════════════

const RESPONSES = {
  greet: [
    "Hello! 👋 Welcome to Trust Fund Investment Club. I'm ARIA, your personal investment assistant. How can I help you today?",
    "Welcome to TFIC! 🌍 I'm ARIA — here to guide you through our investment education platform. What would you like to explore?",
    "Good day! Welcome to Trust Fund Investment Club. I'm ARIA, ready to assist you with forex, gold, financial education, and more. What can I help you with?"
  ],
  forex: [
    "📊 **Forex Trading at TFIC**\n\nOur Forex Education program covers everything from currency pair basics to advanced technical analysis. We specialize in:\n\n• USD/TZS and East African currency pairs\n• Technical & fundamental analysis\n• Risk management strategies\n• Trading psychology & discipline\n\nWould you like to join our free forex education program?",
    "💱 Great question about Forex! TFIC provides professional forex education covering major pairs (EUR/USD, GBP/USD) and African pairs (USD/TZS, USD/KES).\n\nOur curriculum is designed for all levels — from complete beginners to experienced traders looking to refine their strategy.\n\nWould you like to get started with our beginner forex course?",
    "📈 Forex trading is one of our core specializations at TFIC. Our research team provides daily market analysis, key level breakdowns, and educational content to help you trade with confidence.\n\nNote: All our content is educational. We recommend always conducting your own research before trading.\n\nShall I tell you more about our forex education program?"
  ],
  gold: [
    "🥇 **Gold Investment Education at TFIC**\n\nGold (XAU/USD) is currently trading around $4,510 — making it one of the most important assets for portfolio diversification.\n\nOur gold investment education covers:\n• Gold market fundamentals\n• How to analyze XAU/USD\n• Gold as an inflation hedge\n• Portfolio allocation strategies\n\nInterested in learning more about gold investment?",
    "🥇 Gold is an excellent topic! At TFIC, we provide in-depth education on commodity investing, with a focus on gold as a long-term wealth preservation asset.\n\nOur specialists can guide you on understanding gold market drivers, central bank policies, and how to position gold within a diversified portfolio.\n\nWould you like to speak with our commodities education team?",
  ],
  education: [
    "🎓 **Financial Education at TFIC**\n\nWe offer structured learning programs for all levels:\n\n📗 **Beginner** — Money management, saving, budgeting basics\n📘 **Intermediate** — Stocks, bonds, portfolio construction\n📕 **Advanced** — Forex, derivatives, proprietary systems\n\nAll courses are developed by certified financial professionals. Ready to start your learning journey?",
    "🎓 Education is the foundation of everything we do at TFIC! Our programs are designed to take you from financial basics to professional-level investing.\n\nAvailable now: Money Management 101, Stock Market Introduction, Forex Starter Pack.\n\nWould you like to enroll in a free course today?",
  ],
  membership: [
    "🤝 **Joining TFIC**\n\nBecoming a TFIC member is completely free! As a member you get:\n\n✅ Access to live market data\n✅ Daily market analysis & insights\n✅ Financial education courses\n✅ Investor community access\n✅ Event & webinar invitations\n\nTo join:\n1. Click 'Join Club' on our website\n2. Fill in your details\n3. Start your investment journey!\n\nWould you like to register now?",
    "🌍 Welcome — you're making a great decision by considering TFIC membership!\n\nMembership is free and gives you full access to our market analysis, education platform, and exclusive investor community.\n\nShall I guide you through the registration process?",
  ],
  community: [
    "💬 **TFIC WhatsApp Community**\n\nOur WhatsApp Community is where our members connect daily — sharing market insights, discussing opportunities, and learning together.\n\n⚠️ Note: Community membership is admin-reviewed to ensure quality discussions.\n\nTo join: Click 'Join Community' on our website and complete the short questionnaire. Our team will approve your application shortly.\n\nReady to join the community?",
  ],
  market: [
    "📊 **Live Market Analysis**\n\nTFIC provides daily and weekly market analysis across:\n\n• 💱 Forex: USD/TZS, EUR/USD, GBP/USD, USD/KES\n• 🥇 Gold: XAU/USD — currently ~$4,510\n• ₿ Crypto: Bitcoin, Ethereum, major altcoins\n• 📈 Stocks: DSE and global equities\n\nOur research team publishes analysis every market day. Visit our Markets page for live rates.\n\nWould you like to see our latest market analysis?",
  ],
  mentorship: [
    "👤 **TFIC Mentorship Program**\n\nOur mentorship program connects you 1-on-1 with experienced investors who can guide your financial journey.\n\n**What you get:**\n• Personalized investment guidance\n• Portfolio review & feedback\n• Accountability & goal tracking\n• Network access\n\nTo apply: Visit our Mentorship page and submit your application. Our team matches you within 3 business days.\n\nInterested in applying for mentorship?",
  ],
  events: [
    "📅 **Upcoming TFIC Events**\n\nWe host regular live webinars, workshops, and investor meetups:\n\n🟢 **June 5** — Forex Fundamentals: USD/TZS Deep Dive (Webinar)\n🟡 **June 14** — Investment Portfolio Workshop, Dar es Salaam\n🔴 **June 22** — Q2 2026 Market Review (Live)\n\nAll events are free for TFIC members!\n\nWould you like to register for any of these events?",
  ],
  contact: [
    "📞 **Contact TFIC Directly**\n\nOur team is available through multiple channels:\n\n📱 **Phone/WhatsApp:** +255 692 317 297\n📧 **Email:** trustfundinvestmentclub38@gmail.com\n🌍 **Location:** Dar es Salaam, Tanzania (online services worldwide)\n\n**Business hours:** Monday – Friday, 8:00 AM – 5:00 PM EAT\n\nFor fastest response, WhatsApp is recommended. How else can I assist you?",
  ],
  pricing: [
    "💰 **TFIC Pricing**\n\nGreat news — most of our services are completely **free**!\n\n✅ Free membership registration\n✅ Free beginner courses\n✅ Free live market data\n✅ Free daily market analysis\n✅ Free WhatsApp community access\n\nPremium programs (advanced courses, personalized mentorship) will be introduced in future. For now, everything is accessible at no cost.\n\nReady to register for free?",
  ],
  thanks: [
    "You're very welcome! 😊 It's a pleasure assisting you. Is there anything else I can help you with today?",
    "Happy to help! 🤝 TFIC is here to support your investment journey. Feel free to ask anything else.",
    "Of course! Don't hesitate to reach out anytime. Is there another topic I can assist you with?"
  ],
  default: [
    "Thank you for reaching out to TFIC! 🌍 Our team is dedicated to providing you with the best investment education and support.\n\nI can help you with:\n• 💱 Forex Trading\n• 🥇 Gold Investment  \n• 🎓 Financial Education\n• 🤝 Membership Information\n• 📊 Market Analysis\n• 👤 Mentorship\n\nWhat would you like to know more about?",
    "Great question! Our support specialists are here to assist. For immediate assistance, you can also reach us at:\n\n📱 WhatsApp: +255 692 317 297\n📧 Email: trustfundinvestmentclub38@gmail.com\n\nAlternatively, select a topic below and I'll guide you right away.",
    "I appreciate your message! 🙏 TFIC is dedicated to your financial growth and education.\n\nCould you tell me more about what you're looking for? Whether it's forex, gold, financial education, or community support — our team is ready to assist!"
  ]
};

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectTopic(text) {
  const t = text.toLowerCase();
  if (/\b(hi|hello|hey|salaam|habari|good morning|good evening|good afternoon|howdy|greetings)\b/.test(t)) return 'greet';
  if (/\b(forex|fx|currency|trading|trade|pip|lot|leverage|eur|gbp|usd|tzs|kes|pair|chart|technical|fundamental|mt4|mt5|metatrader|broker)\b/.test(t)) return 'forex';
  if (/\b(gold|xau|commodit|precious|metal|silver|platinum|oz|ounce)\b/.test(t)) return 'gold';
  if (/\b(educat|cours|learn|study|lesson|train|certif|beginner|intermediate|advanced|financial literacy|book|guide|tutorial)\b/.test(t)) return 'education';
  if (/\b(join|member|register|sign up|signup|enroll|account|membership|how to join|become)\b/.test(t)) return 'membership';
  if (/\b(whatsapp|community|group|chat|join group|invite)\b/.test(t)) return 'community';
  if (/\b(market|analysis|rate|price|live|bitcoin|btc|eth|crypto|stock|dse|share|equity|oil|index)\b/.test(t)) return 'market';
  if (/\b(mentor|coach|guidance|1on1|one on one|personal|advisor|guide me)\b/.test(t)) return 'mentorship';
  if (/\b(event|webinar|workshop|seminar|session|live session|upcoming|calendar)\b/.test(t)) return 'events';
  if (/\b(contact|phone|email|whatsapp|call|reach|location|address|office|support)\b/.test(t)) return 'contact';
  if (/\b(price|cost|fee|pay|payment|free|charge|subscription|how much)\b/.test(t)) return 'pricing';
  if (/\b(thank|thanks|appreciate|asante|great|awesome|perfect|excellent|good)\b/.test(t)) return 'thanks';
  return 'default';
}

function shouldEscalate(text) {
  const t = text.toLowerCase();
  return /\b(human|manager|hassan|ceo|founder|person|agent|real person|speak to someone|urgent|complaint|angry|frustrated|lawsuit|legal|refund|money back|lost money|scam)\b/.test(t);
}

// ── POST /api/chat/ai ────────────────────────────────────────────
router.post('/ai', async (req, res) => {
  try {
    const { messages, sessionId, topic } = req.body;

    // Get last user message
    const lastMsg = (messages || []).filter(m => m.role === 'user').pop();
    const userText = lastMsg ? lastMsg.content : '';

    // Detect topic & generate response
    const detectedTopic = detectTopic(userText);
    const responseArr = RESPONSES[detectedTopic] || RESPONSES.default;
    const aiText = getRandom(responseArr);
    const escalate = shouldEscalate(userText);

    // Save to DB (non-blocking)
    if (sessionId) {
      pool.query(
        `INSERT INTO chat_messages(session_id,role,content,topic,should_escalate,created_at) VALUES($1,'assistant',$2,$3,$4,NOW())`,
        [sessionId, aiText, detectedTopic, escalate]
      ).catch(() => {});
    }

    console.log(`[Chat AI] Topic: ${detectedTopic} | Escalate: ${escalate}`);
    return res.json({ message: aiText, shouldEscalate: escalate });

  } catch (err) {
    console.error('[Chat AI Error]', err.message);
    return res.json({
      message: "Thank you for contacting TFIC! 🤝 Our team is available at trustfundinvestmentclub38@gmail.com or WhatsApp +255 692 317 297. How can I assist you today?",
      shouldEscalate: false
    });
  }
});

// ── POST /api/chat/save ─────────────────────────────────────────
router.post('/save', async (req, res) => {
  try {
    const { sessionId, role, content, topic, userName, userEmail } = req.body;
    if (!sessionId || !role || !content) return res.status(400).json({ error: 'Missing fields' });
    await pool.query(
      `INSERT INTO chat_messages(session_id,role,content,topic,user_name,user_email,created_at) VALUES($1,$2,$3,$4,$5,$6,NOW())`,
      [sessionId, role, content, topic || null, userName || null, userEmail || null]
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Save failed' });
  }
});

// ── POST /api/chat/notify ───────────────────────────────────────
router.post('/notify', async (req, res) => {
  try {
    const { sessionId, userName, userEmail, userMessage, topic, chatHistory } = req.body;
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || process.env.EMAIL_FROM,
        pass: process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS
      }
    });
    const hist = (chatHistory || []).map(m => `${m.role === 'user' ? 'Client' : 'ARIA'}: ${m.content}`).join('\n\n');
    const time = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
    await transporter.sendMail({
      from: `"TFIC ARIA Chat" <${process.env.GMAIL_USER || process.env.EMAIL_FROM}>`,
      to: 'trustfundinvestmentclub38@gmail.com',
      subject: `🔔 Chat Escalation — ${topic || 'General'} | ${time} EAT`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px">
        <h2 style="color:#c9a84c;background:#0d1810;padding:20px;margin:0">TFIC Chat Alert 🔔</h2>
        <div style="padding:20px;background:#f9f9f9">
          <p><b>Client:</b> ${userName || 'Anonymous'}</p>
          <p><b>Email:</b> ${userEmail || 'Not provided'}</p>
          <p><b>Topic:</b> ${topic || 'General Support'}</p>
          <p><b>Time (EAT):</b> ${time}</p>
          <p><b>Last Message:</b> "${userMessage}"</p>
          <hr>
          <p><b>Chat History:</b></p>
          <pre style="background:#fff;padding:12px;border:1px solid #ddd;font-size:12px">${hist}</pre>
          <a href="https://wa.me/255692317297" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#25D366;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">💬 Reply on WhatsApp</a>
        </div>
      </div>`
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('[Notify Error]', err.message);
    return res.status(500).json({ error: 'Notify failed' });
  }
});

// ── GET /api/chat/history ───────────────────────────────────────
router.get('/history', async (req, res) => {
  try {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (token !== process.env.ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
    const { rows } = await pool.query(
      `SELECT session_id, MIN(created_at) started, MAX(created_at) last, COUNT(*) msgs, MAX(user_name) name, BOOL_OR(should_escalate) escalated FROM chat_messages GROUP BY session_id ORDER BY last DESC LIMIT 200`
    );
    return res.json({ total: rows.length, sessions: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
