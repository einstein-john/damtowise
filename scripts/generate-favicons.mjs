/**
 * Regenerates the raster favicons from the same mark as favicon.svg.
 *
 *   npm run favicons
 *
 * The SVG is the source of truth; this just rasterises the same `< />` glyph
 * into the PNG sizes referenced by index.html and site.webmanifest. Both are
 * static, design-once assets — there is nothing to regenerate per deploy.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from 'canvas';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(rootDir, 'public');

const BACKGROUND = '#0A0A0A';
const ACCENT = '#FF6600';

/** Same geometry as public/favicon.svg, expressed in a 0..1 unit box. */
const GLYPH = {
  left: [
    [0.359, 0.313],
    [0.234, 0.5],
    [0.359, 0.688],
  ],
  slash: [
    [0.5125, 0.266],
    [0.4875, 0.734],
  ],
  right: [
    [0.641, 0.313],
    [0.766, 0.5],
    [0.641, 0.688],
  ],
};

function drawMark(ctx, size) {
  const scale = size / 32;
  const radius = 7 * scale;
  const strokeWidth = 2.6 * scale;

  // Rounded background plate
  ctx.fillStyle = BACKGROUND;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // Glyph
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const stroke = (points) => {
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      const px = x * size;
      const py = y * size;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  };

  stroke(GLYPH.left);
  stroke(GLYPH.slash);
  stroke(GLYPH.right);
}

function render(size, { maskable = false } = {}) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  if (maskable) {
    // Maskable icons get cropped to a circle on some platforms, so the glyph is
    // inset and the background bleeds to the edges.
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, size, size);
    ctx.save();
    const inset = size * 0.12;
    ctx.translate(inset, inset);
    ctx.scale((size - inset * 2) / size, (size - inset * 2) / size);
    drawMark(ctx, size);
    ctx.restore();
  } else {
    drawMark(ctx, size);
  }

  return canvas;
}

async function write(canvas, name) {
  const buffer = canvas.toBuffer('image/png');
  await writeFile(path.join(publicDir, name), buffer);
  console.log(`  ${name.padEnd(20)} ${(buffer.length / 1024).toFixed(1)} KB`);
}

async function main() {
  console.log('generating favicons');
  await write(render(32), 'favicon-32.png');
  await write(render(180), 'favicon-180.png');
  // Android / PWA home screen: transparent-safe, inset for the maskable safe zone.
  await write(render(512, { maskable: true }), 'favicon-512.png');
  console.log('favicon.svg is the source of truth — edit that, then re-run this.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
