import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHROME = 'C:/Users/Mauricio/.cache/puppeteer/chrome/win64-121.0.6167.85/chrome-win64/chrome.exe';

const URL = process.argv[2] || 'http://localhost:4321/deliverables/brand_guidelines/brand_guideline_mtec_v2.html';
const OUT = process.argv[3] || path.join(
  __dirname,
  'deliverables/brand_guidelines/brand_guideline_mtec_v2.pdf'
);

// Extra print CSS injected at PDF time so we don't modify the source HTML.
// Goal: keep headings with their content, avoid orphaned titles, keep
// logical groups (cards, rows, grids, sample blocks) together.
const PRINT_CSS = `
  @page {
    size: A4;
    margin: 14mm 12mm;
  }

  html, body { background: white !important; }

  /* Hide sticky nav in PDF */
  .toc-nav { display: none !important; }

  /* Each major section starts on a fresh page */
  section { page-break-before: always !important; background: white !important; }
  .cover  { page-break-after: always !important; min-height: 100vh; }

  /* Reduce the giant top padding inside pages so content fits A4 better */
  .page { padding: 2.5rem 1.5rem !important; max-width: 100% !important; }

  /* Don't split the cover's circular accents off the page */
  .cover { break-inside: avoid; }

  /* Headings should never be left dangling at the bottom of a page */
  h1, h2, h3, h4, h5,
  .section-header,
  .subsection-title,
  .color-tier-label,
  .cards-section-label {
    break-after: avoid-page !important;
    page-break-after: avoid !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  /* Keep titled blocks bound to the content right after them */
  .section-header + *,
  .subsection-title + * {
    break-before: avoid-page !important;
    page-break-before: avoid !important;
  }

  /* Keep logical containers and their children whole */
  .mission-block,
  .vision-block,
  .overview-card,
  .overview-grid,
  .values-grid,
  .adjectives-row,
  .color-tier,
  .color-row,
  .color-card,
  .palette-strip,
  .semantic-row,
  .semantic-card,
  .type-sample-block,
  .type-scale-table,
  .pillar-grid,
  .pillar-card,
  .tagline-primary,
  .tagline-alts,
  .elevator-pitch,
  .message-list,
  .message-item,
  .do-dont,
  .do-dont-pair,
  .logo-showcase,
  .logo-panel,
  .logo-note,
  .cards-image-grid,
  .card-image-item,
  .usage-grid,
  .business-card,
  .social-post,
  .email-sig,
  .letterhead,
  .info-box,
  .imagery-grid,
  .imagery-card {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  /* Don't split table rows mid-row */
  .type-scale-table tr,
  .type-scale-table thead { break-inside: avoid !important; page-break-inside: avoid !important; }
  .type-scale-table thead { display: table-header-group; }

  /* Images should never split */
  img { break-inside: avoid !important; page-break-inside: avoid !important; }

  /* Footer should stay together */
  .manual-footer { break-inside: avoid !important; page-break-inside: avoid !important; page-break-before: always !important; }
`;

console.log(`Generating PDF...
  source: ${URL}
  output: ${OUT}`);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.emulateMediaType('print');
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

// Wait for fonts to load fully so headings/typography render correctly in PDF
await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; });

// Inject the page-break-friendly CSS
await page.addStyleTag({ content: PRINT_CSS });

// Small settle for late layout (image grid, fonts)
await new Promise(r => setTimeout(r, 800));

await page.pdf({
  path: OUT,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
  displayHeaderFooter: false,
});

await browser.close();
console.log(`PDF saved → ${OUT}`);
