#!/usr/bin/env node
/**
 * Generates the favicon set from `public/icon.svg`.
 *
 * Produces:
 *   public/favicon.ico            16 / 32 / 48 px, multi-resolution
 *   public/apple-icon.png         180 px, opaque (iOS composites it on a tile)
 *   public/icons/favicon-*.png    16 / 32 / 48 / 96 px for browsers that
 *                                 ignore SVG favicons
 *   public/icons/icon-*.png       192 / 512 px for the web app manifest
 *
 * Icons live in `public/` rather than `app/` on purpose: Next gives
 * file-convention icons priority over `metadata.icons`, which would make the
 * explicit, cache-busted icon set in the layout impossible to declare.
 *
 * The ICO container is packed by hand — the format allows a PNG payload per
 * entry since Vista, so no encoder dependency is needed.
 *
 * Requires: sharp   (npm i --no-save sharp)
 * Run with: node scripts/make-favicons.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const PUBLIC = path.join(process.cwd(), 'public')
const ICONS = path.join(PUBLIC, 'icons')
const SVG = path.join(PUBLIC, 'icon.svg')
const ICO = path.join(PUBLIC, 'favicon.ico')
const APPLE = path.join(PUBLIC, 'apple-icon.png')

fs.mkdirSync(ICONS, { recursive: true })

if (!fs.existsSync(SVG)) {
  console.error('make-favicons: public/icon.svg not found')
  process.exit(1)
}

const svg = fs.readFileSync(SVG)

/** Packs PNG buffers into a multi-resolution .ico container. */
function packIco(entries) {
  const count = entries.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: 1 = icon
  header.writeUInt16LE(count, 4)

  const directories = []
  const payloads = []
  let offset = 6 + count * 16

  for (const { size, data } of entries) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0) // width  (0 means 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1) // height
    entry.writeUInt8(0, 2) // palette colour count
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // colour planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    directories.push(entry)
    payloads.push(data)
    offset += data.length
  }

  return Buffer.concat([header, ...directories, ...payloads])
}

// ── .ico ──────────────────────────────────────────────────────────────────
const SIZES = [16, 32, 48]
const icoEntries = []
for (const size of SIZES) {
  const data = await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toBuffer()
  icoEntries.push({ size, data })
}
const ico = packIco(icoEntries)
fs.writeFileSync(ICO, ico)
console.log(
  `favicon.ico: ${SIZES.join('/')} px, ${(ico.length / 1024).toFixed(1)} KB`
)

// ── apple-touch-icon ──────────────────────────────────────────────────────
// iOS masks the corners itself, so the tile is rendered with a full-bleed
// background and no transparency.
await sharp(svg, { density: 384 })
  .resize(180, 180, { fit: 'cover' })
  .flatten({ background: '#1d4ed8' })
  .png({ compressionLevel: 9 })
  .toFile(APPLE)
console.log(`apple-icon.png: 180 px, ${(fs.statSync(APPLE).size / 1024).toFixed(1)} KB`)

// ── PNG favicons ──────────────────────────────────────────────────────────
// Browsers that do not render SVG favicons (older Safari, some embedded
// webviews) need a raster fallback; the manifest needs 192/512 px.
const PNG_SIZES = [16, 32, 48, 96, 192, 512]
for (const size of PNG_SIZES) {
  const name = size <= 96 ? `favicon-${size}x${size}.png` : `icon-${size}.png`
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(ICONS, name))
}
console.log(`icons: ${PNG_SIZES.map((size) => `${size}px`).join(', ')}`)

// Maskable icon: keep the glyph inside the 80% safe zone Android crops to.
await sharp(svg, { density: 384 })
  .resize(410, 410, { fit: 'cover' })
  .flatten({ background: '#1d4ed8' })
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: '#1d4ed8' })
  .png({ compressionLevel: 9 })
  .toFile(path.join(ICONS, 'icon-maskable-512.png'))
console.log('icon-maskable-512.png: 512 px, safe-zone padded')

// ── sanity check: the icon must not be blank ──────────────────────────────
const stats = await sharp(icoEntries[1].data).stats()
const spread = stats.channels.map(c => c.max - c.min)
if (spread.every(s => s < 20)) {
  console.error('make-favicons: the rendered icon looks blank — check the SVG')
  process.exit(1)
}
console.log('make-favicons: done')
