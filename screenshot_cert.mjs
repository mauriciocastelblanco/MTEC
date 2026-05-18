import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME = 'C:/Users/Mauricio/.cache/puppeteer/chrome/win64-121.0.6167.85/chrome-win64/chrome.exe';
const OUT_DIR = './temporary screenshots';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const url = process.argv[2];
const label = process.argv[3] || 'cert-zoom';

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
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));

await page.evaluate(() => {
  document.querySelectorAll('.reveal, .reveal-x, .line-reveal, .blur-reveal').forEach(el => {
    el.classList.add('is-revealed', 'in-view', 'revealed', 'visible');
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.filter = 'none';
  });
});

const targetY = await page.evaluate(() => {
  const el = document.querySelector('.cert-doc-links');
  if (!el) return null;
  return window.scrollY + el.getBoundingClientRect().top - 300;
});

if (targetY === null) { console.error('not found'); await browser.close(); process.exit(1); }

await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), targetY);
await new Promise(r => setTimeout(r, 800));

await page.screenshot({ path: outPath, fullPage: false });
await browser.close();
console.log(`Saved ${outPath}`);
