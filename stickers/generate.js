import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createWriteStream, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import opentype from 'opentype.js';
import sharp from 'sharp';

export const BASE_URL = 'https://stoa-coaching.fr';
const MM = 1;
const PAGE = { width: 210 * MM, height: 297 * MM, margin: 8 * MM, gap: 4 * MM };
const COLORS = { black: '#0A0A09', bronze: '#A98650', marble: '#E9E7E1', cut: '#FF00FF' };
const here = dirname(fileURLToPath(import.meta.url));
const output = here;
const loadFont = (fontPath) => {
  const buffer = readFileSync(fontPath);
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
};
const fonts = {
  display: loadFont(join(here, 'fonts', 'CormorantGaramond.ttf')),
  text: loadFont(join(here, 'fonts', 'Jost.ttf')),
};

const stickers = [
  { id: 1, shape: 'round', width: 60, height: 60, title: 'STOA', subtitle: 'Le savoir comme fondation. La santé comme liberté.', motif: 'pi' },
  { id: 2, shape: 'round', width: 60, height: 60, title: 'Change ta vie.', subtitle: 'STOA', motif: 'laurel' },
  { id: 3, shape: 'round', width: 60, height: 60, title: 'Connais-toi\ntoi-même.', subtitle: '', motif: 'bust' },
  { id: 4, shape: 'rect', width: 80, height: 40, title: 'Tempérance ·\nAscèse · Areté', subtitle: 'STOA', motif: 'meander' },
  { id: 5, shape: 'rect', width: 80, height: 40, title: 'Corps · Table ·\nForce · Esprit', subtitle: 'STOA', motif: 'column' },
  { id: 6, shape: 'rect', width: 80, height: 40, title: '30 places\nfondatrices.', subtitle: 'STOA', motif: 'laurel' },
  { id: 7, shape: 'square', width: 50, height: 50, title: 'Distingue ce qui\ndépend de toi.', subtitle: '', motif: 'column' },
  { id: 8, shape: 'square', width: 50, height: 50, title: 'Memento mori.\nVis.', subtitle: 'STOA', motif: 'bust' },
  { id: 9, shape: 'rounded', width: 90, height: 30, title: 'Discipline.', subtitle: 'STOA', motif: 'meander' },
  { id: 10, shape: 'rounded', width: 90, height: 30, title: 'STOA', subtitle: 'Académie de santé', motif: 'pi' },
];

const escapeXml = (value) => String(value).replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]);
const number = (value) => Number(value.toFixed(3));

function pathText(font, text, x, baseline, size, { fill = COLORS.marble, align = 'left', tracking = 0 } = {}) {
  const width = font.getAdvanceWidth(text, size, { kerning: true }) + Math.max(0, text.length - 1) * tracking;
  let cursor = x;
  if (align === 'center') cursor -= width / 2;
  if (align === 'right') cursor -= width;
  const path = font.getPath(text, cursor, baseline, size, { kerning: true, tracking });
  return `<path d="${pathToCubicData(path)}" fill="${fill}"/>`;
}

function pathToCubicData(path) {
  let currentX = 0;
  let currentY = 0;
  const parts = [];
  for (const command of path.commands) {
    if (command.type === 'M' || command.type === 'L') {
      parts.push(`${command.type}${number(command.x)} ${number(command.y)}`);
      currentX = command.x;
      currentY = command.y;
    } else if (command.type === 'C') {
      parts.push(`C${number(command.x1)} ${number(command.y1)} ${number(command.x2)} ${number(command.y2)} ${number(command.x)} ${number(command.y)}`);
      currentX = command.x;
      currentY = command.y;
    } else if (command.type === 'Q') {
      const controlX = command.x1;
      const controlY = command.y1;
      const firstX = currentX + (2 / 3) * (controlX - currentX);
      const firstY = currentY + (2 / 3) * (controlY - currentY);
      const secondX = command.x + (2 / 3) * (controlX - command.x);
      const secondY = command.y + (2 / 3) * (controlY - command.y);
      parts.push(`C${number(firstX)} ${number(firstY)} ${number(secondX)} ${number(secondY)} ${number(command.x)} ${number(command.y)}`);
      currentX = command.x;
      currentY = command.y;
    } else if (command.type === 'Z') {
      parts.push('Z');
    }
  }
  return parts.join(' ');
}

function multilineText(font, text, x, y, size, lineHeight, options = {}) {
  return text.split('\n').map((line, index) => pathText(font, line, x, y + index * lineHeight, size, options)).join('');
}

