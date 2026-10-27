/* College Money Manager: the My budget screen. Saves to this browser only (localStorage "cmm.v1.state"). */
(function () {
  const M = Money, { CATS, CAT, FREQ, usd, num, iso, today, fmtDate } = M;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const KEY = "cmm.v1.state";

  const blank = () => ({ balance: "", endDate: iso(M.defaultEnd()), income: [], bills: [], spent: [], goals: [], pie: "logged" });
  let st = load();
  function load() { try { return { ...blank(), ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return blank(); } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} }
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 2400); }

  /* ---------- tabs ---------- */
  function showTab(id) {
    closePop();
    $$(".tabs [role=tab]").forEach(b => b.setAttribute("aria-selected", b.id === "tab-" + id));
    $("#view-budget").hidden = id !== "budget"; $("#view-learn").hidden = id !== "learn";
    if (location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
    if (id === "learn" && window.Learn) Learn.show();
  }
  $$(".tabs [role=tab]").forEach(b => b.addEventListener("click", () => showTab(b.id.slice(4))));
  $(".tabs").addEventListener("keydown", e => { if (!/Arrow(Left|Right)/.test(e.key)) return; const t = $$(".tabs [role=tab]"), i = t.indexOf(document.activeElement); const n = t[(i + (e.key === "ArrowRight" ? 1 : t.length - 1)) % t.length]; n.focus(); n.click(); });

  /* ---------- section 1 ---------- */
  $("#balance").addEventListener("input", e => { st.balance = e.target.value; save(); render(); });
  $("#endDate").addEventListener("change", e => { st.endDate = e.target.value || iso(M.defaultEnd()); save(); render(); });

  /* ---------- repeating rows: income, bills, goals ---------- */
  const freqOpts = (v, once) => Object.entries(FREQ).filter(([k]) => once || k !== "once").map(([k, f]) => `<option value="${k}" ${k === v ? "selected" : ""}>${f.name}</option>`).join("");
  const catOpts = v => CATS.map(c => `<option value="${c.id}" ${c.id === v ? "selected" : ""}>${c.name}</option>`).join("");
  function rowsHTML(kind) {
    const list = st[kind === "income" ? "income" : kind === "bill" ? "bills" : "goals"];
    if (!list.length) return `<p class="empty">${{ income: "Nothing yet. Add a paycheck or money from home.", bill: "No bills yet. Most students have rent and a phone bill.", goal: "No goals yet." }[kind]}</p>`;
    const head = { income: ["What", "Amount", "How often"], bill: ["Bill", "Amount", "How often"], goal: ["Goal", "Amount", "Saved so far"] }[kind];
    return `<div class="item colhead ${kind === "goal" ? "goal" : ""}" aria-hidden="true"><span>${head[0]}</span><span>${head[1]}</span><span>${head[2]}</span><span></span></div>` + list.map(r => `
      <div class="item ${kind === "goal" ? "goal" : ""}" data-kind="${kind}" data-id="${r.id}">
        <input data-f="name" value="${esc(r.name)}" aria-label="${head[0]}" placeholder="${{ income: "Part-time job", bill: "Rent", goal: "Spring break" }[kind]}">
        <span class="money"><input data-f="amount" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(r.amount)}" aria-label="${head[1]}"></span>
        ${kind === "goal" ? `<span class="money"><input data-f="saved" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(r.saved)}" aria-label="Saved so far" placeholder="0"></span>`
          : `<select data-f="freq" aria-label="How often">${freqOpts(r.freq, kind === "income")}</select>`}
        <button class="x" aria-label="Remove ${esc(r.name || head[0])}">×</button>
        ${kind === "bill" ? `<div class="meta cat"><span class="dot" style="background:${CAT[r.cat || "other"].color}"></span><select data-f="cat" aria-label="Category for ${esc(r.name || "this bill")}">${catOpts(r.cat || "other")}</select>${whyChip(r)}</div>` : ""}
      </div>`).join("");
  }
  function renderLists() {
    $("#incomeList").innerHTML = rowsHTML("income");
    $("#billList").innerHTML = rowsHTML("bill");
    $("#goalList").innerHTML = rowsHTML("goal");
  }
  const listOf = kind => st[kind === "income" ? "income" : kind === "bill" ? "bills" : "goals"];
  $$("[data-add]").forEach(b => b.addEventListener("click", () => {
    const kind = b.dataset.add;
    listOf(kind).push(kind === "goal" ? { id: uid(), name: "", amount: "", saved: "" } : { id: uid(), name: "", amount: "", freq: "monthly", cat: kind === "bill" ? "other" : undefined });
    save(); renderLists(); render();
    const rows = $$(`[data-kind="${kind}"]`); rows[rows.length - 1].querySelector("input").focus();
  }));
  $(".inputs").addEventListener("input", e => {
    const row = e.target.closest(".item"); if (!row) return;
    const r = listOf(row.dataset.kind).find(x => x.id === row.dataset.id), f = e.target.dataset.f;
    r[f] = e.target.value;
    if (f === "cat") { r.by = "you"; renderLists(); }
    save(); render();
  });
  $(".inputs").addEventListener("change", e => {
    /* when a bill's name is finished, ask Jev for its category (unless the student already picked one) */
    const row = e.target.closest(".item[data-kind=bill]"); if (!row || e.target.dataset.f !== "name") return;
    const r = st.bills.find(x => x.id === row.dataset.id);
    if (r.name.trim() && r.by !== "you") classify(r, () => { renderLists(); render(); });
  });
  $(".inputs").addEventListener("click", e => {
    const x = e.target.closest(".item .x");
    if (x) { const row = x.closest(".item"), list = listOf(row.dataset.kind); list.splice(list.findIndex(r => r.id === row.dataset.id), 1); save(); renderLists(); render(); return; }
    const w = e.target.closest(".why[data-why]"); if (w) whyPop(w);
  });

  /* ---------- everyday spending ---------- */
  $("#quickDate").value = iso(today());
  $("#quick").addEventListener("submit", e => {
    e.preventDefault();
    const raw = $("#quickText").value.trim(), m = raw.match(/\$?\s*(\d+(?:[.,]\d{1,2})?)/);
    if (!m) { toast("Start with the amount, like: 12.50 chipotle"); return; }
    const amount = parseFloat(m[1].replace(",", ".")), what = (raw.slice(0, m.index) + raw.slice(m.index + m[0].length)).replace(/\s+/g, " ").replace(/^(on|for|at)\s+/i, "").trim() || "Spending";
    const entry = { id: uid(), date: $("#quickDate").value || iso(today()), amount, what, cat: "other", by: "pending" };
    st.spent.unshift(entry); save();
    $("#quickText").value = ""; $("#quickText").focus();
    renderSpent(); render();
    classify(entry, () => { renderSpent(); render(); });
  });
  async function classify(entry, done) {
    entry.by = "pending"; done();
    const r = await Jev.sort(entry.what || entry.name);
    if (entry.by === "you") return;
    Object.assign(entry, { cat: r.cat, need: r.need, by: r.by, probs: r.probs, needP: r.needP });
    save(); done(); jevStatus();
  }
  function whyChip(e) {
    if (e.by === "pending") return `<span class="why">Jev is sorting…</span>`;
    if (e.by === "you") return `<span class="why you" title="You chose this category">you chose</span>`;
    if (e.by === "keyword") return `<button class="why unsure" data-why="${e.id}" title="Jev couldn't be reached; this is a keyword guess">guess</button>`;
    if (e.by === "jev" && e.probs) { const p = e.probs[e.cat] || 0; return `<button class="why ${p < 0.5 ? "unsure" : ""}" data-why="${e.id}" aria-label="Jev ${Math.round(p * 100)}% sure. Show why">Jev ${Math.round(p * 100)}%</button>`; }
    return "";
  }
  function renderSpent() {
    const list = st.spent.slice().sort((a, b) => b.date.localeCompare(a.date));
    $("#spentList").innerHTML = list.length ? list.map(e => `
      <div class="entry" data-id="${e.id}">
        <span class="d">${fmtDate(M.parse(e.date))}</span>
        <span class="w" title="${esc(e.what)}">${esc(e.what)}${e.need === false ? ` <span class="why" title="Sorted as a want">want</span>` : e.need ? ` <span class="why" title="Sorted as a need">need</span>` : ""}</span>
        <span class="cat"><span class="dot" style="background:${CAT[e.cat].color}"></span><select aria-label="Category for ${esc(e.what)}">${catOpts(e.cat)}</select>${whyChip(e)}</span>
        <span class="amt">${usd(e.amount, true)}</span>
        <button class="x" aria-label="Remove ${esc(e.what)}">×</button>
      </div>`).join("") : `<p class="empty" style="padding:10px 0">Nothing logged yet.</p>`;
  }
  $("#spentList").addEventListener("change", e => {
    const row = e.target.closest(".entry"); if (!row || e.target.tagName !== "SELECT") return;
    const en = st.spent.find(x => x.id === row.dataset.id); en.cat = e.target.value; en.by = "you"; en.need = ["housing", "groceries", "school", "transport"].includes(en.cat) ? true : en.cat === "fun" || en.cat === "eating" ? false : en.need;
    save(); renderSpent(); render();
  });
  $("#spentList").addEventListener("click", e => {
    const row = e.target.closest(".entry"); if (!row) return;
    if (e.target.closest(".x")) { st.spent = st.spent.filter(x => x.id !== row.dataset.id); save(); renderSpent(); render(); }
    const w = e.target.closest(".why[data-why]"); if (w) whyPop(w);
  });

  /* what Jev returned for one entry */
  function whyPop(btn) {
    closePop();
    const e = st.spent.find(x => x.id === btn.dataset.why) || st.bills.find(x => x.id === btn.dataset.why); if (!e) return;
    const pop = document.createElement("div"); pop.className = "pop"; pop.id = "pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Why this category");
    if (e.by === "keyword") pop.innerHTML = `<h4>A keyword guess</h4><p>Jev couldn't be reached, so the app matched words in "${esc(e.what || e.name)}" against a list. Change the category if it's wrong.</p>`;
    else {
      const rows = Object.entries(e.probs).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="pr ${k === e.cat ? "win" : ""}"><span>${CAT[k].name}</span><span><i style="width:${Math.round(v * 100)}%"></i></span><span>${Math.round(v * 100)}%</span></div>`).join("");
      pop.innerHTML = `<h4>Jev on "${esc(e.what || e.name)}"</h4><div class="q">${esc(Jev.QUESTIONS.cat.instructions)}</div>${rows}
        <div class="q">${esc(Jev.QUESTIONS.need.instructions)}</div><div class="pr win"><span>need</span><span><i style="width:${Math.round(e.needP * 100)}%"></i></span><span>${Math.round(e.needP * 100)}%</span></div>
        <div class="q">Jev returned only these numbers. If it's split or wrong, pick the category yourself; your choice always wins.</div>`;
    }
    pop.insertAdjacentHTML("beforeend", `<button class="btn ghost small">Close</button>`);
    document.body.appendChild(pop);
    const r = btn.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(window.innerWidth - pop.offsetWidth - 8, r.left + scrollX)) + "px"; pop.style.top = r.bottom + scrollY + 6 + "px";
    pop.querySelector("button").addEventListener("click", () => { closePop(); btn.focus(); });
    pop.querySelector("button").focus({ preventScroll: true });
  }
  function closePop() { const p = $("#pop"); p && p.remove(); }
  document.addEventListener("keydown", e => { if (e.key === "Escape") closePop(); });
  document.addEventListener("pointerdown", e => { if (!e.target.closest(".pop, .why")) closePop(); });

  function jevStatus() {
    const n = st.spent.filter(e => e.by === "jev").length + st.bills.filter(e => e.by === "jev").length, k = st.spent.filter(e => e.by === "keyword").length;
    $("#jevBar").innerHTML = `<span>${Jev.online === false ? "Jev can't be reached right now, so new entries get a keyword guess (marked \"guess\")." : `Jev sorted ${n} ${n === 1 ? "entry" : "entries"}${k ? `, ${k} by keyword guess` : ""}. Only the words go to Jev, never the amount.`}</span>
      <details><summary>What Jev is asked</summary><pre>${esc(JSON.stringify(Jev.QUESTIONS, null, 2))}</pre></details>`;
  }

  /* ---------- results ---------- */
  function render() {
    const p = M.plan(st), has = num(st.balance) > 0 || st.income.length || st.bills.length || st.spent.length;
    $("#starter").hidden = !!has;
    const hero = $("#hero");
    const left = M.daysBetween(p.t0, p.end), wks = Math.round(p.weeks * 10) / 10;
    if (!has) {
      hero.className = "box hero blank";
      hero.innerHTML = `<p class="verdict">Will your money last until ${fmtDate(p.end)}?</p><p class="lede">Fill in what you have, what comes in, and what goes out. This box answers the question and gives you one number to live by: how much you can spend each week.</p>`;
    } else {
      const out = p.hasLogs ? p.outPace : p.outPlan, short = !!out || p.weekly < 0;
      hero.className = "box hero" + (short ? " short" : "");
      const verdict = p.weekly < 0 ? `Your bills and goals already need <em>${usd(-p.free)}</em> more than you'll have.`
        : out ? `At your pace, you run out on <em>${fmtDate(out, true)}</em>.`
        : p.hasLogs ? `At your pace, you make it to ${fmtDate(p.end)} with <em>${usd(p.endPace)}</em> left.`
        : `You can spend <em>${usd(p.weekly)}</em> a week and make it.`;
      const lede = p.weekly < 0 ? "Before everyday spending, look at the biggest bill, the income, and the goals. The math is below."
        : out ? `That's ${M.daysBetween(out, p.end)} days before the semester ends. Spending ${usd(p.weekly)} a week instead gets you to ${fmtDate(p.end)} with your goals covered.`
        : p.hasLogs ? `Your goals are already set aside in that. Keep your everyday spending under ${usd(p.weekly)} a week and you stay on track.`
        : "That covers your bills and sets aside your goals first. Log what you spend to see whether your real pace matches.";
      hero.innerHTML = `<p class="verdict">${verdict}</p><p class="lede">${lede}</p>
        <div class="stats">
          <div class="stat"><div class="k">Weekly number</div><div class="v ${p.weekly < 0 ? "neg" : ""}">${usd(Math.max(0, p.weekly))}</div><div class="s">for food, fun, and everything else</div></div>
          <div class="stat"><div class="k">Your pace</div><div class="v">${p.hasLogs ? usd(p.pace * 7) : "—"}</div><div class="s">${p.hasLogs ? `a week, from ${p.logSpan} days logged` : "log spending to see it"}</div></div>
          <div class="stat"><div class="k">Time left</div><div class="v">${left} days</div><div class="s">${wks} weeks, to ${fmtDate(p.end)}</div></div>
        </div>
        <details class="math"><summary>Show the math</summary><table>
          <tr><td>Money you have today</td><td>${usd(p.balance, true)}</td></tr>
          <tr><td>+ Money coming in before ${fmtDate(p.end)}</td><td>${usd(p.incomeTotal, true)}</td></tr>
          <tr><td>− Bills due before ${fmtDate(p.end)}</td><td>${usd(-p.billTotal, true)}</td></tr>
          <tr><td>− Still to save for your goals</td><td>${usd(-p.goalLeft, true)}</td></tr>
          <tr class="total"><td>= Free for everyday spending</td><td>${usd(p.free, true)}</td></tr>
          <tr><td>÷ ${wks} weeks left</td><td>${usd(p.weekly, true)} a week</td></tr>
        </table></details>`;
    }
    const cats = M.byCategory(st, st.pie, p);
    Charts.pie($("#pie"), $("#pieTable"), cats, st.pie === "logged" ? "Log some spending to see where it goes." : "Add bills or log spending to see a typical month.");
    $$(".seg [role=radio]").forEach(b => b.setAttribute("aria-checked", b.dataset.pie === st.pie));
    const need = st.spent.filter(e => e.need === true).reduce((s, e) => s + num(e.amount), 0), want = st.spent.filter(e => e.need === false).reduce((s, e) => s + num(e.amount), 0);
    $("#needs").innerHTML = need + want ? `<b>Needs and wants</b> in what you logged
      <div class="bar" role="img" aria-label="Needs ${usd(need)}, wants ${usd(want)}"><i style="flex:${need};background:var(--c1)"></i><i style="flex:${want};background:var(--c2)"></i></div>
      <div class="lbl"><span>Needs ${usd(need)} (${Math.round(need / (need + want) * 100)}%)</span><span>Wants ${usd(want)} (${Math.round(want / (need + want) * 100)}%)</span></div>` : "";
    Charts.runway($("#runway"), $("#runwayTable"), $("#runwayLegend"), p);
    const tips = M.tips(st, p, M.byCategory(st, "month", p));
    $("#tips").innerHTML = `<h2 id="ht">What stands out</h2>` + (tips.length ? `<ul>${tips.map(t => `<li class="${t.k}">${t.t}${t.s ? `<span class="src">Why: ${t.s}</span>` : ""}</li>`).join("")}</ul>` : `<p class="hint">Notes show up here once you've added some numbers.</p>`);
  }
  $(".seg").addEventListener("click", e => { const b = e.target.closest("[data-pie]"); if (!b) return; st.pie = b.dataset.pie; save(); render(); });

  function fill() {
    $("#balance").value = st.balance; $("#endDate").value = st.endDate;
    renderLists(); renderSpent(); jevStatus(); render();
  }

  /* ---------- sample student (made up) ---------- */
  $("#loadSample").addEventListener("click", () => {
    const t = today(), d = n => iso(M.addDays(t, -n));
    const sp = [[0, 14.25, "chipotle after class", "eating"], [0, 6.1, "starbucks", "eating"], [1, 48, "gas", "transport"], [1, 62.4, "kroger groceries", "groceries"], [2, 35, "bar on the square", "fun"],
      [3, 22.5, "doordash", "eating"], [3, 12, "laundry", "personal"], [4, 89, "textbook for econ", "school"], [5, 18, "pizza with roommates", "eating"], [6, 60, "football tickets", "fun"],
      [7, 9.5, "chick-fil-a", "eating"], [8, 31.2, "walmart groceries", "groceries"], [8, 25, "haircut", "personal"], [9, 40, "formal shirt", "personal"], [10, 44, "gas", "transport"],
      [11, 27, "drinks with friends", "fun"], [12, 11.75, "taco bell", "eating"], [13, 15, "movie", "fun"]];
    st = { ...blank(), balance: "1850", endDate: st.endDate || iso(M.defaultEnd()),
      income: [{ id: uid(), name: "Part-time job", amount: "160", freq: "weekly" }, { id: uid(), name: "From family", amount: "250", freq: "monthly" }],
      bills: [{ id: uid(), name: "Rent", amount: "650", freq: "monthly", cat: "housing", by: "you" }, { id: uid(), name: "Phone", amount: "45", freq: "monthly", cat: "subs", by: "you" },
        { id: uid(), name: "Car insurance", amount: "110", freq: "monthly", cat: "transport", by: "you" }, { id: uid(), name: "Spotify", amount: "6", freq: "monthly", cat: "subs", by: "you" }],
      spent: sp.map(([n, a, w, c]) => ({ id: uid(), date: d(n), amount: a, what: w, cat: c, by: "keyword", need: ["groceries", "transport", "school"].includes(c) })),
      goals: [{ id: uid(), name: "Spring break", amount: "400", saved: "60" }] };
    save(); fill(); toast("Loaded a made-up student. Jev is sorting the spending.");
    st.spent.forEach(e => classify(e, () => { renderSpent(); render(); }));
  });
  $("#resetBtn").addEventListener("click", () => { if (!confirm("Clear everything you've entered on this device?")) return; st = blank(); save(); fill(); });
  $("#printBtn").addEventListener("click", () => { $$(".tableview").forEach(d => d.open = true); print(); });

  window.App = { esc, toast, showTab, get st() { return st; } };
  fill();
  showTab(location.hash === "#learn" ? "learn" : "budget");
  addEventListener("hashchange", () => showTab(location.hash === "#learn" ? "learn" : "budget"));
  addEventListener("resize", closePop);
})();
