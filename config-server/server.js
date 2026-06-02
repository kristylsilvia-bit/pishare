'use strict';

require('dotenv').config();

const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8643;
const CONFIG_KEY = process.env.CONFIG_KEY || 'changeme';
const CONFIG_PATH =
  process.env.CONFIG_PATH || path.join(os.homedir(), '.hermes', 'config.yaml');

// Accept raw text bodies (YAML) up to a sensible size.
app.use(express.text({ type: '*/*', limit: '2mb' }));

// Minimal permissive CORS — the main path is server-to-server (Vercel -> Pi),
// but this also allows direct testing from a browser/curl.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function authorized(req, res) {
  const key = req.get('x-api-key');
  if (!key || key !== CONFIG_KEY) {
    res.status(401).type('text/plain').send('Unauthorized: bad or missing x-api-key');
    return false;
  }
  return true;
}

// Unauthenticated liveness probe (handy for debugging port-forwarding).
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'hermes-config', path: CONFIG_PATH });
});

// GET /config -> plain-text contents of ~/.hermes/config.yaml
app.get('/config', (req, res) => {
  if (!authorized(req, res)) return;
  fs.readFile(CONFIG_PATH, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // No config yet — return empty so the editor opens cleanly.
        return res.status(200).type('text/plain').send('');
      }
      return res.status(500).type('text/plain').send(`Read error: ${err.message}`);
    }
    res.type('text/plain').send(data);
  });
});

// POST /config -> overwrite ~/.hermes/config.yaml with the request body
app.post('/config', (req, res) => {
  if (!authorized(req, res)) return;
  const body = typeof req.body === 'string' ? req.body : '';
  fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true }, (mkErr) => {
    if (mkErr) {
      return res.status(500).type('text/plain').send(`Mkdir error: ${mkErr.message}`);
    }
    fs.writeFile(CONFIG_PATH, body, 'utf8', (err) => {
      if (err) {
        return res.status(500).type('text/plain').send(`Write error: ${err.message}`);
      }
      res.type('text/plain').send('OK: config.yaml written');
    });
  });
});

app.listen(PORT, () => {
  console.log(`[hermes-config] listening on :${PORT}`);
  console.log(`[hermes-config] config path: ${CONFIG_PATH}`);
  if (CONFIG_KEY === 'changeme') {
    console.warn('[hermes-config] WARNING: CONFIG_KEY is still "changeme" — set a real secret in .env');
  }
});
