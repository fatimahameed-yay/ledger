// Generates the app icons (aura gradient + soft ring) as PNGs, no dependencies.
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(width, height, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // truecolour
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let p = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = rgb(x, y);
      raw[p++] = r; raw[p++] = g; raw[p++] = b;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t))));

const CREAM = [250, 247, 242];
const OLIVE = [124, 136, 78];
const SAGE = [179, 189, 142];
const BLUSH = [222, 176, 205];
const SAND = [232, 222, 208];

function shade(size) {
  return (x, y) => {
    const u = x / size, v = y / size;
    // diagonal olive -> sand -> blush wash
    let c = mix(OLIVE, SAND, (u + v) * 0.62);
    c = mix(c, BLUSH, Math.pow(Math.max(0, u * 0.75 + (1 - v) * 0.55 - 0.32), 1.25));
    // soft sage bloom bottom-left
    const d1 = Math.hypot(u - 0.12, v - 0.92);
    c = mix(c, SAGE, Math.max(0, 0.55 - d1) * 1.1);
    // luminous centre ring, like an aura
    const d = Math.hypot(u - 0.5, v - 0.5);
    const ring = Math.exp(-Math.pow((d - 0.285) / 0.055, 2));
    c = mix(c, CREAM, ring * 0.72);
    // inner glow
    c = mix(c, CREAM, Math.max(0, 0.2 - d) * 1.6);
    return c;
  };
}

const out = path.join(process.cwd(), "public");
fs.mkdirSync(out, { recursive: true });
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-icon.png", 180]]) {
  fs.writeFileSync(path.join(out, name), png(size, size, shade(size)));
  console.log("wrote", name, size);
}
