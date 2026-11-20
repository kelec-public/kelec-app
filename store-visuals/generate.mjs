#!/usr/bin/env node
// Génère les visuels stores : un panorama par cible et par langue, découpé en un PNG par visuel.
//
//   node generate.mjs                               toutes les cibles qui ont un dossier raw/, toutes les langues
//   node generate.mjs --target ios-iphone-6.9 --lang fr,en
//
// Sortie : out/<cible>/<langue>/01.png … et panorama.png (aperçu).

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { FALLBACK_LANG, LANGS, STYLE, TARGETS } from './config.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const FONTS = resolve(ROOT, '../assets/fonts/Renault');
const TEXTS = JSON.parse(readFileSync(join(ROOT, 'texts.json'), 'utf8'));
const SLIDE_COUNT = TEXTS.fr.length;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    args[argv[i].replace(/^--/, '')] = argv[i + 1];
  }
  return {
    targets: args.target ? args.target.split(',') : Object.keys(TARGETS),
    langs: args.lang ? args.lang.split(',') : LANGS,
  };
}

const url = (path) => pathToFileURL(path).href;

function findRaw(target, lang, name) {
  for (const l of [lang, FALLBACK_LANG]) {
    for (const ext of ['png', 'jpg', 'jpeg']) {
      const p = join(ROOT, 'raw', target.raw, l, `${name}.${ext}`);
      if (existsSync(p)) return { path: p, fallback: l !== lang };
    }
  }
  return null;
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildHtml(targetName, target, lang, warnings) {
  const { width: W, height: H, title, device } = target;
  const framePath = join(ROOT, target.frame);
  // En data URL : le canvas qui détecte l'écran ne peut pas lire les pixels d'un fichier file://.
  const frame = existsSync(framePath) ? `data:image/png;base64,${readFileSync(framePath).toString('base64')}` : null;
  const texts = TEXTS[lang];

  const slots = texts.map(([line1, line2], i) => {
    const n = i + 1;
    const shots = [findRaw(target, lang, `${n}`), findRaw(target, lang, `${n}bis`)];
    if (!shots[0]) warnings.push(`${targetName}/${lang} : capture ${n} absente (raw/${target.raw}/${lang}/${n}.png)`);
    shots.forEach((s, k) => {
      if (s?.fallback) warnings.push(`${targetName}/${lang} : capture ${n}${k ? 'bis' : ''} reprise de « ${FALLBACK_LANG} »`);
    });
    const devices = shots
      .map((s, k) => (k === 0 || s ? { src: s ? url(s.path) : '', top: device.top + k * device.bisOffset * device.height } : null))
      .filter(Boolean)
      .map(
        (d) => `<div class="device" style="top:${d.top}px;height:${device.height}px">
          <div class="screen">${d.src ? `<img class="shot" src="${d.src}">` : ''}</div>
          ${frame ? `<img class="frame" src="${frame}">` : ''}
        </div>`,
      )
      .join('');
    return `<section class="slot" style="left:${i * W}px">
      <h1 class="title"><span>${escapeHtml(line1)}</span><span class="accent">${escapeHtml(line2)}</span></h1>
      ${devices}
    </section>`;
  });

  const panoramaWidth = W * texts.length;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: NouvelR; font-weight: 400; src: url("${url(join(FONTS, 'NouvelRRegular.ttf'))}"); }
  @font-face { font-family: NouvelR; font-weight: 700; src: url("${url(join(FONTS, 'NouvelRBold.ttf'))}"); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${panoramaWidth}px; height: ${H}px; overflow: hidden; position: relative;
    background: linear-gradient(to right, ${STYLE.gradientFrom}, ${STYLE.gradientTo}) 0 0 / ${panoramaWidth * STYLE.gradientOverflow}px 100% no-repeat; }
  .slot { position: absolute; top: 0; width: ${W}px; height: ${H}px; overflow: hidden; }
  .title { position: absolute; top: ${title.top}px; left: ${title.sideMargin}px; right: ${title.sideMargin}px;
    display: flex; flex-direction: column; align-items: center; text-align: center;
    font: 400 ${title.fontSize}px/normal NouvelR; color: ${STYLE.titleColor}; }
  .title span { white-space: nowrap; }
  .title .accent { font-weight: 700; color: ${STYLE.accentColor}; }
  .device { position: absolute; left: 50%; transform: translateX(-50%); }
  .screen { position: absolute; overflow: hidden; background: #111; }
  .shot { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
  .frame { position: absolute; inset: 0; width: 100%; height: 100%; }
</style></head>
<body>${slots.join('')}
<script>
  const CSS_FRAME = ${JSON.stringify(frame ? null : target.cssFrame ?? null)};

  // Cherche l'écran (zone transparente) dans le PNG du cadre : bords, puis rayon des coins.
  function screenHole(img) {
    const w = img.naturalWidth, h = img.naturalHeight;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const a = ctx.getImageData(0, 0, w, h).data;
    const opaque = (x, y) => a[(y * w + x) * 4 + 3] > 128;
    const cy = Math.round(h / 2), cx = Math.round(w / 4); // à gauche du centre, pour éviter l'encoche / l'île
    let left = Math.round(w / 2); while (left > 0 && !opaque(left - 1, cy)) left--;
    let right = Math.round(w / 2); while (right < w - 1 && !opaque(right + 1, cy)) right++;
    let top = cy; while (top > 0 && !opaque(cx, top - 1)) top--;
    let bottom = cy; while (bottom < h - 1 && !opaque(cx, bottom + 1)) bottom++;
    // Sur la diagonale depuis le coin du trou : parfois d'abord hors du téléphone (transparent), puis le cadre,
    // puis l'écran. Le bord de l'écran est le premier pixel transparent après le cadre.
    let d = 0, inFrame = false;
    for (; d < (right - left) / 2; d++) {
      if (opaque(left + d, top + d)) inFrame = true;
      else if (inFrame) break;
    }
    const radius = d / (Math.SQRT2 - 1);
    return { left, top, width: right - left + 1, height: bottom - top + 1, radius, w, h };
  }

  const loaded = (img) => img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; });

  async function layoutDevice(el) {
    const height = parseFloat(el.style.height);
    const screen = el.querySelector('.screen');
    const frame = el.querySelector('.frame');
    const shot = el.querySelector('.shot');
    if (frame) {
      await loaded(frame);
      const hole = screenHole(frame);
      const k = height / hole.h;
      el.style.width = hole.w * k + 'px';
      Object.assign(screen.style, {
        left: hole.left * k + 'px', top: hole.top * k + 'px',
        width: hole.width * k + 'px', height: hole.height * k + 'px',
        // Même arrondi que le trou du cadre : les coins de la capture ne dépassent pas.
        borderRadius: hole.radius * k + 'px',
      });
      return;
    }
    // Cadre dessiné en CSS (Android sans PNG) : proportions de la capture.
    if (shot) await loaded(shot);
    const ratio = shot && shot.naturalHeight ? shot.naturalWidth / shot.naturalHeight : 1080 / 2400;
    const f = CSS_FRAME;
    const bezel = height * f.bezel;
    const width = (height - 2 * bezel) * ratio + 2 * bezel;
    Object.assign(el.style, {
      width: width + 'px', background: '#0b0b0d', borderRadius: width * f.radius + 'px',
      boxShadow: 'inset 0 0 0 ' + bezel * 0.22 + 'px #3a3d44, 0 30px 80px rgba(0,0,0,.25)',
    });
    Object.assign(screen.style, {
      left: bezel + 'px', top: bezel + 'px', width: width - 2 * bezel + 'px', height: height - 2 * bezel + 'px',
      borderRadius: width * f.screenRadius + 'px',
    });
    const cam = document.createElement('div');
    const size = width * f.camera;
    Object.assign(cam.style, {
      position: 'absolute', width: size + 'px', height: size + 'px', borderRadius: '50%', background: '#000',
      left: '50%', top: bezel + size * 0.9 + 'px', transform: 'translateX(-50%)',
    });
    el.appendChild(cam);
  }

  // Réduit le titre si une ligne dépasse la largeur (traductions longues).
  function fitTitle(el) {
    const max = el.clientWidth;
    const widest = Math.max(...[...el.children].map((s) => s.scrollWidth));
    const ratio = Math.min(1, max / widest);
    if (ratio < 1) el.style.fontSize = parseFloat(getComputedStyle(el).fontSize) * ratio + 'px';
    return ratio;
  }

  window.ready = (async () => {
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('img')].map(loaded));
    const ratios = [...document.querySelectorAll('.title')].map(fitTitle);
    await Promise.all([...document.querySelectorAll('.device')].map(layoutDevice));
    return ratios;
  })();
