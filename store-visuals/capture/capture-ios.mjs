#!/usr/bin/env node
// Prend les captures brutes iPhone dans chaque langue, sur le simulateur démarré.
//
//   node capture/capture-ios.mjs                  toutes les langues
//   node capture/capture-ios.mjs --lang fr,de     certaines langues
//   node capture/capture-ios.mjs --no-home        sans le visuel 1 (écran d'accueil + écran verrouillé)
//
// Prérequis (une fois) : Kelec installé et connecté au compte démo ; widgets posés sur la première page de
// l'écran d'accueil et sur l'écran verrouillé ; Maestro installé (brew install mobile-dev-inc/tap/maestro).
// Le simulateur est piloté sans l'app Simulator : ne pas y toucher pendant la capture.
//
// Par langue : langue du simulateur + redémarrage (les widgets et l'écran verrouillé suivent la langue du système),
// barre d'état figée, 1.png (écran d'accueil), 2 à 5 via Maestro (ios-app.yaml), 1bis.png (écran verrouillé).

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { LANGS } from '../config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW = resolve(HERE, '../raw/iphone');

// Langue iOS et région de chaque langue de l'app (pt = Portugal, pas Brésil).
const LOCALES = {
  bg: ['bg', 'bg_BG'], ca: ['ca', 'ca_ES'], cs: ['cs', 'cs_CZ'], da: ['da', 'da_DK'], de: ['de', 'de_DE'],
  el: ['el', 'el_GR'], en: ['en', 'en_US'], es: ['es', 'es_ES'], fi: ['fi', 'fi_FI'], fr: ['fr', 'fr_FR'],
  hr: ['hr', 'hr_HR'], hu: ['hu', 'hu_HU'], it: ['it', 'it_IT'], nb: ['nb', 'nb_NO'], nl: ['nl', 'nl_NL'],
  pl: ['pl', 'pl_PL'], pt: ['pt-PT', 'pt_PT'], ro: ['ro', 'ro_RO'], sl: ['sl', 'sl_SI'], sv: ['sv', 'sv_SE'],
  tr: ['tr', 'tr_TR'],
};

const args = process.argv.slice(2);
const langArg = args.indexOf('--lang');
const langs = langArg >= 0 ? args[langArg + 1].split(',') : LANGS;
const withHome = !args.includes('--no-home');

const run = (cmd, cmdArgs, opts = {}) => execFileSync(cmd, cmdArgs, { encoding: 'utf8', ...opts });
const simctl = (...a) => run('xcrun', ['simctl', ...a]);
const sleep = (s) => run('sleep', [String(s)]);

function bootedDevice() {
  const { devices } = JSON.parse(simctl('list', 'devices', 'booted', '-j'));
  const booted = Object.values(devices).flat().filter((d) => d.state === 'Booted' && /iPhone/.test(d.name));
  if (booted.length !== 1) throw new Error(`Il faut exactement un simulateur iPhone démarré (trouvés : ${booted.length})`);
  return booted[0];
}

function setLanguage(udid, lang) {
  const [appleLang, locale] = LOCALES[lang];
  simctl('spawn', udid, 'defaults', 'write', '-g', 'AppleLanguages', '-array', appleLang);
  simctl('spawn', udid, 'defaults', 'write', '-g', 'AppleLocale', '-string', locale);
  simctl('shutdown', udid);
  simctl('boot', udid);
  simctl('bootstatus', udid, '-b');
  waitForHomeScreen(udid);
}

// bootstatus rend la main avant la fin de l'animation de démarrage (logo Apple sur fond noir).
// On attend une capture « lourde » : le logo fait ~70 Ko, l'écran d'accueil plusieurs Mo.
function waitForHomeScreen(udid) {
  const probe = join(HERE, '.probe.png');
  for (let i = 0; i < 60; i++) {
    simctl('io', udid, 'screenshot', probe);
    if (statSync(probe).size > 1_000_000) break;
    sleep(2);
  }
  rmSync(probe, { force: true });
  sleep(6); // le temps que les widgets se chargent
}

function freezeStatusBar(udid) {
  simctl('status_bar', udid, 'override', '--time', '9:41', '--dataNetwork', 'wifi', '--wifiMode', 'active',
    '--wifiBars', '3', '--cellularMode', 'active', '--cellularBars', '4', '--batteryState', 'charged', '--batteryLevel', '100');
}

function maestro(udid, flow, extra = []) {
  run('maestro', ['--device', udid, 'test', ...extra, join(HERE, flow)], { stdio: 'inherit' });
}

// Part de pixels colorés (parcs, Seine, lieux) sur la carte plein écran (3.png). Quand les tuiles Apple Plans
// ne sont pas chargées, la carte n'est qu'une grille beige : la part tombe à ~0.
async function mapColorRatio(page, path) {
  const src = `data:image/png;base64,${readFileSync(path).toString('base64')}`;
  return page.evaluate(async (url) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 200; c.height = 200;
    const ctx = c.getContext('2d');
    // Zone de la carte, sans la barre d'état ni les boutons du bas.
    ctx.drawImage(img, 0, img.height * 0.15, img.width, img.height * 0.7, 0, 0, 200, 200);
    const d = ctx.getImageData(0, 0, 200, 200).data;
    let colored = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) > 45) colored++;
    }
    return colored / (d.length / 4);
  }, src);
}

const MAP_MIN_RATIO = 0.03;
const ATTEMPTS = 4;

// Visuels 2 à 5. Maestro n'écrit ses captures que dans son dossier de sortie (sous-dossiers datés) : on les recopie.
async function captureApp(page, udid, out) {
  const tmp = join(HERE, '.maestro-out');
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    rmSync(tmp, { recursive: true, force: true });
    maestro(udid, 'ios-app.yaml', [`--test-output-dir=${tmp}`]);
    for (const f of readdirSync(tmp, { recursive: true })) {
      if (/takeScreenshot\/\d\.png$/.test(f)) copyFileSync(join(tmp, f), join(out, f.split('/').pop()));
    }
    rmSync(tmp, { recursive: true, force: true });
    const ratio = await mapColorRatio(page, join(out, '3.png'));
    if (ratio >= MAP_MIN_RATIO) return true;
    console.log(`  carte vide (${(ratio * 100).toFixed(1)} % de couleur), essai ${attempt}/${ATTEMPTS}`);
    if (attempt < ATTEMPTS) sleep(20 * attempt); // laisse le temps aux tuiles de se charger
  }
  return false;
}

const device = bootedDevice();
console.log(`Simulateur : ${device.name} (${device.udid})`);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const failed = [];

for (const lang of langs) {
  if (!LOCALES[lang]) throw new Error(`Langue inconnue : ${lang}`);
  const out = join(RAW, lang);
  mkdirSync(out, { recursive: true });
  console.log(`\n== ${lang}`);

  setLanguage(device.udid, lang);
  freezeStatusBar(device.udid);

  if (withHome) simctl('io', device.udid, 'screenshot', join(out, '1.png'));

  if (!(await captureApp(page, device.udid, out))) failed.push(lang);

  if (withHome) {
    freezeStatusBar(device.udid); // de nouveau : l'heure de l'écran verrouillé n'est pas toujours figée au premier essai
    maestro(device.udid, 'ios-lock.yaml');
    sleep(3);
    simctl('io', device.udid, 'screenshot', join(out, '1bis.png'));
  }
}

await browser.close();
if (failed.length) console.log(`\n! Carte non chargée pour : ${failed.join(', ')}. Relancer avec --lang ${failed.join(',')}`);
console.log(`\nCaptures dans ${RAW}. Visuels : node generate.mjs --target ios-iphone-6.3`);