function meander(x, y, width) {
  const segments = Math.max(3, Math.floor(width / 8));
  let d = `M${x} ${y}`;
  for (let index = 0; index < segments; index += 1) d += `h4v3h-2v3h6v-6h-2v3h-2`;
  return `<path d="${d}" fill="none" stroke="${COLORS.bronze}" stroke-width=".45" opacity=".78"/>`;
}

function motif(name, width, height) {
  if (name === 'pi') return `${pathText(fonts.display, 'Π', width * .16, height * .31, Math.min(width, height) * .22, { fill: COLORS.bronze })}`;
  if (name === 'column') return `<g fill="none" stroke="${COLORS.bronze}" stroke-width=".55" opacity=".72"><path d="M8 7h12M9 9h10M11 10v12M17 10v12M9 23h10M7 25h14"/></g>`;
  if (name === 'bust') return `<path d="M8 24c2-5 7-6 9-7-2-1-3-3-3-6 0-4 2-7 6-7 3 0 5 2 5 5 0 2-1 4-3 5 1 2 4 3 7 4 3 1 5 3 6 6" fill="none" stroke="${COLORS.bronze}" stroke-width=".55" opacity=".72"/>`;
  if (name === 'laurel') return `<g fill="none" stroke="${COLORS.bronze}" stroke-width=".5" opacity=".72"><path d="M8 25C5 17 7 9 13 5M24 25c3-8 1-16-5-20"/><path d="M8 20l-4-2m5-2-4-3m6-1-3-4m16 12 4-2m-5-2 4-3m-6-1 3-4"/></g>`;
  return meander(6, height - 6, Math.max(20, width - 34));
}

function shapeMarkup(item, outerWidth, outerHeight) {
  if (item.shape === 'round') {
    return {
      background: `<circle cx="${outerWidth / 2}" cy="${outerHeight / 2}" r="${outerWidth / 2}" fill="${COLORS.black}"/>`,
      cut: `<circle cx="${outerWidth / 2}" cy="${outerHeight / 2}" r="${item.width / 2}"/>`,
    };
  }
  const radius = item.shape === 'rounded' ? 8 : item.shape === 'square' ? 3 : 4;
  return {
    background: `<rect width="${outerWidth}" height="${outerHeight}" rx="${radius + 2}" fill="${COLORS.black}"/>`,
    cut: `<rect x="2" y="2" width="${item.width}" height="${item.height}" rx="${radius}"/>`,
  };
}

function qrVector(url, x, y, size = 20) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'Q' });
  const moduleCount = qr.modules.size;
  const quiet = 4;
  const total = moduleCount + quiet * 2;
  const unit = size / total;
  let blocks = '';
  for (let row = 0; row < moduleCount; row += 1) {
    for (let column = 0; column < moduleCount; column += 1) {
      if (qr.modules.get(row, column)) blocks += `<rect x="${number(x + (column + quiet) * unit)}" y="${number(y + (row + quiet) * unit)}" width="${number(unit + .015)}" height="${number(unit + .015)}"/>`;
    }
  }
  return `<g aria-label="QR code"><rect x="${x - 2}" y="${y - 2}" width="${size + 4}" height="${size + 4}" rx="2" fill="${COLORS.marble}"/><g fill="${COLORS.black}">${blocks}</g></g>`;
}

function createSticker(item) {
  const bleed = 2;
  const outerWidth = item.width + bleed * 2;
  const outerHeight = item.height + bleed * 2;
  const shape = shapeMarkup(item, outerWidth, outerHeight);
  const url = `${BASE_URL}/?utm_source=sticker&utm_medium=offline&utm_campaign=lancement&utm_content=sticker-${String(item.id).padStart(2, '0')}`;
  let title = '';
  let subtitle = '';
  let qrX;
  let qrY;
  if (item.shape === 'round') {
    title = multilineText(fonts.display, item.title, outerWidth / 2, 18, item.id === 1 ? 9.5 : 7.1, 7.2, { align: 'center' });
    subtitle = item.subtitle ? multilineText(fonts.text, item.subtitle.replace('. ', '.\n'), outerWidth / 2, 26, 2.5, 3.1, { align: 'center', fill: COLORS.bronze, tracking: .03 }) : '';
    qrX = outerWidth / 2 - 10;
    qrY = outerHeight - 24;
  } else if (item.shape === 'square') {
    title = multilineText(fonts.display, item.title, 6, 14, 5.8, 6.2, { fill: COLORS.marble });
    subtitle = item.subtitle ? pathText(fonts.text, item.subtitle, 6, 28, 2.7, { fill: COLORS.bronze, tracking: .08 }) : '';
    qrX = outerWidth - 24;
    qrY = outerHeight - 24;
  } else {
    const titleSize = item.shape === 'rounded' ? 7.5 : 7;
    const baseline = item.shape === 'rounded' ? 15 : 16;
    title = multilineText(fonts.display, item.title, 7, baseline, titleSize, 7.2, { fill: COLORS.marble });
    subtitle = item.subtitle ? pathText(fonts.text, item.subtitle, 7, outerHeight - 7, 2.6, { fill: COLORS.bronze, tracking: .12 }) : '';
    qrX = outerWidth - 25;
    qrY = outerHeight / 2 - 10;
  }
  const art = `${shape.background}<g opacity=".72">${motif(item.motif, outerWidth, outerHeight)}</g>${title}${subtitle}${qrVector(url, qrX, qrY)}<g id="CutContour" inkscape:groupmode="layer" inkscape:label="CutContour" fill="none" stroke="${COLORS.cut}" stroke-width="0.088">${shape.cut}</g>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${outerWidth}mm" height="${outerHeight}mm" viewBox="0 0 ${outerWidth} ${outerHeight}">${art}</svg>`;
  return { ...item, outerWidth, outerHeight, url, art, svg };
}

