import fs from 'fs';
import path from 'path';

const chromeDir = 'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data';
const entries = fs.readdirSync(chromeDir);

console.log('=== CHROME PROFILES MODIFICATION DATES ===');
for (const entry of entries) {
  if (entry.startsWith('Profile') || entry === 'Default') {
    const full = path.join(chromeDir, entry);
    try {
      const stat = fs.statSync(full);
      console.log(`${entry.padEnd(15)}: modified ${stat.mtime.toISOString()}`);
    } catch (_) {}
  }
}
