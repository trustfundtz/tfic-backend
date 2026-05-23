# 🚀 TFIC Backend — Mwongozo wa Kuweka Online
# Trust Fund Investment Club — Deployment Guide

=====================================================
## HATUA 1: Tengeneza Akaunti za Bure (Dakika 10)
=====================================================

### A. Supabase (Database ya PostgreSQL)
1. Nenda: https://supabase.com
2. Click "Start your project" → Jisajili na GitHub au email
3. Click "New Project"
   - Organization: yoyote
   - Name: tfic-database
   - Database Password: ANDIKA HAPA → __________________
   - Region: East US (karibu na Tanzania)
4. Subiri dakika 2 itengeneze
5. Nenda: Settings → Database → Connection String
6. Copy "URI" — inaanza na "postgresql://postgres:..."
7. Weka kwenye .env: DATABASE_URL=postgresql://...

### B. Render.com (Server ya Bure)
1. Nenda: https://render.com
2. Jisajili (rahisi, bure)
3. Tutarudi hapa baadaye (Hatua 4)

### C. Gmail App Password
1. Ingia Gmail yako
2. Nenda: https://myaccount.google.com/security
3. Wezesha "2-Step Verification" (kama bado haujafanya)
4. Nenda tena Security → "App passwords"
5. Select app: "Mail" → Select device: "Other"
6. Andika: "TFIC Server"
7. Click Generate
8. COPY neno hilo la herufi 16 → Weka kwenye .env

=====================================================
## HATUA 2: Sanidi Faili za .env
=====================================================

1. Fungua folder "tfic-backend"
2. Rename ".env.template" kuwa ".env"
3. Fungua ".env" na text editor (Notepad, VS Code, nk.)
4. Jaza kila sehemu:

```
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.onrender.com

JWT_SECRET=TrustFundTanzania2026SecretKey_WekaNeno_La_Siri_Hapa_123

DATABASE_URL=postgresql://postgres:PASSWORD_YAKO@db.xxxxx.supabase.co:5432/postgres

GMAIL_USER=email-yako@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

FROM_EMAIL=Trust Fund Investment Club <noreply@gmail.com>

ADMIN_EMAIL=admin-yako@email.com
ADMIN_PASSWORD=PasswordImara123!

SITE_URL=https://tfic-backend.onrender.com
SITE_NAME=Trust Fund Investment Club
```

MUHIMU: JWT_SECRET lazima iwe ndefu na ya siri. Tumia:
  - Neno lolote refu la herufi 50+ bila maana
  - Mfano: "TFICtanzania2026_xK9mP2qL_USITOE_KWA_MTU_YEYOTE"

=====================================================
## HATUA 3: Tengeneza Database Tables
=====================================================

1. Fungua terminal/command prompt
2. Nenda kwenye folder: cd tfic-backend
3. Sakinisha packages:
   ```
   npm install
   ```
4. Tengeneza tables:
   ```
   npm run setup-db
   ```
5. Utaona:
   ✅ Database tables created successfully!
   ✓ users
   ✓ newsletter_subscribers
   ✓ contact_messages
   ✓ email_logs
   ✓ admin_sessions
   ✓ market_snapshots

=====================================================
## HATUA 4: Weka Online kwenye Render.com
=====================================================

### A. Weka Code kwenye GitHub (Lazima)
1. Nenda: https://github.com → Jisajili
2. Click "New repository"
   - Name: tfic-backend
   - Private: ✓ (muhimu! usifanye public)
3. Fuata instructions za GitHub kupload code:
   ```
   cd tfic-backend
   git init
   git add .
   git commit -m "TFIC Backend Initial"
   git remote add origin https://github.com/USERNAME/tfic-backend.git
   git push -u origin main
   ```
   MUHIMU: .env HAIPELEKWI GitHub (imeorodheshwa kwenye .gitignore)

### B. Deploy kwenye Render
1. Nenda: https://render.com → Login
2. Click "New +" → "Web Service"
3. Connect GitHub → Chagua "tfic-backend"
4. Jaza:
   - Name: tfic-backend
   - Region: Oregon (au Singapore - karibu zaidi)
   - Branch: main
   - Runtime: Node
   - Build Command: npm install
   - Start Command: npm start
