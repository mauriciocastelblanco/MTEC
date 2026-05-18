import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME = 'C:/Users/Mauricio/.cache/puppeteer/chrome/win64-121.0.6167.85/chrome-win64/chrome.exe';
const OUT_DIR = './temporary screenshots';

const url   = process.argv[2] || 'http://localhost:4321';
const label = process.argv[3] || 'seam';

const existing = fs.readdirSync(OUT_DIR).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] ?? 0)).filter(Boolean);
const next = nums.length ? Math.max(...nums) + 1 : 1;

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1500));

// Get top of each section then sample slightly above + at + slightly below
const tops = await page.evaluate(() => {
  return ['ch1','ch2','ch3','ch4'].map(id => {
    const el = document.getElementById(id);
    return { id, top: el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : 0 };
  });
});

let i = 0;
for (const { id, top } of tops) {
  const y = Math.max(0, top - 450); // center the section boundary in viewport
  await page.evaluate(yy => window.scrollTo(0, yy), y);
  await new Promise(r => setTimeout(r, 700));
  const out = path.join(OUT_DIR, `screenshot-${next + i}-${label}-${id}.png`);
  await page.screenshot({ path: out, fullPage: false });
  console.log(`saved ${out} — boundary ${id} at scrollY ${top}`);
  i++;
}

await browser.close();
