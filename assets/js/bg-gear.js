/* ══════════════════════════════════════
   MTEC — Background Gear (procedural)
   Builds the d-attribute for the gear geometry inside the SVG defs
   created by partials/bg-gear.html, draws radial ticks + inner
   reticle + glowing HUD nodes, and rotates the gear with scroll.

   Exposes window.MTEC.initBgGear() — idempotent. Call it once the
   bg-gear partial is in the DOM.
   ══════════════════════════════════════ */
(function () {
  const MTEC = (window.MTEC = window.MTEC || {});

  MTEC.initBgGear = function () {
    const spin = document.getElementById('bgGearLeft');
    if (!spin) return;

    const outerEl = document.getElementById('gearOuterShape');
    const bodyEl  = document.getElementById('gearBodyShape');
    // If geometry already built, skip — idempotent across reloads.
    if (outerEl && outerEl.getAttribute('d')) return;

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const cx = 500, cy = 500;
    const TEETH = 22;
    const period = (2 * Math.PI) / TEETH;
    const baseR = 175;      // tooth root radius
    const tipR  = 195;      // tooth tip radius
    const toothBaseHalfAng = period * 0.270;
    const toothTipHalfAng  = period * 0.150;
    const innerRingR = 150; // inner edge of toothed ring

    const pt = (r, a) =>
      `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;

    // ── Outer toothed silhouette ──
    let outerD = '';
    for (let i = 0; i < TEETH; i++) {
      const c = i * period - Math.PI / 2;
      const baseL = c - toothBaseHalfAng;
      const tipL  = c - toothTipHalfAng;
      const tipR_ = c + toothTipHalfAng;
      const baseR_ = c + toothBaseHalfAng;
      const nextBaseL = c + period - toothBaseHalfAng;
      if (i === 0) outerD += `M ${pt(baseR, baseL)} `;
      outerD += `L ${pt(tipR, tipL)} `;
      outerD += `A ${tipR} ${tipR} 0 0 1 ${pt(tipR, tipR_)} `;
      outerD += `L ${pt(baseR, baseR_)} `;
      outerD += `A ${baseR} ${baseR} 0 0 1 ${pt(baseR, nextBaseL)} `;
    }
    outerD += 'Z';

    // ── Body = outer ring + inner circle cutout (annulus) ──
    let bodyD = outerD + ' ';
    bodyD += `M ${cx + innerRingR},${cy} `;
    bodyD += `A ${innerRingR} ${innerRingR} 0 0 0 ${cx - innerRingR},${cy} `;
    bodyD += `A ${innerRingR} ${innerRingR} 0 0 0 ${cx + innerRingR},${cy} Z`;

    if (outerEl) outerEl.setAttribute('d', outerD);
    if (bodyEl)  bodyEl.setAttribute('d', bodyD);

    // ── Radial tick marks ──
    const gTicks = document.getElementById('gearTicks');
    if (gTicks) {
      for (let deg = 0; deg < 360; deg += 5) {
        const a = (deg - 90) * Math.PI / 180;
        const x1 = cx + 199 * Math.cos(a);
        const y1 = cy + 199 * Math.sin(a);
        let r2, opacity, width;
        if (deg % 30 === 0)      { r2 = 218; opacity = 0.82; width = 0.75; }
        else if (deg % 15 === 0) { r2 = 210; opacity = 0.55; width = 0.55; }
        else                      { r2 = 205; opacity = 0.32; width = 0.42; }
        const x2 = cx + r2 * Math.cos(a);
        const y2 = cy + r2 * Math.sin(a);
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', x1.toFixed(2));
        line.setAttribute('y1', y1.toFixed(2));
        line.setAttribute('x2', x2.toFixed(2));
        line.setAttribute('y2', y2.toFixed(2));
        line.setAttribute('stroke', `rgba(220, 228, 236, ${opacity})`);
        line.setAttribute('stroke-width', width.toFixed(2));
        line.setAttribute('stroke-linecap', 'round');
        gTicks.appendChild(line);
      }
      // Inner ring ticks
      for (let deg = 0; deg < 360; deg += 15) {
        const a = (deg - 90) * Math.PI / 180;
        const x1 = cx + 150 * Math.cos(a);
        const y1 = cy + 150 * Math.sin(a);
        const x2 = cx + 143 * Math.cos(a);
        const y2 = cy + 143 * Math.sin(a);
        const opacity = (deg % 45 === 0) ? 0.65 : 0.32;
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', x1.toFixed(2));
        line.setAttribute('y1', y1.toFixed(2));
        line.setAttribute('x2', x2.toFixed(2));
        line.setAttribute('y2', y2.toFixed(2));
        line.setAttribute('stroke', `rgba(214, 222, 230, ${opacity})`);
        line.setAttribute('stroke-width', '0.45');
        line.setAttribute('stroke-linecap', 'round');
        gTicks.appendChild(line);
      }

      // Tooth-tip highlights — bright arc at the very edge of each tooth.
      for (let i = 0; i < TEETH; i++) {
        const c = i * period - Math.PI / 2;
        const tipL = c - toothTipHalfAng * 0.88;
        const tipR_ = c + toothTipHalfAng * 0.88;
        const cosLight = Math.cos(c - Math.PI / 4); // light from upper-right
        const lit = cosLight > 0.3;
        const opacity = lit ? 0.88 : 0.45;
        const width = lit ? 1.1 : 0.55;
        const arc = document.createElementNS(SVG_NS, 'path');
        const d = `M ${pt(195, tipL)} A 195 195 0 0 1 ${pt(195, tipR_)}`;
        arc.setAttribute('d', d);
        arc.setAttribute('fill', 'none');
        arc.setAttribute('stroke', `rgba(236, 242, 248, ${opacity})`);
        arc.setAttribute('stroke-width', width.toFixed(2));
        arc.setAttribute('stroke-linecap', 'round');
        arc.setAttribute('style', 'mix-blend-mode: screen');
        gTicks.appendChild(arc);
      }
    }

    // ── Inner mini-gear reticle ──
    const gReticle = document.getElementById('gearReticle');
    if (gReticle) {
      const RT = 10;
      const rPeriod = (2 * Math.PI) / RT;
      const rBase = 62, rTip = 82;
      const rBaseHalf = rPeriod * 0.30;
      const rTipHalf  = rPeriod * 0.16;
      let rd = '';
      for (let i = 0; i < RT; i++) {
        const c = i * rPeriod - Math.PI / 2;
        const baseL = c - rBaseHalf;
        const tipL  = c - rTipHalf;
        const tipR_  = c + rTipHalf;
        const baseR_ = c + rBaseHalf;
        const nextBaseL = c + rPeriod - rBaseHalf;
        if (i === 0) rd += `M ${pt(rBase, baseL)} `;
        rd += `L ${pt(rTip, tipL)} `;
        rd += `A ${rTip} ${rTip} 0 0 1 ${pt(rTip, tipR_)} `;
        rd += `L ${pt(rBase, baseR_)} `;
        rd += `A ${rBase} ${rBase} 0 0 1 ${pt(rBase, nextBaseL)} `;
      }
      rd += 'Z';
      const reticle = document.createElementNS(SVG_NS, 'path');
      reticle.setAttribute('d', rd);
      reticle.setAttribute('fill', 'none');
      reticle.setAttribute('stroke', 'rgba(236, 242, 248, 0.78)');
      reticle.setAttribute('stroke-width', '0.7');
      reticle.setAttribute('stroke-linejoin', 'round');
      reticle.setAttribute('style', 'mix-blend-mode: screen');
      gReticle.appendChild(reticle);
      // Small concentric rings inside the mini-gear
      const dot1 = document.createElementNS(SVG_NS, 'circle');
      dot1.setAttribute('cx', '500'); dot1.setAttribute('cy', '500'); dot1.setAttribute('r', '42');
      dot1.setAttribute('fill', 'none');
      dot1.setAttribute('stroke', 'rgba(220, 228, 236, 0.55)');
      dot1.setAttribute('stroke-width', '0.5');
      dot1.setAttribute('stroke-dasharray', '2 3');
      gReticle.appendChild(dot1);
      const dot2 = document.createElementNS(SVG_NS, 'circle');
      dot2.setAttribute('cx', '500'); dot2.setAttribute('cy', '500'); dot2.setAttribute('r', '24');
      dot2.setAttribute('fill', 'none');
      dot2.setAttribute('stroke', 'rgba(220, 228, 236, 0.65)');
      dot2.setAttribute('stroke-width', '0.55');
      gReticle.appendChild(dot2);
    }

    // ── Glowing HUD nodes ──
    const gNodes = document.getElementById('gearNodes');
    if (gNodes) {
      const nodes = [
        { deg:  30, r: 200, b: 0.95 }, { deg:  90, r: 380, b: 0.95 },
        { deg: 150, r: 295, b: 0.85 }, { deg: 210, r: 200, b: 0.85 },
        { deg: 270, r: 380, b: 0.95 }, { deg: 330, r: 295, b: 0.85 },
        { deg:  60, r: 142, b: 0.90 }, { deg: 240, r: 142, b: 0.90 },
        { deg:   0, r: 420, b: 0.70 }, { deg: 180, r: 420, b: 0.70 },
      ];
      nodes.forEach(n => {
        const a = (n.deg - 90) * Math.PI / 180;
        const x = cx + n.r * Math.cos(a);
        const y = cy + n.r * Math.sin(a);
        const glow = document.createElementNS(SVG_NS, 'circle');
        glow.setAttribute('cx', x.toFixed(2));
        glow.setAttribute('cy', y.toFixed(2));
        glow.setAttribute('r', '2.6');
        glow.setAttribute('fill', `rgba(214, 222, 230, ${(n.b * 0.55).toFixed(2)})`);
        glow.setAttribute('filter', 'url(#nodeGlow)');
        gNodes.appendChild(glow);
        const dot = document.createElementNS(SVG_NS, 'circle');
        dot.setAttribute('cx', x.toFixed(2));
        dot.setAttribute('cy', y.toFixed(2));
        dot.setAttribute('r', '1.4');
        dot.setAttribute('fill', `rgba(255, 255, 255, ${n.b.toFixed(2)})`);
        gNodes.appendChild(dot);
      });
    }

    // ── Scroll-reactive rotation (skip when reduced motion is requested) ──
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ROT = 0.08;
    let ticking = false;
    const apply = () => {
      const deg = (window.scrollY * ROT).toFixed(2);
      spin.setAttribute('transform', `rotate(${deg} 500 500)`);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(apply); ticking = true; }
    }, { passive: true });
    apply();
  };
})();
