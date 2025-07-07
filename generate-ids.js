import fs from 'node:fs';
import path from 'node:path';
import { ObjectId } from 'bson';

const CSV_PATH = path.join(process.cwd(), 'participants.csv');
const CERT_ID_PATH = path.join(process.cwd(), 'cert-id.csv');

console.log('📋 Reading participants.csv...');

// Read participants
const participantsData = fs.readFileSync(CSV_PATH, 'utf8').split(/\r?\n/);
const participants = [];

for (const line of participantsData.slice(1)) {
  if (!line.trim()) continue;
  const [email, name, category] = line.split(',');
  participants.push({
    email: email.trim().toLowerCase(),
    name: name ? name.trim() : '',
    category: category ? category.trim() : ''
  });
}

console.log(`✅ Found ${participants.length} participants`);

// Check existing IDs
let existingIds = new Map();
if (fs.existsSync(CERT_ID_PATH)) {
  console.log('📋 Reading existing cert-id.csv...');
  const existingData = fs.readFileSync(CERT_ID_PATH, 'utf8').split(/\r?\n/);
  for (const line of existingData.slice(1)) {
    if (!line.trim()) continue;
    const [email, id] = line.split(',');
    existingIds.set(email.trim().toLowerCase(), id.trim());
  }
  console.log(`✅ Found ${existingIds.size} existing certificate IDs`);
}

// Generate missing IDs
console.log('🔑 Generating certificate IDs...');
const newIds = [];
let newCount = 0;

for (const participant of participants) {
  if (!existingIds.has(participant.email)) {
    const newId = new ObjectId().toHexString();
    newIds.push(`${participant.email},${newId}`);
    newCount++;
  }
}

if (newCount === 0) {
  console.log('✅ All participants already have certificate IDs!');
} else {
  console.log(`🔑 Generated ${newCount} new certificate IDs`);
  
  // Write header if file doesn't exist
  if (!fs.existsSync(CERT_ID_PATH)) {
    fs.writeFileSync(CERT_ID_PATH, 'email,id\n', 'utf8');
  }
  
  // Append new IDs
  if (newIds.length > 0) {
    fs.appendFileSync(CERT_ID_PATH, newIds.join('\n') + '\n', 'utf8');
  }
  
  console.log('✅ Certificate IDs saved to cert-id.csv');
}

console.log('🎉 ID generation complete!');