</script></body></html>`;
}

async function launch() {
  try {
    return await chromium.launch({ channel: 'chrome' });
  } catch {
    return chromium.launch(); // Chromium de Playwright (npx playwright install chromium)
  }
}

async function main() {
  const { targets, langs } = parseArgs(process.argv.slice(2));
  const browser = await launch();
  const warnings = [];
  const tmp = join(ROOT, 'out', '.tmp');
  mkdirSync(tmp, { recursive: true });

  for (const targetName of targets) {
    const target = TARGETS[targetName];
    if (!target) throw new Error(`Cible inconnue : ${targetName} (${Object.keys(TARGETS).join(', ')})`);
    const rawDir = join(ROOT, 'raw', target.raw);
    if (!existsSync(rawDir) || readdirSync(rawDir).every((f) => f.startsWith('.'))) {
      console.log(`- ${targetName} : ignorée, aucune capture dans raw/${target.raw}/`);
      continue;
    }
    if (!existsSync(join(ROOT, target.frame)) && !target.cssFrame) {
      console.log(`- ${targetName} : ignorée, cadre ${target.frame} absent`);
      continue;
    }

    const page = await browser.newPage({ viewport: { width: target.width * SLIDE_COUNT, height: target.height } });
    for (const lang of langs) {
      if (!TEXTS[lang]) {
        warnings.push(`${lang} : pas de textes dans texts.json`);
        continue;
      }
      const htmlPath = join(tmp, `${targetName}-${lang}.html`);
      writeFileSync(htmlPath, buildHtml(targetName, target, lang, warnings));
      await page.goto(url(htmlPath));
      const ratios = await page.evaluate(() => window.ready);
      ratios.forEach((r, i) => {
        if (r < 0.8) warnings.push(`${targetName}/${lang} : titre ${i + 1} réduit à ${Math.round(r * 100)} % (texte à raccourcir ?)`);
      });

      const outDir = join(ROOT, 'out', targetName, lang);
      mkdirSync(outDir, { recursive: true });
      for (let i = 0; i < SLIDE_COUNT; i++) {
        await page.screenshot({
          path: join(outDir, `${String(i + 1).padStart(2, '0')}.png`),
          clip: { x: i * target.width, y: 0, width: target.width, height: target.height },
        });
      }
      await page.screenshot({ path: join(outDir, 'panorama.png'), scale: 'css', type: 'png' });
      console.log(`✓ ${targetName}/${lang}`);
    }
    await page.close();
  }

  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
  if (warnings.length) {
    console.log(`\n${warnings.length} avertissement(s) :`);
    for (const w of [...new Set(warnings)]) console.log(`  ! ${w}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
