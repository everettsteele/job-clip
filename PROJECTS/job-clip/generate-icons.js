const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];

if (!fs.existsSync('icons')) fs.mkdirSync('icons');

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background circle
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.floor(size * 0.55)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', size / 2, size / 2 + size * 0.03);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join('icons', `icon${size}.png`), buffer);
  console.log(`Created icons/icon${size}.png`);
});
