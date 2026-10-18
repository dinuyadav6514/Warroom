import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Simple CRC32 table for PNG chunk checksums
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generateIconPNG(size) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (1 + width * 4));

  const cx = width / 2;
  const cy = height / 2;
  const outerR = size * 0.42;
  const midR = size * 0.30;
  const innerR = size * 0.16;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background: deep military tactical dark #080c14
      let r = 8, g = 12, b = 20, a = 255;

      // Outer circular frame / radar ring
      if (Math.abs(dist - outerR) < size * 0.02) {
        // Cyan accent ring
        r = 6, g = 182, b = 212;
      } else if (Math.abs(dist - midR) < size * 0.015) {
        // Mid ring
        r = 14, g = 116, b = 144;
      } else if (Math.abs(dist - innerR) < size * 0.015) {
        // Inner amber ring
        r = 245, g = 158, b = 11;
      } else if (dist < size * 0.06) {
        // Center core radar ping
        r = 239, g = 68, b = 68;
      }

      // Crosshair lines
      if ((Math.abs(dx) < size * 0.012 && dist < outerR + size * 0.04) ||
          (Math.abs(dy) < size * 0.012 && dist < outerR + size * 0.04)) {
        if (dist > innerR * 0.7) {
          r = 56; g = 189; b = 248;
        }
      }

      // 45-degree angle hash ticks
      const angle = Math.abs(Math.atan2(dy, dx));
      if (Math.abs(angle - Math.PI / 4) < 0.04 && dist > midR && dist < outerR) {
        r = 245; g = 158; b = 11;
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // Color type 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT (Deflate rawData)
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idat = createChunk('IDAT', compressed);

  // IEND
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const outDir = path.resolve(process.cwd(), 'public');
const p192 = path.join(outDir, 'icon-192.png');
const p512 = path.join(outDir, 'icon-512.png');

fs.writeFileSync(p192, generateIconPNG(192));
fs.writeFileSync(p512, generateIconPNG(512));

console.log(`PWA icons generated successfully:`);
console.log(`- ${p192} (${fs.statSync(p192).size} bytes)`);
console.log(`- ${p512} (${fs.statSync(p512).size} bytes)`);
