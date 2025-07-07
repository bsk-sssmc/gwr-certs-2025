import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  console.log("🔥 Serverless function called");

  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, error: 'Method Not Allowed' });
  }

  const CSV_PATH = path.join(process.cwd(), 'participants.csv');
  const CERT_ID_PATH = path.join(process.cwd(), 'cert-id.csv');

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const email = (req.body.email || '').trim().toLowerCase();
  console.log("🔥 Email:", email);

  if (!emailRe.test(email)) {
    return res.status(400).json({ valid: false, error: 'Invalid email format' });
  }

  // Load participants.csv
  const participants = fs.readFileSync(CSV_PATH, 'utf8').split(/\r?\n/);
  const emailMap = new Map();
  for (const line of participants.slice(1)) {
    if (!line.trim()) continue;
    const [csvEmail, name, category] = line.split(',');
    emailMap.set(csvEmail.trim().toLowerCase(), { name, category });
  }

  const match = emailMap.get(email);
  if (!match) {
    return res.json({ valid: false });
  }

  // Load cert-id.csv
  const certIds = fs.readFileSync(CERT_ID_PATH, 'utf8').split(/\r?\n/);
  const certIdMap = new Map();
  for (const line of certIds.slice(1)) {
    if (!line.trim()) continue;
    const [csvEmail, id] = line.split(',');
    certIdMap.set(csvEmail.trim().toLowerCase(), id.trim());
  }

  const certId = certIdMap.get(email);
  if (!certId) {
    return res.status(500).json({ valid: false, error: 'Certificate ID not found' });
  }

  console.log("🔥 Found certificate ID:", certId);

  return res.json({
    valid: true,
    name: match.name,
    category: match.category,
    id: certId,
  });
}
