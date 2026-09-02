import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SVG_CARD_CONTENT = `
  <g fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <!-- Back card (visible contour peeking behind on the right) -->
    <path d="M 8.8 4.2 C 9.5 2.9 10.9 2.2 12.4 2.4 L 16.2 3.1 C 18.2 3.5 19.5 5.3 19.1 7.3 L 17.5 16.2 C 17.2 17.8 15.8 19 14.2 19 L 13.5 19" />
    
    <!-- Front card (rounded card tilted slightly to the left) -->
    <rect 
      x="3.6" 
      y="4.5" 
      width="11" 
      height="15.5" 
      rx="3" 
      transform="rotate(-5 9.1 12.2)" 
    />
  </g>
`;

function getSvg(size, iconScale = 0.58, bg = '#0a0a0a', rx = 0) {
  // Center the 24x24 icon inside size x size viewBox
  const iconPixelSize = size * iconScale;
  const offset = (size - iconPixelSize) / 2;
  const scale = iconPixelSize / 24;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  ${bg ? `<rect width="${size}" height="${size}" ${rx ? `rx="${rx}"` : ''} fill="${bg}"/>` : ''}
  <g transform="translate(${offset.toFixed(2)}, ${offset.toFixed(2)}) scale(${scale.toFixed(4)})">
    ${SVG_CARD_CONTENT}
  </g>
</svg>`;
}

// Favicon SVG - beautiful black background with subtle rounded corners or full black
const faviconSvg = getSvg(512, 0.60, '#0a0a0a', 110);
const rawSvg = getSvg(512, 0.58, '#0a0a0a', 0);
const maskableSvg = getSvg(512, 0.48, '#0a0a0a', 0); // Safe zone inside 80% circle

async function generate() {
  const publicDir = path.resolve(process.cwd(), 'public');

  // Save icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), faviconSvg, 'utf8');
  console.log('Saved icon.svg');

  // Generate 512x512
  const buf512 = await sharp(Buffer.from(rawSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // Generate maskable 512x512
  const bufMaskable = await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // Generate 192x192
  await sharp(Buffer.from(rawSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // Generate apple-touch-icon 180x180
  await sharp(Buffer.from(rawSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Generate favicon.ico (32x32)
  const favicon32 = await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Generated favicon.ico');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
