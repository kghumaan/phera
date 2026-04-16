#!/usr/bin/env node
/**
 * Image Optimization Script
 *
 * Compresses background PNGs to WebP, generates thumbnails, resizes frames,
 * and creates blur placeholder data URLs.
 *
 * Usage: node scripts/optimize-images.mjs
 */

import sharp from 'sharp';
import { readdir, mkdir, copyFile, stat, writeFile } from 'fs/promises';
import { join, basename, extname, parse } from 'path';
import { existsSync } from 'fs';

const ROOT = new URL('..', import.meta.url).pathname;
const BG_DIR = join(ROOT, 'public/images/backgrounds');
const FRAME_DIR = join(ROOT, 'public/images/frames');
const BG_THUMBS_DIR = join(BG_DIR, 'thumbs');
const FRAME_THUMBS_DIR = join(FRAME_DIR, 'thumbs');
const BG_ORIGINALS_DIR = join(BG_DIR, '_originals');
const FRAME_ORIGINALS_DIR = join(FRAME_DIR, '_originals');
const BLUR_JSON_PATH = join(ROOT, 'lib/generated/blur-placeholders.json');

// Config
const BG_MAX_WIDTH = 1920;
const BG_WEBP_QUALITY = 85;
const BG_THUMB_WIDTH = 400;
const BG_THUMB_QUALITY = 70;
const FRAME_MAX_WIDTH = 1000;
const FRAME_THUMB_WIDTH = 200;
const FRAME_THUMB_QUALITY = 75;
const BLUR_SIZE = 20;

async function ensureDir(dir) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function processBackgrounds() {
  console.log('\n=== Processing Background Images ===\n');
  await ensureDir(BG_THUMBS_DIR);
  await ensureDir(BG_ORIGINALS_DIR);

  const files = (await readdir(BG_DIR)).filter(f => {
    const ext = extname(f).toLowerCase();
    return (ext === '.png' || ext === '.jpg' || ext === '.jpeg') && !f.startsWith('.');
  });

  const blurPlaceholders = {};
  let totalOriginal = 0;
  let totalCompressed = 0;
  let totalThumbs = 0;

  for (const file of files) {
    const filePath = join(BG_DIR, file);
    const { name } = parse(file);
    const ext = extname(file).toLowerCase();
    const originalStat = await stat(filePath);
    const originalSize = originalStat.size;
    totalOriginal += originalSize;

    // Back up original
    const backupPath = join(BG_ORIGINALS_DIR, file);
    if (!existsSync(backupPath)) {
      await copyFile(filePath, backupPath);
    }

    // Determine output format
    const isJpg = ext === '.jpg' || ext === '.jpeg';
    const webpPath = join(BG_DIR, `${name}.webp`);
    const thumbPath = join(BG_THUMBS_DIR, `${name}.thumb.webp`);

    // Compress to WebP (resize to max width)
    const image = sharp(filePath);
    const metadata = await image.metadata();

    const resizeWidth = metadata.width > BG_MAX_WIDTH ? BG_MAX_WIDTH : undefined;

    await sharp(filePath)
      .resize(resizeWidth, undefined, { withoutEnlargement: true })
      .webp({ quality: BG_WEBP_QUALITY })
      .toFile(webpPath);

    const compressedStat = await stat(webpPath);
    totalCompressed += compressedStat.size;

    // Generate thumbnail
    await sharp(filePath)
      .resize(BG_THUMB_WIDTH, undefined, { withoutEnlargement: true })
      .webp({ quality: BG_THUMB_QUALITY })
      .toFile(thumbPath);

    const thumbStat = await stat(thumbPath);
    totalThumbs += thumbStat.size;

    // Generate blur placeholder (tiny base64 JPEG)
    const blurBuffer = await sharp(filePath)
      .resize(BLUR_SIZE, BLUR_SIZE, { fit: 'cover' })
      .jpeg({ quality: 40 })
      .toBuffer();

    const blurDataUrl = `data:image/jpeg;base64,${blurBuffer.toString('base64')}`;
    // Store for both original and webp paths
    blurPlaceholders[`/images/backgrounds/${name}.webp`] = blurDataUrl;
    blurPlaceholders[`/images/backgrounds/${file}`] = blurDataUrl;

    console.log(`  ${file}: ${formatSize(originalSize)} -> ${formatSize(compressedStat.size)} (webp) + ${formatSize(thumbStat.size)} (thumb)`);
  }

  console.log(`\n  Background totals: ${formatSize(totalOriginal)} -> ${formatSize(totalCompressed)} (webp) + ${formatSize(totalThumbs)} (thumbs)`);
  return blurPlaceholders;
}

