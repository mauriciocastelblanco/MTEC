import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME = 'C:/Users/Mauricio/.cache/puppeteer/chrome/win64-121.0.6167.85/chrome-win64/chrome.exe';
const OUT_DIR = './temporary screenshots';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const url      = process.argv[2] || 'http://localhost:1112/quienes-somos.html';
const scrollY  = parseInt(process.argv[3] || '0');
const label    = process.argv[4] || `scroll-${scrollY}`;

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
await page.evaluate((y) => window.scrollTo(0, y), scrollY);
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();
console.log(`Saved → ${outPath}`);
