const PptxGenJS = require("pptxgenjs");
const path = require("path");

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE"; // 13.33" x 7.5" (16:9)

// ─── Brand tokens ────────────────────────────────────────────────────────────
const C = {
  darkBg:   "0D1B2E",
  primary:  "1B6CA8",
  platinum: "B2BEC9",
  secondary:"536073",
  lightBg:  "F4F6F9",
  altBg:    "EDF1F5",
  textDark: "0F161E",
  white:    "FFFFFF",
};

const LOGO_BLANCO = path.join(__dirname, "brand_assets", "Logo_MTEC-blanco.png");
const LOGO_NEGRO  = path.join(__dirname, "brand_assets", "Logo_MTEC-negro.png");

const W = 13.33; // slide width inches
const H = 7.5;   // slide height inches

// ─── helpers ─────────────────────────────────────────────────────────────────
function addBg(slide, hex) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: W, h: H,
    fill: { color: hex },
    line: { color: hex },
  });
}

// ─── SLIDE 1 · Portada ───────────────────────────────────────────────────────
const s1 = pres.addSlide();
addBg(s1, C.darkBg);

// Accent bar — left edge
s1.addShape(pres.ShapeType.rect, {
  x: 0, y: 0, w: 0.18, h: H,
  fill: { color: C.primary },
  line: { color: C.primary },
});

// Bottom accent strip
s1.addShape(pres.ShapeType.rect, {
  x: 0, y: H - 0.08, w: W, h: 0.08,
  fill: { color: C.primary },
  line: { color: C.primary },
});

// Logo blanco — top left
s1.addImage({ path: LOGO_BLANCO, x: 0.45, y: 0.35, w: 2.6, h: 0.75 });

// Divider line
s1.addShape(pres.ShapeType.line, {
  x: 0.45, y: 2.4, w: 5.5, h: 0,
  line: { color: C.primary, width: 1.5 },
});

// Main title
s1.addText("[TÍTULO DE LA PRESENTACIÓN]", {
  x: 0.45, y: 2.6, w: 9.5, h: 1.6,
  fontSize: 44,
  bold: true,
  color: C.white,
  fontFace: "Barlow Condensed",
  charSpacing: -0.5,
  valign: "top",
});

// Subtitle
s1.addText("[Subtítulo o descripción del documento]", {
  x: 0.45, y: 4.25, w: 9, h: 0.7,
  fontSize: 18,
  color: C.platinum,
  fontFace: "Inter",
});

// Tagline
s1.addText("DONDE LA FALLA NO ES UNA OPCIÓN", {
  x: 0.45, y: H - 0.72, w: 8, h: 0.4,
  fontSize: 10,
  color: C.primary,
  fontFace: "Barlow Condensed",
  bold: true,
  charSpacing: 2,
});

// Date / client info — bottom right
s1.addText("[Cliente]  ·  [Fecha]", {
  x: W - 3.5, y: H - 0.72, w: 3.2, h: 0.4,
  fontSize: 10,
  color: C.secondary,
  fontFace: "Inter",
  align: "right",
});


// ─── SLIDE 2 · Agenda ────────────────────────────────────────────────────────
const s2 = pres.addSlide();
addBg(s2, C.lightBg);

// Left accent column
s2.addShape(pres.ShapeType.rect, {
  x: 0, y: 0, w: 1.1, h: H,
  fill: { color: C.primary },
  line: { color: C.primary },
});

// "AGENDA" rotated text on left column
s2.addText("AGENDA", {
  x: -2.55, y: 3.4, w: H, h: 1.1,
  fontSize: 22,
  bold: true,
  color: C.white,
  fontFace: "Barlow Condensed",
  charSpacing: 4,
  align: "center",
  rotate: 270,
});

// Section title
s2.addText("AGENDA", {
  x: 1.5, y: 0.45, w: 7, h: 0.9,
  fontSize: 36,
  bold: true,
  color: C.primary,
  fontFace: "Barlow Condensed",
});

// Divider
s2.addShape(pres.ShapeType.line, {
  x: 1.5, y: 1.35, w: 10, h: 0,
  line: { color: C.platinum, width: 1 },
});

// Agenda items
const items = [
  "01  [Tema uno]",
  "02  [Tema dos]",
  "03  [Tema tres]",
  "04  [Tema cuatro]",
  "05  [Tema cinco]",
];

items.forEach((item, i) => {
  const yPos = 1.6 + i * 1.0;
  // Number+dot accent
  s2.addShape(pres.ShapeType.rect, {
    x: 1.5, y: yPos + 0.05, w: 0.06, h: 0.55,
    fill: { color: C.primary },
    line: { color: C.primary },
  });
  s2.addText(item, {
    x: 1.72, y: yPos, w: 10.5, h: 0.7,
    fontSize: 18,
    color: C.textDark,
    fontFace: "Inter",
  });
});