async function processFrames() {
  console.log('\n=== Processing Frame Images ===\n');
  await ensureDir(FRAME_THUMBS_DIR);
  await ensureDir(FRAME_ORIGINALS_DIR);

  const files = (await readdir(FRAME_DIR)).filter(f => {
    const ext = extname(f).toLowerCase();
    return ext === '.png' && !f.startsWith('.');
  });

  let totalOriginal = 0;
  let totalCompressed = 0;
  let totalThumbs = 0;

  for (const file of files) {
    const filePath = join(FRAME_DIR, file);
    const { name } = parse(file);
    const originalStat = await stat(filePath);
    const originalSize = originalStat.size;
    totalOriginal += originalSize;

    // Back up original
    const backupPath = join(FRAME_ORIGINALS_DIR, file);
    if (!existsSync(backupPath)) {
      await copyFile(filePath, backupPath);
    }

    // Resize frame PNG (keep alpha)
    const metadata = await sharp(filePath).metadata();
    const resizeWidth = metadata.width > FRAME_MAX_WIDTH ? FRAME_MAX_WIDTH : undefined;

    const resizedPath = join(FRAME_DIR, `${name}.resized.png`);
    await sharp(filePath)
      .resize(resizeWidth, undefined, { withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toFile(resizedPath);

    // Replace original with resized
    const { rename } = await import('fs/promises');
    await rename(resizedPath, filePath);

    const compressedStat = await stat(filePath);
    totalCompressed += compressedStat.size;

    // Generate WebP thumbnail with alpha
    const thumbPath = join(FRAME_THUMBS_DIR, `${name}.thumb.webp`);
    await sharp(filePath)
      .resize(FRAME_THUMB_WIDTH, undefined, { withoutEnlargement: true })
      .webp({ quality: FRAME_THUMB_QUALITY, alphaQuality: 90 })
      .toFile(thumbPath);

    const thumbStat = await stat(thumbPath);
    totalThumbs += thumbStat.size;

    console.log(`  ${file}: ${formatSize(originalSize)} -> ${formatSize(compressedStat.size)} (resized) + ${formatSize(thumbStat.size)} (thumb)`);
  }

  console.log(`\n  Frame totals: ${formatSize(totalOriginal)} -> ${formatSize(totalCompressed)} (resized) + ${formatSize(totalThumbs)} (thumbs)`);
}

async function main() {
  console.log('Image Optimization Script');
  console.log('========================\n');

  const blurPlaceholders = await processBackgrounds();
  await processFrames();

  // Write blur placeholders JSON
  await ensureDir(join(ROOT, 'lib/generated'));
  await writeFile(BLUR_JSON_PATH, JSON.stringify(blurPlaceholders, null, 2));
  console.log(`\nBlur placeholders written to ${BLUR_JSON_PATH}`);

  console.log('\nDone! Next steps:');
  console.log('  1. Delete original .png files from backgrounds/ (backed up in _originals/)');
  console.log('  2. Update lib/constants/images.ts to use .webp paths');
  console.log('  3. Add _originals/ to .gitignore');
}

main().catch(console.error);
