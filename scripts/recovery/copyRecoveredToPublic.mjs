import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\da335eb3-d6e0-4861-ada0-f4c1c071d678\\scratch\\recovered_images';
const destDir = 'C:\\Users\\Samsung\\.gemini\\antigravity\\scratch\\play-cartaz-ia\\public\\produtos-belissima';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const fileMap = {
  'prod-ai-1790482860935-0.webp': '01-agua-de-coco-belissima.webp',
  'prod-ai-1790482860935-1.webp': '02-coco-verde-unidades.webp',
  'prod-ai-1790482860935-2.webp': '03-suco-de-laranja-belissima.webp',
  'prod-ai-1790482860935-3.webp': '04-pessego-nacional.webp',
  'prod-ai-1790482860935-4.webp': '05-goma-tapioca-brasile.webp',
  'prod-ai-1790482860935-5.webp': '06-uva-vitoria-bandeja.webp',
  'prod-ai-1790482860935-6.webp': '07-polpa-tomate-paganini.webp',
  'prod-ai-1790482860935-7.webp': '08-uva-melodia-bandeja.webp',
  'prod-ai-1790482860935-8.webp': '09-melao-rei.webp',
  'prod-ai-1790482860935-9.webp': '10-brocolis-americano.webp',
  'prod-ai-1790482860935-10.webp': '11-panceta-suina.webp',
  'prod-ai-1790482860935-11.webp': '12-ovos-caipira-lecoq.webp',
  'prod-ai-1790482860935-12.webp': '13-morango-bandejas.webp',
  'prod-ai-1790482860935-13.webp': '14-laranja-pera.webp',
  'prod-ai-1790482860935-14.webp': '15-alface-rubi-macos.webp',
  'prod-ai-1790482860935-15.webp': '16-jabuticaba.webp',
  'prod-ai-1790482860935-16.webp': '17-hamburguer-artesanal-costela.webp',
  'prod-ai-1790482860935-17.webp': '18-geleia-queensberry.webp',
  'prod-ai-1790482860935-18.webp': '19-carne-moida-primeira.webp',
  'prod-ai-1790482860935-19.webp': '20-file-tilapia-copacol.webp',
  'prod-ai-1790723702464-0.webp': '21-goiaba-vermelha-caseira-belissima.webp',
};

for (const [srcName, destName] of Object.entries(fileMap)) {
  const sPath = path.join(srcDir, srcName);
  const dPath = path.join(destDir, destName);
  if (fs.existsSync(sPath)) {
    fs.copyFileSync(sPath, dPath);
    console.log(`Copied ${srcName} -> ${destName} (${(fs.statSync(dPath).size / 1024).toFixed(1)} KB)`);
  } else {
    console.warn(`Source not found: ${srcName}`);
  }
}
