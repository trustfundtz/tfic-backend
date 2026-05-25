const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const nodemailer = require('nodemailer');
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const TFIC_SYSTEM_PROMPT = `You are ARIA, the official AI support assistant for Trust Fund Investment Club (TFIC). You are professional, calm, and investor-focused. Founded 2025, Dar es Salaam, Tanzania. Services: forex education, gold investment, financial literacy, market analysis, mentorship, events. Email: trustfundinvestmentclub38@gmail.com | WhatsApp: +255 692 317 297. RULES: Always say "our team" not "I alone". Never give specific trade advice. Keep responses under 4 sentences. Add [ESCALATE] when user asks for human, complains, or discusses real money amounts.`;
async function callAI(messages) {
  const r = await fetch(ANTHROPIC_API_URL, { method:'POST', headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'}, body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:400,system:TFIC_SYSTEM_PROMPT,messages:messages.slice(-10)}) });
  if (!r.ok) throw new Error('API error '+r.status);
  const d = await r.json(); return d.content[0].text;
}
router.post('/ai', async (req,res) => {
  try {
    const {messages,sessionId,topic} = req.body;
    const aiText = await callAI(messages||[]);
    const shouldEscalate = aiText.includes('[ESCALATE]');
    const clean = aiText.replace('[ESCALATE]','').trim();
    if(sessionId) pool.query(`INSERT INTO chat_messages(session_id,role,content,topic,should_escalate,created_at) VALUES($1,'assistant',$2,$3,$4,NOW())`,[sessionId,clean,topic||null,shouldEscalate]).catch(()=>{});
    return res.json({message:clean,shouldEscalate});
  } catch(err) {
    console.error('[Chat AI]',err.message);
    return res.json({message:"Thank you for contacting TFIC! Our team will assist you shortly. Reach us at trustfundinvestmentclub38@gmail.com or WhatsApp +255 692 317 297.",shouldEscalate:false});
  }
});
router.post('/save', async (req,res) => {
  try { const {sessionId,role,content,topic,userName,userEmail}=req.body; await pool.query(`INSERT INTO chat_messages(session_id,role,content,topic,user_name,user_email,created_at) VALUES($1,$2,$3,$4,$5,$6,NOW())`,[sessionId,role,content,topic||null,userName||null,userEmail||null]); return res.json({success:true}); } catch(err){return res.status(500).json({error:'Save failed'});}
});
router.post('/notify', async (req,res) => {
  try {
    const {sessionId,userName,userEmail,userMessage,topic,chatHistory}=req.body;
    const t = nodemailer.createTransporter({service:'gmail',auth:{user:process.env.GMAIL_USER||process.env.EMAIL_FROM,pass:process.env.GMAIL_PASS||process.env.EMAIL_PASS}});
    const hist = (chatHistory||[]).map(m=>`${m.role==='user'?'Client':'ARIA'}: ${m.content}`).join('\n\n');
    await t.sendMail({from:`"TFIC Chat" <${process.env.GMAIL_USER||process.env.EMAIL_FROM}>`,to:'trustfundinvestmentclub38@gmail.com',subject:`Chat Escalation — ${topic||'General'} | ${new Date().toLocaleString('en-US',{timeZone:'Africa/Nairobi'})}`,html:`<h2 style="color:#c9a84c">TFIC Chat Alert</h2><p><b>Client:</b> ${userName||'Anonymous'}</p><p><b>Email:</b> ${userEmail||'N/A'}</p><p><b>Topic:</b> ${topic||'General'}</p><p><b>Message:</b> "${userMessage}"</p><p><b>History:</b><br><pre>${hist}</pre></p><a href="https://wa.me/255692317297" style="background:#25D366;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px">Reply on WhatsApp</a>`});
    return res.json({success:true});
  } catch(err){console.error('[Notify]',err.message);return res.status(500).json({error:'Notify failed'});}
});
router.get('/history', async (req,res) => {
  try { const token=req.headers['x-admin-token']||req.query.token; if(token!==process.env.ADMIN_SECRET) return res.status(401).json({error:'Unauthorized'}); const {rows}=await pool.query(`SELECT session_id,MIN(created_at) started,MAX(created_at) last,COUNT(*) msgs,MAX(user_name) name,MAX(user_email) email,BOOL_OR(should_escalate) escalated FROM chat_messages GROUP BY session_id ORDER BY last DESC LIMIT 200`); return res.json({total:rows.length,sessions:rows}); } catch(err){return res.status(500).json({error:'Server error'});}
});
module.exports = router;
