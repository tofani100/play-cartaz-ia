import fs from 'fs';
import path from 'path';

const dirs = [
  'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 4\\IndexedDB\\http_localhost_3000.indexeddb.leveldb',
  'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 4\\IndexedDB\\https_cartaz-ia-playcomunique.web.app_0.indexeddb.leveldb',
  'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 15\\IndexedDB\\https_cartaz-ia-playcomunique.web.app_0.indexeddb.leveldb',
  'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 4\\Local Storage\\leveldb',
  'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 15\\Local Storage\\leveldb'
];

for (const d of dirs) {
  if (!fs.existsSync(d)) continue;
  console.log('\n=== DIRECTORY:', d);
  const files = fs.readdirSync(d);
  files.forEach(f => {
    const full = path.join(d, f);
    const stat = fs.statSync(full);
    console.log('  ' + f + ': ' + stat.size + ' bytes, modified: ' + stat.mtime.toISOString());
  });
}
