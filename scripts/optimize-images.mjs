#!/usr/bin/env node
/**
 * Optimises the team photographs.
 *
 * The originals are 1328×1328 PNGs (~2.5 MB each) but they are displayed in
 * a 96 px circle. This resizes them to 400 px (comfortably above 2× for
 * high-DPI screens) and writes both a WebP and a PNG fallback.
 *
 * Run with:  node scripts/optimize-images.mjs
 * Requires:  sharp
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const TEAM_DIR = path.join(process.cwd(), 'public', 'team')
const SIZE = 400

if (!fs.existsSync(TEAM_DIR)) {
  console.error('optimize-images: public/team not found')
  process.exit(1)
}

const files = fs.readdirSync(TEAM_DIR).filter(f => f.endsWith('.png'))
if (files.length === 0) {
  console.log('optimize-images: nothing to do')
  process.exit(0)
}

for (const file of files) {
  const source = path.join(TEAM_DIR, file)
  const base = file.replace(/\.png$/, '')
  const webp = path.join(TEAM_DIR, `${base}.webp`)

  const before = fs.statSync(source).size

  const image = sharp(source).rotate() // honour EXIF orientation
  const meta = await image.metadata()

  const resized = image.clone().resize(SIZE, SIZE, { fit: 'cover', position: 'attention' })

  await resized.clone().webp({ quality: 82 }).toFile(webp)

  // Sharp refuses to read and write the same path, so the PNG is written to a
  // temporary file first and then moved over the original.
  const temp = path.join(TEAM_DIR, `.${base}.tmp.png`)
  await resized.clone().png({ quality: 82, compressionLevel: 9, palette: true }).toFile(temp)
  fs.renameSync(temp, source)

  const after = fs.statSync(source).size
  const webpSize = fs.statSync(webp).size

  console.log(
    `${file}: ${meta.width}×${meta.height} ${(before / 1024).toFixed(0)} KB ` +
      `→ png ${(after / 1024).toFixed(0)} KB, webp ${(webpSize / 1024).toFixed(0)} KB`
  )
}
