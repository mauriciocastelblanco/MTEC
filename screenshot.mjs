import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME = 'C:/Users/Mauricio/.cache/puppeteer/chrome/win64-121.0.6167.85/chrome-win64/chrome.exe';
const OUT_DIR = './temporary screenshots';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const url   = process.argv[2] || 'http://localhost:4321';
const label = process.argv[3] || '';

// Auto-increment filename
const existing = fs.readdirSync(OUT_DIR).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] ?? 0)).filter(Boolean);
const next = nums.length ? Math.max(...nums) + 1 : 1;
const filename = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const outPath = path.join(OUT_DIR, filename);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
const w = parseInt(process.argv[4] || '1440');
const h = parseInt(process.argv[5] || '1024');
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();

console.log(`Screenshot saved → ${outPath}`);
