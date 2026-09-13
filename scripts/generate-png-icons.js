import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawPixel) {
  // RGBA buffer with filter byte 0 at start of each scanline
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData, { level: 9 });

  // CRC32 table
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const chunkData = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(chunkData), 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // non-interlaced
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw Pan Vivo Icon
function panVivoPainter(isMaskable = false) {
  return (x, y, w, h) => {
    // Normalized coordinates (-1 to 1)
    const nx = (x / w) * 2 - 1;
    const ny = (y / h) * 2 - 1;
    const dist = Math.sqrt(nx * nx + ny * ny);

    // Background color: Deep sacred warm dark tone #140b05 to #0c0805
    let r = 16;
    let g = 10;
    let b = 6;
    let a = 255;

    const scale = isMaskable ? 0.75 : 0.88;
    const sx = nx / scale;
    const sy = ny / scale;
    const sdist = Math.sqrt(sx * sx + sy * sy);

    // Subtle background warm radial glow
    const glow = Math.max(0, 1 - dist * 0.9);
    r = Math.min(255, Math.floor(16 + glow * 40));
    g = Math.min(255, Math.floor(10 + glow * 25));
    b = Math.min(255, Math.floor(6 + glow * 10));

    // Outer golden ring
    if (sdist > 0.85 && sdist < 0.90) {
      const ringAlpha = Math.sin(((sdist - 0.85) / 0.05) * Math.PI);
      r = Math.floor(r * (1 - ringAlpha) + 217 * ringAlpha);
      g = Math.floor(g * (1 - ringAlpha) + 119 * ringAlpha);
      b = Math.floor(b * (1 - ringAlpha) + 6 * ringAlpha);
    }

    // Host position: centered around (0, -0.15)
    const hx = sx;
    const hy = sy - (-0.15);
    const hdist = Math.sqrt(hx * hx + hy * hy);
    const hostRadius = 0.32;

    // Host glow
    if (hdist < hostRadius + 0.12 && hdist >= hostRadius) {
      const hostAura = Math.pow(1 - (hdist - hostRadius) / 0.12, 2) * 0.6;
      r = Math.min(255, Math.floor(r + 245 * hostAura));
      g = Math.min(255, Math.floor(g + 190 * hostAura));
      b = Math.min(255, Math.floor(b + 80 * hostAura));
    }

    // Host body (Pan Sagrado)
    if (hdist < hostRadius) {
      // Warm ivory host gradient
      const factor = 1 - (hdist / hostRadius) * 0.3;
      r = Math.floor(254 * factor);
      g = Math.floor(243 * factor);
      b = Math.floor(215 * factor);

      // Gold rim of host
      if (hdist > hostRadius - 0.025) {
        r = 217;
        g = 150;
        b = 30;
      }

      // Latin cross in center of host
      const crossVertical = Math.abs(hx) < 0.035 && hy > -0.20 && hy < 0.20;
      const crossHorizontal = Math.abs(hy - (-0.03)) < 0.035 && hx > -0.14 && hx < 0.14;
      if (crossVertical || crossHorizontal) {
        r = 160;
        g = 90;
        b = 15;
      }
    }

    // Chalice cup: below host, center (0, 0.20)
    // Cup shape
    if (sy >= 0.05 && sy <= 0.35) {
      const cupWidthAtY = 0.40 * Math.cos(((sy - 0.05) / 0.30) * (Math.PI / 2.3));
      if (Math.abs(sx) < cupWidthAtY) {
        const shade = 1 - Math.abs(sx) / (cupWidthAtY || 0.01) * 0.4;
        r = Math.floor(245 * shade);
        g = Math.floor(158 * shade);
        b = Math.floor(11 * shade);
      }
    }

    // Chalice Stem and Knob
    if (sy >= 0.34 && sy <= 0.62 && Math.abs(sx) < 0.045) {
      r = 217;
      g = 130;
      b = 15;
    }
    // Knob ellipse at sy = 0.42
    const kx = sx;
    const ky = (sy - 0.42) / 0.5;
    if (Math.sqrt(kx * kx + ky * ky) < 0.08) {
      r = 250;
      g = 180;
      b = 30;
    }

    // Chalice Base
    if (sy >= 0.60 && sy <= 0.72) {
      const baseHalfWidth = 0.10 + ((sy - 0.60) / 0.12) * 0.22;
      if (Math.abs(sx) < baseHalfWidth) {
        r = 217;
        g = 140;
        b = 15;
      }
    }

    return [r, g, b, a];
  };
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. pwa-192x192.png
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, panVivoPainter(false)));
console.log('Created pwa-192x192.png');

// 2. pwa-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, panVivoPainter(false)));
console.log('Created pwa-512x512.png');

// 3. pwa-maskable-512x512.png (with safe-zone 15% margin)
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, panVivoPainter(true)));
console.log('Created pwa-maskable-512x512.png');

// 4. apple-touch-icon.png (180x180)
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, panVivoPainter(false)));
console.log('Created apple-touch-icon.png');

// 5. favicon.ico (can be 64x64 PNG content or copy of 192)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(64, 64, panVivoPainter(false)));
console.log('Created favicon.ico');
