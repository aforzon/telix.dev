#!/usr/bin/env node
// Generate a 16x16 favicon.ico for Telix.dev
// Yellow "T" on dark blue background (CGA colors)
const fs = require('fs');
const path = require('path');

const W = 16, H = 16;
const BG = [0x00, 0x00, 0xAA, 0xFF]; // #0000AA blue
const FG = [0xFF, 0xFF, 0x55, 0xFF]; // #FFFF55 yellow

// Draw a simple "T" character
const pixels = [];
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    // Background fill
    let color = BG;

    // Top bar of T (rows 2-4, cols 3-12)
    if (y >= 2 && y <= 4 && x >= 3 && x <= 12) color = FG;
    // Vertical stroke of T (rows 5-13, cols 6-9)
    if (y >= 5 && y <= 13 && x >= 6 && x <= 9) color = FG;

    pixels.push(color);
  }
}

// ICO file format
// Header: 6 bytes
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);    // Reserved
header.writeUInt16LE(1, 2);    // Type: ICO
header.writeUInt16LE(1, 4);    // Count: 1 image

// BMP info header (BITMAPINFOHEADER): 40 bytes
const bmpHeader = Buffer.alloc(40);
bmpHeader.writeUInt32LE(40, 0);     // Header size
bmpHeader.writeInt32LE(W, 4);       // Width
bmpHeader.writeInt32LE(H * 2, 8);   // Height (doubled for ICO format - includes AND mask)
bmpHeader.writeUInt16LE(1, 12);     // Planes
bmpHeader.writeUInt16LE(32, 14);    // Bits per pixel
bmpHeader.writeUInt32LE(0, 16);     // Compression: none
bmpHeader.writeUInt32LE(W * H * 4, 20); // Image size
bmpHeader.writeInt32LE(0, 24);      // X pixels per meter
bmpHeader.writeInt32LE(0, 28);      // Y pixels per meter
bmpHeader.writeUInt32LE(0, 32);     // Colors used
bmpHeader.writeUInt32LE(0, 36);     // Important colors

// Pixel data (bottom-up, BGRA format)
const pixelData = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const src = pixels[(H - 1 - y) * W + x]; // Flip vertically (BMP is bottom-up)
    const offset = (y * W + x) * 4;
    pixelData[offset + 0] = src[2]; // B
    pixelData[offset + 1] = src[1]; // G
    pixelData[offset + 2] = src[0]; // R
    pixelData[offset + 3] = src[3]; // A
  }
}

// AND mask (1 bit per pixel, rows padded to 4 bytes)
const maskRowBytes = Math.ceil(W / 8);
const maskRowPadded = Math.ceil(maskRowBytes / 4) * 4;
const andMask = Buffer.alloc(maskRowPadded * H, 0); // All 0 = fully opaque

// Directory entry: 16 bytes
const imageSize = bmpHeader.length + pixelData.length + andMask.length;
const dataOffset = header.length + 16; // header + 1 directory entry

const dirEntry = Buffer.alloc(16);
dirEntry.writeUInt8(W, 0);          // Width (0 means 256)
dirEntry.writeUInt8(H, 1);          // Height
dirEntry.writeUInt8(0, 2);          // Color palette
dirEntry.writeUInt8(0, 3);          // Reserved
dirEntry.writeUInt16LE(1, 4);       // Color planes
dirEntry.writeUInt16LE(32, 6);      // Bits per pixel
dirEntry.writeUInt32LE(imageSize, 8); // Image data size
dirEntry.writeUInt32LE(dataOffset, 12); // Offset to image data

const ico = Buffer.concat([header, dirEntry, bmpHeader, pixelData, andMask]);

const outPath = path.join(__dirname, '..', 'frontend', 'favicon.ico');
fs.writeFileSync(outPath, ico);
console.log(`Favicon written to ${outPath} (${ico.length} bytes)`);

// Also generate apple-touch-icon (180x180 PNG)
// Simple approach: write a minimal PNG
const S = 180;
const pngPixels = [];
for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    let color = BG;
    // Scale the T to 180x180
    const sx = Math.floor(x * 16 / S);
    const sy = Math.floor(y * 16 / S);
    if (sy >= 2 && sy <= 4 && sx >= 3 && sx <= 12) color = FG;
    if (sy >= 5 && sy <= 13 && sx >= 6 && sx <= 9) color = FG;
    pngPixels.push(color[0], color[1], color[2]);
  }
}

// Minimal PNG encoder
const zlib = require('zlib');

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcData = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([len, typeBytes, data, crc]);
}

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr.writeUInt8(8, 8);   // bit depth
ihdr.writeUInt8(2, 9);   // color type: RGB
ihdr.writeUInt8(0, 10);  // compression
ihdr.writeUInt8(0, 11);  // filter
ihdr.writeUInt8(0, 12);  // interlace

// IDAT - raw pixel data with filter byte (0) per row
const rawData = Buffer.alloc(S * (1 + S * 3));
for (let y = 0; y < S; y++) {
  rawData[y * (1 + S * 3)] = 0; // filter: none
  for (let x = 0; x < S * 3; x++) {
    rawData[y * (1 + S * 3) + 1 + x] = pngPixels[y * S * 3 + x];
  }
}
const compressed = zlib.deflateSync(rawData);

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG signature
  pngChunk('IHDR', ihdr),
  pngChunk('IDAT', compressed),
  pngChunk('IEND', Buffer.alloc(0)),
]);

const pngPath = path.join(__dirname, '..', 'frontend', 'apple-touch-icon.png');
fs.writeFileSync(pngPath, png);
console.log(`Apple touch icon written to ${pngPath} (${png.length} bytes)`);
