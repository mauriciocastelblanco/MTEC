import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME = 'C:/Users/Mauricio/.cache/puppeteer/chrome/win64-121.0.6167.85/chrome-win64/chrome.exe';
const OUT_DIR = './temporary screenshots';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const url   = process.argv[2] || 'http://localhost:4321';
const label = process.argv[3] || 'fullpage';

const existing = fs.readdirSync(OUT_DIR).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] ?? 0)).filter(Boolean);
const next = nums.length ? Math.max(...nums) + 1 : 1;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1500));

const totalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
const viewportH = 900;
const positions = [
  0,
  Math.round(totalHeight * 0.15),
  Math.round(totalHeight * 0.32),
  Math.round(totalHeight * 0.5),
  Math.round(totalHeight * 0.68),
  Math.round(totalHeight * 0.85),
  Math.max(0, totalHeight - viewportH),
];

let i = 0;
for (const y of positions) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await new Promise(r => setTimeout(r, 600));
  const out = path.join(OUT_DIR, `screenshot-${next + i}-${label}-${i}.png`);
  await page.screenshot({ path: out, fullPage: false });
  console.log(`saved ${out} at scrollY=${y}`);
  i++;
}

await browser.close();
