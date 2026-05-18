import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME = 'C:/Users/Mauricio/.cache/puppeteer/chrome/win64-121.0.6167.85/chrome-win64/chrome.exe';
const OUT_DIR = './temporary screenshots';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const url = process.argv[2] || 'http://localhost:1112/index.html';
const subIndex = parseInt(process.argv[3] || '1');  // which sub-trigger (1, 2, or 3)
const label = process.argv[4] || `sub-${subIndex}`;

const existing = fs.readdirSync(OUT_DIR).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] ?? 0)).filter(Boolean);
const next = nums.length ? Math.max(...nums) + 1 : 1;
const outPath = path.join(OUT_DIR, `screenshot-${next}-${label}.png`);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1200, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
await new Promise(r => setTimeout(r, 1000));

await page.hover('.nav-dropdown-trigger');
await new Promise(r => setTimeout(r, 400));

const triggers = await page.$$('.nav-dd-sub-trigger');
if (triggers[subIndex - 1]) {
  await triggers[subIndex - 1].hover();
  await new Promise(r => setTimeout(r, 700));
}

await page.screenshot({ path: outPath, fullPage: false });
await browser.close();
console.log(`Saved → ${outPath}`);
