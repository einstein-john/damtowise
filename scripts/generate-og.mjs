/**
 * Generates the static Open Graph images for the portfolio.
 *
 *   npm run og
 *
 * Produces 1200x630 PNGs under public/og/:
 *   - home.png    — the portfolio hero card
 *   - default.png — fallback for any page without a dedicated image
 *
 * These are design-once assets for the portfolio (the SEO plan treats article
 * and project OG images as a later, generated-per-entity step). Keeping the
 * generator in-repo means the images are reproducible rather than mystery
 * binaries in the repo.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from 'canvas';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ogDir = path.join(rootDir, 'public', 'og');

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  background: '#0A0A0A',
  panel: '#111111',
  border: '#2a2a2a',
  orange: '#ff6600',
  orangeSoft: '#ff8833',
  white: '#ffffff',
  grey: '#999999',
  greyDark: '#666666',
};

const MONO = 'JetBrains Mono';
const SANS = 'Inter';

function loadFonts() {
  // node-canvas ships with a default sans/mono face; registering the real
  // families is optional — fall back gracefully so the script never hard-fails
  // on a machine without the TTFs installed.
  const faces = [
    { family: MONO, file: process.env.JETBRAINS_MONO_TTF },
    { family: SANS, file: process.env.INTER_TTF },
  ].filter((face) => face.file);

  for (const { family, file } of faces) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('canvas').registerFont(file, { family });
    } catch {
      console.warn(`Could not register ${family} from ${file}; using fallback face.`);
    }
  }
}

function drawDotMatrix(ctx, opts) {
  const { originX, originY, cols, rows, gap, radius, alpha } = opts;
  ctx.save();
  ctx.fillStyle = COLORS.orange;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const distance = Math.hypot(col / cols - 0.5, row / rows - 0.5);
      const falloff = Math.max(0, 1 - distance * 1.8);
      ctx.globalAlpha = alpha * falloff;
      ctx.beginPath();
      ctx.arc(originX + col * gap, originY + row * gap, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawGlow(ctx, x, y, radius, intensity = 0.22) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(255, 102, 0, ${intensity})`);
  gradient.addColorStop(0.55, `rgba(255, 102, 0, ${intensity * 0.35})`);
  gradient.addColorStop(1, 'rgba(255, 102, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawBrand(ctx, x, y, size = 22) {
  ctx.save();
  ctx.font = `600 ${size}px ${MONO}, monospace`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.white;
  ctx.fillText('<', x, y);
  const brandWidth = ctx.measureText('<').width;
  ctx.fillStyle = COLORS.orange;
  ctx.fillText('Damtowise', x + brandWidth, y);
  const brandWidth2 = ctx.measureText('Damtowise').width;
  ctx.fillText(' />', x + brandWidth + brandWidth2, y);
  ctx.restore();
}

function drawTag(ctx, text, x, y) {
  ctx.save();
  ctx.font = `500 20px ${MONO}, monospace`;
  const paddingX = 16;
  const height = 38;
  const width = ctx.measureText(text).width + paddingX * 2;

  ctx.fillStyle = 'rgba(255, 102, 0, 0.10)';
  ctx.strokeStyle = 'rgba(255, 102, 0, 0.35)';
  ctx.lineWidth = 1;
  roundedRect(ctx, x, y, width, height, height / 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORS.orange;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + paddingX, y + height / 2 + 1);
  ctx.restore();

  return width;
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawTerminal(ctx, x, y, width, height) {
  ctx.save();

  // panel
  ctx.fillStyle = COLORS.panel;
  roundedRect(ctx, x, y, width, height, 16);
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // title bar
  ctx.fillStyle = '#1a1a1a';
  roundedRect(ctx, x, y, width, 48, 16);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x, y + 32, width, 16);

  const dots = ['#ff5f56', '#ffbd2e', '#27c93f'];
  dots.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 26 + index * 20, y + 24, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = COLORS.greyDark;
  ctx.font = `400 16px ${MONO}, monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('portfolio.ts', x + width / 2, y + 25);
  ctx.textAlign = 'left';

  // code lines
  const lines = [
    {
      indent: 0,
      segments: [
        { text: 'const', color: COLORS.orange },
        { text: ' stack = [', color: COLORS.white },
      ],
    },
    {
      indent: 0,
      segments: [
        { text: '"TypeScript"', color: COLORS.orangeSoft },
        { text: ',', color: COLORS.white },
      ],
    },
    {
      indent: 0,
      segments: [
        { text: '"Node.js"', color: COLORS.orangeSoft },
        { text: ',', color: COLORS.white },
      ],
    },
    {
      indent: 0,
      segments: [
        { text: '"n8n"', color: COLORS.orangeSoft },
        { text: '', color: COLORS.white },
      ],
    },
    { indent: 0, segments: [{ text: '];', color: COLORS.white }] },
  ];

  const lineHeight = 30;
  let cursorY = y + 86;
  let lastCursorX = x + 28;
  ctx.font = `400 18px ${MONO}, monospace`;
  ctx.textBaseline = 'middle';

  for (const line of lines) {
    let cursorX = x + 28 + line.indent * 18;
    for (const segment of line.segments) {
      ctx.fillStyle = segment.color;
      ctx.fillText(segment.text, cursorX, cursorY);
      cursorX += ctx.measureText(segment.text).width;
    }
    lastCursorX = cursorX;
    cursorY += lineHeight;
  }

  // caret
  ctx.fillStyle = COLORS.orange;
  ctx.fillRect(lastCursorX + 2, cursorY - 34, 10, 20);

  ctx.restore();
}

function renderHomeCard() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawGlow(ctx, WIDTH * 0.78, HEIGHT * 0.18, 460, 0.26);
  drawGlow(ctx, WIDTH * 0.1, HEIGHT * 0.95, 380, 0.14);
  drawDotMatrix(ctx, {
    originX: 700,
    originY: 60,
    cols: 22,
    rows: 12,
    gap: 22,
    radius: 2,
    alpha: 0.5,
  });

  // top rule
  const topRule = ctx.createLinearGradient(0, 0, WIDTH, 0);
  topRule.addColorStop(0, 'rgba(255,102,0,0)');
  topRule.addColorStop(0.5, COLORS.orange);
  topRule.addColorStop(1, 'rgba(255,102,0,0)');
  ctx.fillStyle = topRule;
  ctx.fillRect(0, 0, WIDTH, 3);

  // brand
  drawBrand(ctx, 72, 84);

  // eyebrow
  ctx.font = `500 20px ${MONO}, monospace`;
  ctx.fillStyle = COLORS.orange;
  ctx.textBaseline = 'middle';
  ctx.fillText('REMOTE · AVAILABLE FOR OPPORTUNITIES', 72, 176);

  // headline
  ctx.font = `700 74px ${MONO}, monospace`;
  ctx.fillStyle = COLORS.white;
  ctx.fillText('Backend &', 72, 254);
  ctx.fillStyle = COLORS.orange;
  ctx.fillText('Automation', 72, 336);
  ctx.fillStyle = COLORS.white;
  ctx.fillText('Engineer', 72, 418);

  // sub copy
  ctx.font = `400 26px ${SANS}, sans-serif`;
  ctx.fillStyle = COLORS.grey;
  ctx.fillText('TypeScript · Node.js · n8n', 72, 486);

  // terminal panel on the right
  drawTerminal(ctx, 690, 168, 440, 330);

  // bottom rule + url
  const bottomRule = ctx.createLinearGradient(0, 0, WIDTH, 0);
  bottomRule.addColorStop(0, 'rgba(255,102,0,0)');
  bottomRule.addColorStop(0.5, COLORS.orange);
  bottomRule.addColorStop(1, 'rgba(255,102,0,0)');
  ctx.fillStyle = bottomRule;
  ctx.fillRect(0, HEIGHT - 3, WIDTH, 3);

  ctx.font = `500 22px ${MONO}, monospace`;
  ctx.fillStyle = COLORS.greyDark;
  ctx.textBaseline = 'middle';
  ctx.fillText('damtowise.xyz', 72, HEIGHT - 44);

  return canvas;
}

function renderDefaultCard() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawGlow(ctx, WIDTH * 0.62, HEIGHT * 0.28, 400, 0.16);
  drawGlow(ctx, WIDTH * 0.3, HEIGHT * 1.05, 380, 0.1);
  drawDotMatrix(ctx, {
    originX: 120,
    originY: 90,
    cols: 20,
    rows: 10,
    gap: 24,
    radius: 2,
    alpha: 0.35,
  });

  const rule = ctx.createLinearGradient(0, 0, WIDTH, 0);
  rule.addColorStop(0, 'rgba(255,102,0,0)');
  rule.addColorStop(0.5, COLORS.orange);
  rule.addColorStop(1, 'rgba(255,102,0,0)');
  ctx.fillStyle = rule;
  ctx.fillRect(0, 0, WIDTH, 3);
  ctx.fillRect(0, HEIGHT - 3, WIDTH, 3);

  drawBrand(ctx, 120, 180, 26);

  ctx.font = `700 66px ${MONO}, monospace`;
  ctx.fillStyle = COLORS.white;
  ctx.textBaseline = 'middle';
  ctx.fillText('Damtowise', 120, 300);

  ctx.font = `400 28px ${SANS}, sans-serif`;
  ctx.fillStyle = COLORS.grey;
  ctx.fillText('Backend & Automation Engineer', 120, 372);

  let tagX = 120;
  tagX += drawTag(ctx, 'TypeScript', tagX, 430) + 12;
  tagX += drawTag(ctx, 'Node.js', tagX, 430) + 12;
  drawTag(ctx, 'n8n', tagX, 430);

  ctx.font = `500 22px ${MONO}, monospace`;
  ctx.fillStyle = COLORS.greyDark;
  ctx.fillText('damtowise.xyz', 120, HEIGHT - 60);

  return canvas;
}

async function writePng(canvas, name) {
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(ogDir, name);
  await writeFile(filePath, buffer);
  const kb = (buffer.length / 1024).toFixed(1);
  console.log(`  ${name.padEnd(14)} ${WIDTH}x${HEIGHT}  ${kb.padStart(7)} KB`);
  if (buffer.length > 300 * 1024) {
    console.warn(`    warning: ${name} exceeds the 300 KB OG budget`);
  }
}

async function main() {
  loadFonts();
  await mkdir(ogDir, { recursive: true });

  console.log('generating OG images');
  await writePng(renderHomeCard(), 'home.png');
  await writePng(renderDefaultCard(), 'default.png');
  console.log(`written to ${path.relative(rootDir, ogDir)}/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