// Logo negro — bottom right
s2.addImage({ path: LOGO_NEGRO, x: W - 2.3, y: H - 0.85, w: 2.0, h: 0.58 });


// ─── SLIDE 3 · Contenido estándar ────────────────────────────────────────────
const s3 = pres.addSlide();
addBg(s3, C.white);

// Top title bar
s3.addShape(pres.ShapeType.rect, {
  x: 0, y: 0, w: W, h: 1.15,
  fill: { color: C.primary },
  line: { color: C.primary },
});

// Left accent on title bar
s3.addShape(pres.ShapeType.rect, {
  x: 0, y: 0, w: 0.18, h: 1.15,
  fill: { color: C.darkBg },
  line: { color: C.darkBg },
});

// Slide title
s3.addText("[Título de la sección]", {
  x: 0.4, y: 0.1, w: W - 3, h: 0.95,
  fontSize: 28,
  bold: true,
  color: C.white,
  fontFace: "Barlow Condensed",
  valign: "middle",
});

// Slide number placeholder
s3.addText("01", {
  x: W - 1.1, y: 0.1, w: 0.9, h: 0.95,
  fontSize: 28,
  bold: true,
  color: C.white,
  transparency: 60,
  fontFace: "Barlow Condensed",
  align: "right",
  valign: "middle",
});

// Body content area
s3.addText(
  "[Contenido principal: texto, listas, datos técnicos, etc.]\n\n" +
  "•  Punto clave uno\n" +
  "•  Punto clave dos\n" +
  "•  Punto clave tres",
  {
    x: 0.55, y: 1.4, w: W - 1.2, h: 5.3,
    fontSize: 16,
    color: C.textDark,
    fontFace: "Inter",
    lineSpacingMultiple: 1.4,
    valign: "top",
  }
);

// Bottom strip
s3.addShape(pres.ShapeType.rect, {
  x: 0, y: H - 0.65, w: W, h: 0.65,
  fill: { color: C.altBg },
  line: { color: C.altBg },
});

// Tagline in footer
s3.addText("DONDE LA FALLA NO ES UNA OPCIÓN", {
  x: 0.4, y: H - 0.55, w: 7, h: 0.45,
  fontSize: 8,
  color: C.secondary,
  fontFace: "Barlow Condensed",
  bold: true,
  charSpacing: 1.5,
  valign: "middle",
});

// Logo negro — bottom right in footer
s3.addImage({ path: LOGO_NEGRO, x: W - 2.2, y: H - 0.6, w: 1.9, h: 0.55 });


// ─── SLIDE 4 · Divisor de sección ────────────────────────────────────────────
const s4 = pres.addSlide();
addBg(s4, C.darkBg);

// Decorative horizontal accent — center
s4.addShape(pres.ShapeType.rect, {
  x: 0, y: H / 2 - 0.04, w: W, h: 0.08,
  fill: { color: C.primary },
  line: { color: C.primary },
});

// Large section number — background watermark
s4.addText("01", {
  x: 0, y: 0.5, w: W, h: H - 1,
  fontSize: 220,
  bold: true,
  color: "1B6CA8",
  fontFace: "Barlow Condensed",
  align: "center",
  valign: "middle",
  transparency: 85,
});

// Section label (small)
s4.addText("SECCIÓN", {
  x: 0, y: 2.4, w: W, h: 0.5,
  fontSize: 13,
  color: C.primary,
  fontFace: "Barlow Condensed",
  bold: true,
  charSpacing: 5,
  align: "center",
});

// Section title (large)
s4.addText("[TÍTULO DE LA SECCIÓN]", {
  x: 1.5, y: 2.9, w: W - 3, h: 1.8,
  fontSize: 52,
  bold: true,
  color: C.white,
  fontFace: "Barlow Condensed",
  align: "center",
  charSpacing: -0.5,
});

// Logo blanco — bottom center
s4.addImage({ path: LOGO_BLANCO, x: W / 2 - 1.3, y: H - 1.1, w: 2.6, h: 0.75 });

// Bottom tagline
s4.addText("DONDE LA FALLA NO ES UNA OPCIÓN", {
  x: 0, y: H - 0.35, w: W, h: 0.28,
  fontSize: 8,
  color: C.secondary,
  fontFace: "Barlow Condensed",
  bold: true,
  charSpacing: 2,
  align: "center",
});


// ─── Export ───────────────────────────────────────────────────────────────────
pres.writeFile({ fileName: "MTEC_Template.pptx" }).then(() => {
  console.log("✓  MTEC_Template.pptx generado correctamente.");
}).catch((err) => {
  console.error("Error generando el archivo:", err);
  process.exit(1);
});
