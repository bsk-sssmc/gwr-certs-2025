import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';

const PORT = 3000;
const CSV_PATH = path.join(process.cwd(), 'participants.csv');
const CERT_ID_PATH = path.join(process.cwd(), 'cert-id.csv');
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const app = express();
app.use(cors());
app.use(express.json());

/* ---------- Serve static files ---------- */
app.use(express.static(path.join(process.cwd(), 'public')));

/* ---------- Load participants.csv ---------- */
const emailMap = (() => {
  const data = fs.readFileSync(CSV_PATH, 'utf8').split(/\r?\n/);
  const map = new Map();
  for (const line of data.slice(1)) {
    if (!line.trim()) continue;
    const [email, name, category] = line.split(',');
    map.set(email.trim().toLowerCase(), {
      name: name ? name.trim() : '',
      category: category ? category.trim() : '',
    });
  }
  return map;
})();

/* ---------- Load cert-id.csv ---------- */
const certIdMap = (() => {
  if (!fs.existsSync(CERT_ID_PATH)) return new Map();
  const data = fs.readFileSync(CERT_ID_PATH, 'utf8').split(/\r?\n/);
  const map = new Map();
  for (const line of data.slice(1)) {
    if (!line.trim()) continue;
    const [email, id] = line.split(',');
    map.set(email.trim().toLowerCase(), id.trim());
  }
  return map;
})();

console.log(`✅ Loaded ${emailMap.size} participants.`);
console.log(`✅ Loaded ${certIdMap.size} certificate IDs.`);

/* ---------- API ---------- */
app.post('/api/validate-email', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();

    if (!emailRe.test(email)) {
      return res.status(400).json({ valid: false, error: 'Invalid email format' });
    }

    const match = emailMap.get(email);
    if (!match) {
      return res.json({ valid: false });
    }

    const certId = certIdMap.get(email);
    if (!certId) {
      return res.status(500).json({ valid: false, error: 'Certificate ID not found' });
    }

    const response = {
      valid: true,
      name: match.name,
      category: match.category,
      id: certId,
    };

    return res.json(response);

  } catch (err) {
    console.error('❌ API error:', err);
    return res.status(500).json({ valid: false, error: 'Server error' });
  }
});

/* ---------- Start server ---------- */
app.listen(PORT, () => {
  console.log(`⚡️ Server running at: http://localhost:${PORT}`);
});