5. Click "Advanced" → "Add Environment Variables"
6. Ongeza KILA variable kutoka .env yako (moja moja):
   PORT → 3000
   NODE_ENV → production
   DATABASE_URL → postgresql://...
   JWT_SECRET → ...neno lako la siri...
   GMAIL_USER → email@gmail.com
   GMAIL_APP_PASSWORD → xxxx xxxx xxxx xxxx
   FROM_EMAIL → Trust Fund Investment Club <email@gmail.com>
   ADMIN_EMAIL → admin@email.com
   ADMIN_PASSWORD → password yako
   SITE_URL → https://tfic-backend.onrender.com
   FRONTEND_URL → https://link-ya-frontend-yako.com

7. Click "Create Web Service"
8. Subiri dakika 3-5 — itakuonyesha URL yako:
   ✅ https://tfic-backend.onrender.com

=====================================================
## HATUA 5: Connect Frontend na Backend
=====================================================

Fungua file yako ya frontend (trust_fund_investment_club_v2.html)
Tafuta mstari huu mwanzoni mwa <script>:

BADILISHA:
```
const API_BASE = 'http://localhost:3000/api';
```

NA:
```
const API_BASE = 'https://tfic-backend.onrender.com/api';
```

Kisha sasisha functions zifuatazo:

### doSignup() → itumie API:
```javascript
async function doSignup() {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: document.getElementById('s-first').value,
      lastName: document.getElementById('s-last').value,
      email: document.getElementById('s-email').value,
      phone: document.getElementById('s-phone').value,
      city: document.getElementById('s-city').value,
      userType: document.getElementById('s-type').value,
      password: document.getElementById('s-pass').value,
      wantsUpdates: document.getElementById('s-updates').checked,
    })
  });
  const data = await res.json();
  if (!res.ok) { /* onyesha error */ return; }
  
  // Hifadhi token kwa remember me
  if (document.getElementById('s-remember').checked) {
    localStorage.setItem('tfic_token', data.token);
    localStorage.setItem('tfic_user', JSON.stringify(data.user));
  }
  currentUser = data.user;
  renderLoggedIn();
}
```

### doLogin() → itumie API:
```javascript
async function doLogin() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: document.getElementById('l-email').value,
      password: document.getElementById('l-pass').value,
    })
  });
  const data = await res.json();
  if (!res.ok) { /* onyesha error */ return; }
  
  if (document.getElementById('l-remember').checked) {
    localStorage.setItem('tfic_token', data.token);
    localStorage.setItem('tfic_user', JSON.stringify(data.user));
  }
  currentUser = data.user;
  renderLoggedIn();
}
```

=====================================================
## HATUA 6: Test Kila Kitu
=====================================================

1. Fungua website yako
2. Jisajili na akaunti mpya
   ✅ Utapata email ya karibu (angalia Gmail yako)
   ✅ Admin atapata notification ya mwanachama mpya
3. Ingia Admin Dashboard:
   https://tfic-backend.onrender.com/admin
   Tumia ADMIN_EMAIL na ADMIN_PASSWORD ulizoweka
4. Angalia Dashboard — utaona mwanachama wako mpya!
5. Tuma Market Update:
   Admin Dashboard → Market Updates → Tuma Update Sasa

=====================================================
## HATUA 7: Domain Yako (Baadaye)
=====================================================

Ukipata domain (mfano: tfic.co.tz):
1. Nenda Render → Settings → Custom Domains
2. Ongeza domain yako
3. Render itakupa DNS records
4. Weka records hizo kwenye domain registrar yako
5. Subiri masaa 24 — itafanya kazi!

=====================================================
## MUHTASARI WA URLs ZAKO
=====================================================

Baada ya deploy:
🌐 API:           https://tfic-backend.onrender.com/api
🔧 Admin Panel:   https://tfic-backend.onrender.com/admin
❤️  Health Check: https://tfic-backend.onrender.com/health

=====================================================
## MSAADA
=====================================================

Ukikutana na tatizo lolote:
1. Angalia Render logs: Dashboard → Logs
2. Angalia Supabase: Database → Table Editor (kuona data)
3. Jaribu: curl https://tfic-backend.onrender.com/health

Maswali? Niulize — nitakusaidia hatua kwa hatua!
