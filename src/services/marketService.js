// src/services/marketService.js
const db = require('../db');

let cachedData = null;
let lastFetch = null;
const CACHE_TTL = 30 * 1000; // 30 seconds

async function fetchLiveMarkets() {
  try {
    // ── Crypto from CoinGecko (Free, no key needed) ──
    const cryptoRes = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,cardano&vs_currencies=usd&include_24hr_change=true&include_market_cap=true'
    );
    const cryptoData = await cryptoRes.json();

    // ── Forex from ExchangeRate API ──
    const forexRes = await fetch(
      `https://api.exchangerate-api.com/v4/latest/USD`
    );
    const forexData = await forexRes.json();

    const snapshot = {
      timestamp: new Date().toISOString(),
      source: 'live',
      forex: forexData.rates || {},
      crypto: {
        BTC: { price: cryptoData.bitcoin?.usd, chg: cryptoData.bitcoin?.usd_24h_change, mcap: cryptoData.bitcoin?.usd_market_cap },
        ETH: { price: cryptoData.ethereum?.usd, chg: cryptoData.ethereum?.usd_24h_change },
        BNB: { price: cryptoData.binancecoin?.usd, chg: cryptoData.binancecoin?.usd_24h_change },
        SOL: { price: cryptoData.solana?.usd, chg: cryptoData.solana?.usd_24h_change },
        ADA: { price: cryptoData.cardano?.usd, chg: cryptoData.cardano?.usd_24h_change },
      },
    };

    // Save to DB
    await db.query(`INSERT INTO market_snapshots (data) VALUES ($1)`, [JSON.stringify(snapshot)]);
    // Keep only last 100 snapshots
    await db.query(`DELETE FROM market_snapshots WHERE id NOT IN (SELECT id FROM market_snapshots ORDER BY fetched_at DESC LIMIT 100)`);

    cachedData = snapshot;
    lastFetch = Date.now();
    return snapshot;

  } catch (err) {
    console.error('Market fetch error:', err.message);
    // Return last cached or DB snapshot
    if (cachedData) return cachedData;
    const { rows } = await db.query(`SELECT data FROM market_snapshots ORDER BY fetched_at DESC LIMIT 1`);
    if (rows.length) return rows[0].data;
    return null;
  }
}

async function getMarkets() {
  if (cachedData && lastFetch && (Date.now() - lastFetch < CACHE_TTL)) {
    return { ...cachedData, source: 'cache' };
  }
  return fetchLiveMarkets();
}

module.exports = { getMarkets, fetchLiveMarkets };
