/* College Money Manager: the two charts, drawn as SVG. Every chart also has a table version under "Show as a table." */
(function () {
  const { usd, fmtDate } = Money;
  const NS = "http://www.w3.org/2000/svg";
  const tip = document.getElementById("tooltip");
  function showTip(html, x, y) {
    tip.innerHTML = html; tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.min(window.innerWidth - w - 8, Math.max(8, x + 14)) + "px";
    tip.style.top = Math.max(8, y - h - 12) + "px";
  }
  const hideTip = () => { tip.hidden = true; };

  /* ---------- donut ---------- */
  function pie(el, tableEl, rows, emptyText) {
    const total = rows.reduce((s, r) => s + r.value, 0);
    if (!total) { el.innerHTML = `<p class="nodata">${emptyText}</p>`; tableEl.innerHTML = ""; return; }
    rows = rows.slice().sort((a, b) => b.value - a.value);
    const R = 100, r = 62, cx = 110, cy = 110;
    let ang = -Math.PI / 2, paths = "";
    const arc = (a0, a1) => {
      const big = a1 - a0 > Math.PI ? 1 : 0, p = (rad, a) => `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
      if (a1 - a0 >= Math.PI * 2 - 1e-6) return `M ${p(R, a0)} A ${R} ${R} 0 1 1 ${p(R, a0 + Math.PI)} A ${R} ${R} 0 1 1 ${p(R, a0)} M ${p(r, a0)} A ${r} ${r} 0 1 0 ${p(r, a0 + Math.PI)} A ${r} ${r} 0 1 0 ${p(r, a0)} Z`;
      return `M ${p(R, a0)} A ${R} ${R} 0 ${big} 1 ${p(R, a1)} L ${p(r, a1)} A ${r} ${r} 0 ${big} 0 ${p(r, a0)} Z`;
    };
    rows.forEach(row => { const a1 = ang + row.value / total * Math.PI * 2; paths += `<path class="slice" data-id="${row.id}" d="${arc(ang, a1)}" fill="${row.color}" fill-rule="evenodd"><title>${row.name}: ${usd(row.value)}</title></path>`; ang = a1; });
    el.innerHTML = `<svg viewBox="0 0 220 220" role="img" aria-label="Spending by category, total ${usd(total)}">${paths}
        <text class="center-k" x="110" y="102" text-anchor="middle">TOTAL</text><text class="center-v" x="110" y="128" text-anchor="middle">${usd(total)}</text></svg>
      <ul class="plegend">${rows.map(row => `<li data-id="${row.id}"><span class="dot" style="background:${row.color}"></span><span>${row.name}</span><span class="amt">${usd(row.value)}</span><span class="p">${Math.round(row.value / total * 100)}%</span></li>`).join("")}</ul>`;
    const on = id => el.querySelectorAll("[data-id]").forEach(n => n.classList.toggle("on", n.dataset.id === id));
    el.querySelectorAll(".slice").forEach(s => {
      const row = rows.find(x => x.id === s.dataset.id);
      s.addEventListener("pointermove", ev => { on(row.id); showTip(`<b>${row.name}</b>${usd(row.value, true)} · ${Math.round(row.value / total * 100)}% of the total`, ev.clientX, ev.clientY); });
      s.addEventListener("pointerleave", () => { on(null); hideTip(); });
      s.querySelector("title").remove();
    });
    el.querySelectorAll(".plegend li").forEach(li => { li.addEventListener("pointerenter", () => on(li.dataset.id)); li.addEventListener("pointerleave", () => on(null)); });
    tableEl.innerHTML = `<table><thead><tr><th>Category</th><th class="r">Amount</th><th class="r">Share</th></tr></thead><tbody>${rows.map(row => `<tr><td>${row.name}</td><td class="r">${usd(row.value, true)}</td><td class="r">${(row.value / total * 100).toFixed(1)}%</td></tr>`).join("")}</tbody></table>`;
  }

  /* ---------- runway: balance over time, one dollar axis ---------- */
  function runway(el, tableEl, legendEl, p) {
    const W = 640, H = 280, L = 58, Rm = 16, T = 18, B = 34;
    const S = p.series, showPace = p.hasLogs;
    const vals = S.flatMap(s => showPace ? [s.pace, s.plan] : [s.plan]).concat([0]);
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = (hi - lo || 100) * 0.08; lo -= lo < 0 ? pad : 0; hi += pad;
    const step = niceStep((hi - lo) / 4); lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    const x = i => L + i / (S.length - 1 || 1) * (W - L - Rm), y = v => T + (hi - v) / (hi - lo) * (H - T - B);
    let g = "";
    for (let v = lo; v <= hi + 1e-6; v += step) g += `<line class="${Math.abs(v) < 1e-6 ? "zero" : "grid-l"}" x1="${L}" x2="${W - Rm}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${short(v)}</text>`;
    const ticks = monthTicks(S);
    ticks.forEach(i => { g += `<text class="ax" x="${x(i)}" y="${H - 12}" text-anchor="middle">${fmtDate(S[i].d)}</text>`; });
    const path = key => "M" + S.map((s, i) => `${x(i).toFixed(1)} ${y(s[key]).toFixed(1)}`).join(" L");
    g += `<line class="end" x1="${x(S.length - 1)}" x2="${x(S.length - 1)}" y1="${T}" y2="${H - B}"/><text class="lbl" x="${x(S.length - 1) - 4}" y="${T + 2}" text-anchor="end">Semester ends</text>`;
    g += `<path class="ln plan" d="${path("plan")}"/>`;
    if (showPace) g += `<path class="ln pace" d="${path("pace")}"/>`;
    const mark = (d, cls, label) => { const i = S.findIndex(s => +s.d === +d); if (i < 0) return ""; return `<circle class="mk" cx="${x(i)}" cy="${y(0)}" r="5" fill="var(--line-${cls})"/><text class="lbl" x="${x(i)}" y="${y(0) + 20}" text-anchor="middle">${label} ${fmtDate(d)}</text>`; };
    if (showPace && p.outPace) g += mark(p.outPace, "pace", "Out of money");
    else if (p.outPlan) g += mark(p.outPlan, "plan", "Out of money");
    g += `<g class="hov" visibility="hidden"><line class="hair" y1="${T}" y2="${H - B}"/><circle class="h1" r="4.5" fill="var(--line-plan)" stroke="var(--surface)" stroke-width="2"/>${showPace ? `<circle class="h2" r="4.5" fill="var(--line-pace)" stroke="var(--surface)" stroke-width="2"/>` : ""}</g>`;
    g += `<rect class="hit" x="${L}" y="${T}" width="${W - L - Rm}" height="${H - T - B}" fill="transparent"/>`;
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Projected balance from today to ${fmtDate(p.end)}">${g}</svg>`;
    const svg = el.querySelector("svg"), hov = svg.querySelector(".hov");
    svg.querySelector(".hit").addEventListener("pointermove", ev => {
      const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      const lp = pt.matrixTransform(svg.getScreenCTM().inverse());
      const i = Math.max(0, Math.min(S.length - 1, Math.round((lp.x - L) / (W - L - Rm) * (S.length - 1)))), s = S[i];
      hov.setAttribute("visibility", "visible");
      hov.querySelector(".hair").setAttribute("x1", x(i)); hov.querySelector(".hair").setAttribute("x2", x(i));
      hov.querySelector(".h1").setAttribute("cx", x(i)); hov.querySelector(".h1").setAttribute("cy", y(s.plan));
      if (showPace) { hov.querySelector(".h2").setAttribute("cx", x(i)); hov.querySelector(".h2").setAttribute("cy", y(s.pace)); }
      showTip(`<b>${fmtDate(s.d, true)}</b>${showPace ? `<span class="r"><i style="background:var(--line-pace)"></i>Your pace ${usd(s.pace)}</span>` : ""}<span class="r"><i style="background:var(--line-plan)"></i>Weekly number ${usd(s.plan)}</span>`, ev.clientX, ev.clientY);
    });
    svg.querySelector(".hit").addEventListener("pointerleave", () => { hov.setAttribute("visibility", "hidden"); hideTip(); });
    legendEl.innerHTML = (showPace ? `<span><i></i>At your logged pace</span>` : "") + `<span><i class="plan"></i>Spending exactly your weekly number</span>`;
    const weekly = S.filter((s, i) => i % 7 === 0 || i === S.length - 1);
    tableEl.innerHTML = `<table><thead><tr><th>Date</th>${showPace ? `<th class="r">Your pace</th>` : ""}<th class="r">Weekly number</th></tr></thead><tbody>${weekly.map(s => `<tr><td>${fmtDate(s.d, true)}</td>${showPace ? `<td class="r">${usd(s.pace)}</td>` : ""}<td class="r">${usd(s.plan)}</td></tr>`).join("")}</tbody></table>`;
  }
  function niceStep(raw) { const m = Math.pow(10, Math.floor(Math.log10(raw || 1))); const f = raw / m; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * m; }
  function short(v) { const a = Math.abs(v); return (v < 0 ? "−" : "") + "$" + (a >= 1000 ? (a / 1000).toFixed(a % 1000 ? 1 : 0) + "k" : Math.round(a)); }
  function monthTicks(S) {
    const out = [0];
    S.forEach((s, i) => { if (i > 0 && (S.length < 70 ? s.d.getDay() === 1 && i - out[out.length - 1] >= 7 * Math.ceil(S.length / 56) : s.d.getDate() === 1)) out.push(i); });
    return out.filter(i => i < S.length - 6);
  }

  window.Charts = { pie, runway, showTip, hideTip };
})();
