// src/db/setup.js
// Run once: node src/db/setup.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const schema = `
-- ══════════════════════════════════════════
-- TFIC DATABASE SCHEMA
-- ══════════════════════════════════════════

-- Users / Wanachama
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  phone         VARCHAR(30),
  city          VARCHAR(100),
  user_type     VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  wants_updates BOOLEAN DEFAULT true,
  is_verified   BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  joined_at     TIMESTAMP DEFAULT NOW(),
  last_login    TIMESTAMP,
  login_count   INTEGER DEFAULT 0
);

-- Newsletter Subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) UNIQUE NOT NULL,
  name       VARCHAR(200),
  is_active  BOOLEAN DEFAULT true,
  source     VARCHAR(50) DEFAULT 'website',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(200) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  phone      VARCHAR(30),
  subject    VARCHAR(200),
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT false,
  replied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Market Update Emails Sent (log)
CREATE TABLE IF NOT EXISTS email_logs (
  id           SERIAL PRIMARY KEY,
  type         VARCHAR(50) NOT NULL,
  recipient    VARCHAR(255) NOT NULL,
  subject      VARCHAR(300),
  status       VARCHAR(20) DEFAULT 'sent',
  sent_at      TIMESTAMP DEFAULT NOW()
);

-- Admin Sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id         SERIAL PRIMARY KEY,
  token      VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Market Snapshots (cache ya data za masoko)
CREATE TABLE IF NOT EXISTS market_snapshots (
  id         SERIAL PRIMARY KEY,
  data       JSONB NOT NULL,
  fetched_at TIMESTAMP DEFAULT NOW()
);

-- Indexes kwa speed
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_joined ON users(joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_date ON contact_messages(created_at DESC);
`;

async function setup() {
  try {
    console.log('🔗 Connecting to PostgreSQL...');
    await pool.query(schema);
    console.log('✅ Database tables created successfully!');
    console.log('');
    console.log('Tables created:');
    console.log('  ✓ users');
    console.log('  ✓ newsletter_subscribers');
    console.log('  ✓ contact_messages');
    console.log('  ✓ email_logs');
    console.log('  ✓ admin_sessions');
    console.log('  ✓ market_snapshots');
    await pool.end();
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    process.exit(1);
  }
}

setup();
module.exports = pool;
