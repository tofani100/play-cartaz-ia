import fs from 'fs';
import path from 'path';

const files = [
  'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 4\\Local Storage\\leveldb\\002435.ldb',
  'C:\\Users\\Samsung\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 4\\Local Storage\\leveldb\\002433.log',
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const buf = fs.readFileSync(f);
  
  // Try utf16le
  const str16 = buf.toString('utf16le');
  let idx = 0;
  while ((idx = str16.indexOf('"id":"camp-1"', idx)) !== -1) {
    console.log(`\nFound "id":"camp-1" in ${path.basename(f)} (utf16le) at char ${idx}:`);
    const slice = str16.substring(idx - 1, idx + 25000);
    // find end of JSON object
    console.log(slice.substring(0, 1500));
    
    // Save full JSON slice to a file
    fs.writeFileSync(`extracted_campaign_utf16_${path.basename(f)}_${idx}.json`, slice);
    idx += 13;
  }

  // Try utf8
  const str8 = buf.toString('utf8');
  let idx8 = 0;
  while ((idx8 = str8.indexOf('"id":"camp-1"', idx8)) !== -1) {
    console.log(`\nFound "id":"camp-1" in ${path.basename(f)} (utf8) at char ${idx8}:`);
    const slice = str8.substring(idx8 - 1, idx8 + 25000);
    console.log(slice.substring(0, 1500));
    fs.writeFileSync(`extracted_campaign_utf8_${path.basename(f)}_${idx8}.json`, slice);
    idx8 += 13;
  }
}