function pack(items) {
  const maxWidth = PAGE.width - PAGE.margin * 2;
  const maxHeight = PAGE.height - PAGE.margin * 2;
  const sorted = [...items].sort((a, b) => b.outerHeight - a.outerHeight || b.outerWidth - a.outerWidth);
  const rows = [];
  for (const item of sorted) {
    let row = rows.find((candidate) => candidate.height >= item.outerHeight && candidate.width + PAGE.gap + item.outerWidth <= maxWidth);
    if (!row) {
      row = { width: 0, height: item.outerHeight, items: [] };
      rows.push(row);
    }
    if (row.items.length) row.width += PAGE.gap;
    row.items.push({ item, x: row.width });
    row.width += item.outerWidth;
  }
  const totalHeight = rows.reduce((sum, row) => sum + row.height, 0) + PAGE.gap * (rows.length - 1);
  if (totalHeight > maxHeight) throw new Error(`La planche dépasse la hauteur A4 (${totalHeight} mm).`);
  let y = PAGE.margin + (maxHeight - totalHeight) / 2;
  return rows.flatMap((row) => {
    const xOffset = PAGE.margin + (maxWidth - row.width) / 2;
    const placed = row.items.map(({ item, x }) => ({ item, x: xOffset + x, y }));
    y += row.height + PAGE.gap;
    return placed;
  });
}

async function validateQr(item) {
  const buffer = await QRCode.toBuffer(item.url, { errorCorrectionLevel: 'Q', margin: 4, width: 600, type: 'png' });
  const png = PNG.sync.read(buffer);
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height, { inversionAttempts: 'dontInvert' });
  if (!decoded || decoded.data !== item.url) throw new Error(`QR invalide pour sticker-${item.id}: ${decoded?.data || 'non décodé'}`);
}

async function writePdf(svg) {
  const destination = join(output, 'planche-stickers.pdf');
  const document = new PDFDocument({ size: [595.2756, 841.8898], margin: 0, compress: true, info: { Title: 'STOA - Planche de stickers de lancement', Creator: 'STOA generate.js' } });
  const stream = createWriteStream(destination);
  document.pipe(stream);
  SVGtoPDF(document, svg, 0, 0, { width: 595.2756, height: 841.8898, preserveAspectRatio: 'xMidYMid meet' });
  document.end();
  await new Promise((resolve, reject) => { stream.on('finish', resolve); stream.on('error', reject); });
}

await mkdir(output, { recursive: true });
const generated = stickers.map(createSticker);
await Promise.all(generated.map(validateQr));
await Promise.all(generated.map((item) => writeFile(join(output, `sticker-${String(item.id).padStart(2, '0')}.svg`), item.svg, 'utf8')));
const placement = pack(generated);
const planArt = placement.map(({ item, x, y }) => `<g transform="translate(${number(x)} ${number(y)})" data-sticker="${item.id}">${item.art}</g>`).join('');
const planSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="210mm" height="297mm" viewBox="0 0 210 297"><rect width="210" height="297" fill="#FFFFFF"/>${planArt}</svg>`;
await writeFile(join(output, 'planche-stickers.svg'), planSvg, 'utf8');
await sharp(Buffer.from(planSvg)).resize({ width: 2480, height: 3508, fit: 'fill' }).png({ compressionLevel: 9 }).withMetadata({ density: 300 }).toFile(join(output, 'apercu.png'));
await writePdf(planSvg);
console.log(`Planche générée: ${generated.length} stickers, ${placement.length} placements, QR validés.`);
