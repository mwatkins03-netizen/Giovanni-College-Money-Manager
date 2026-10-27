/* College Money Manager: the Learn tab. Six short lessons. Each has a "watch" part (a picture that builds step by step,
   with the words always on screen as a caption) and a "check yourself" question. Progress stays in this browser. */
(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { usd } = Money, esc = App.esc;
  const KEY = "cmm.v1.learn";
  let done = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
  const saveDone = () => { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch {} };

  /* ---------- small drawing helpers (viewBox 600 x 240) ---------- */
  const T = (x, y, s, o = "") => `<text x="${x}" y="${y}" font-size="13" fill="var(--ink)" ${o}>${s}</text>`;
  const Tb = (x, y, s, o = "") => `<text x="${x}" y="${y}" font-size="15" font-weight="800" fill="var(--ink)" ${o}>${s}</text>`;
  const box = (x, y, w, h, c, o = 1) => `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${Math.max(0, h)}" rx="3" fill="${c}" opacity="${o}"/>`;

  /* waterfall: a running total built bar by bar */
  function waterfall(items, step, scale) {
    let run = 0, s = "", x = 40;
    const base = 200, k = scale;
    items.forEach((it, i) => {
      if (i > step) return;
      const v = it.v, top = it.total ? run : v >= 0 ? run + v : run, bot = it.total ? 0 : v >= 0 ? run : run + v;
      s += box(x, base - top * k, 70, (top - bot) * k, it.c, i === step ? 1 : .85);
      s += Tb(x + 35, base - top * k - 8, (it.total ? "" : v >= 0 ? "+" : "−") + usd(Math.abs(it.total ? run : v)), 'text-anchor="middle"');
      s += T(x + 35, 222, it.l, 'text-anchor="middle" fill="var(--ink-2)"');
      if (!it.total) run += v;
      x += 105;
    });
    return `<line x1="30" x2="580" y1="200" y2="200" stroke="var(--ink)"/>` + s;
  }

  const LESSONS = [
    { id: "inout", title: "Two numbers: in and out", lede: "Every budget starts with what you have plus what's coming in, minus what has to go out. What's left, divided by the weeks left, is your weekly number.",
      watch: [
        "Say it's the start of a 16-week semester and you have $1,200 in checking.",
        "A part-time job pays $80 a week. Over 16 weeks that's $1,280 more coming in.",
        "Rent and the phone bill are $440 a month. Four months of bills is $1,760.",
        "You want $200 left at the end for spring break, so set it aside first.",
        "That leaves $520 for food, gas, and fun. Divided by 16 weeks: $32.50 a week. That's the weekly number. This app works it out for you on My budget."
      ],
      draw: st => waterfall([{ v: 1200, l: "Have now", c: "var(--c1)" }, { v: 1280, l: "Coming in", c: "var(--c3)" }, { v: -1760, l: "Bills", c: "var(--c8)" }, { v: -200, l: "Goal", c: "var(--c7)" }, { total: 1, l: "Left", c: "var(--brand)" }], st, 0.072)
        + (st === 4 ? Tb(560, 60, "÷ 16 weeks = $32.50 a week", 'text-anchor="end" fill="var(--brand)"') : ""),
      check: { kind: "number", q: "You have $900. Another $1,500 comes in before the semester ends. Your bills over that time add up to $1,600. There are 10 weeks left, and no savings goal. What's your weekly number?", answer: 80,
        right: "Right: $900 + $1,500 − $1,600 = $800, and $800 ÷ 10 weeks = $80 a week.", wrong: "Not quite. Add what you have and what's coming in, subtract the bills, then divide by the weeks: ($900 + $1,500 − $1,600) ÷ 10." } },

    { id: "fixed", title: "Fixed and flexible", lede: "Fixed costs are the same every time and hard to change this month: rent, a phone bill, insurance. Flexible costs move with your choices: food, gas, going out. You plan around fixed costs; you steer with flexible ones.",
      watch: [
        "Here are six things a student pays for.",
        "Rent, the phone bill, and a streaming subscription cost the same every month. They're fixed. In this app they go under \"Bills that repeat.\"",
        "Groceries, gas, and concert tickets change with what you do. They're flexible. You log them under \"What you spent.\"",
        "When money is tight, the flexible side is where you can act this week. Fixed costs change on a longer clock: a cheaper plan, a roommate, next year's lease."
      ],
      draw: st => {
        const items = [["Rent", 1], ["Groceries", 0], ["Phone bill", 1], ["Gas", 0], ["Netflix", 1], ["Concert tickets", 0]];
        let s = "";
        if (st >= 1) s += Tb(150, 30, "Fixed", 'text-anchor="middle"') + `<line x1="40" x2="260" y1="40" y2="40" stroke="var(--ink)"/>`;
        if (st >= 2) s += Tb(450, 30, "Flexible", 'text-anchor="middle"') + `<line x1="340" x2="560" y1="40" y2="40" stroke="var(--ink)"/>`;
        const n = [0, 0];
        items.forEach(([name, fx], i) => {
          const placed = (fx && st >= 1) || (!fx && st >= 2), col = fx ? 0 : 1;
          const x = placed ? (col ? 350 : 50) : 40 + (i % 3) * 180, y = placed ? 56 + n[col]++ * 44 : 80 + Math.floor(i / 3) * 60;
          s += box(x, y, 200, 34, placed ? (fx ? "var(--c1)" : "var(--c2)") : "var(--rule)", placed ? .18 : .6) + T(x + 12, y + 22, name, 'font-weight="600"');
        });
        if (st >= 3) s += T(450, 205, "← you can steer this side this week", 'text-anchor="middle" fill="var(--brand)" font-weight="700"');
        return s;
      },
      check: { kind: "sort", q: "Sort each one as fixed or flexible.", labels: ["Fixed", "Flexible"],
        items: [["Car insurance, $110 every month", 0], ["Eating out", 1], ["Gym membership", 0], ["Uber rides", 1], ["Rent", 0], ["Clothes", 1]],
        right: "All right. Monthly bills that don't change are fixed; anything that depends on what you choose this week is flexible.", wrong: "Some are off (marked in red). Ask: would this cost the same next month no matter what I do?" } },

    { id: "needs", title: "Needs and wants", lede: "A need keeps you housed, fed, healthy, getting to class, and enrolled. A want is anything you could skip or swap for something cheaper. Lots of things are part need and part want, and that's where your choices are.",
      watch: [
        "Picture a line from need on the left to want on the right.",
        "Rent, a required textbook, and groceries sit near the need end.",
        "Concert tickets and a fourth DoorDash order this week sit near the want end.",
        "A phone plan is a need. The newest phone on a payment plan is mostly a want. Lunch is a need. Lunch out every day is part want.",
        "On My budget, Jev guesses need or want for each thing you log, with a percentage. It's a judgment call, so you can change it. The point is to choose your wants on purpose."
      ],
      draw: st => {
        let s = `<line x1="40" x2="560" y1="120" y2="120" stroke="var(--ink)" stroke-width="2"/>` + Tb(40, 150, "Need") + Tb(560, 150, "Want", 'text-anchor="end"');
        const dots = [[70, "Rent", 1], [120, "Textbook", 1], [170, "Groceries", 1], [520, "Concert", 2], [470, "4th DoorDash", 2], [250, "Phone plan", 3], [400, "New phone", 3], [310, "Lunch out daily", 3]];
        dots.forEach(([x, l, at], i) => { if (st < at) return; const up = i % 2; s += `<circle cx="${x}" cy="120" r="7" fill="${x < 300 ? "var(--c1)" : "var(--c2)"}" stroke="var(--surface)" stroke-width="2"/>` + T(x, up ? 95 : 180, l, 'text-anchor="middle"'); });
        if (st >= 4) s += box(150, 20, 300, 40, "var(--brand)", .12) + T(300, 45, "Jev: \"need\" 62%  ·  you decide", 'text-anchor="middle" font-weight="700"');
        return s;
      },
      check: { kind: "sort", q: "Sort each one as a need or a want for a college student.", labels: ["Need", "Want"],
        items: [["Required lab fee", 0], ["Tickets to a formal", 1], ["Gas to get to class", 0], ["New shoes when your old ones are fine", 1], ["Groceries for the week", 0], ["A second streaming service", 1]],
        right: "All right. Notice that none of the wants are bad. They're just the part of the budget you get to pick.", wrong: "Some are off (marked in red). Ask: what happens if I skip it? If the answer is \"nothing serious,\" it's a want." } },

    { id: "first", title: "Pay yourself first", lede: "If you save whatever is left at the end of the month, there usually isn't anything left. Move the savings out first, the day money comes in, and spend from what remains.",
      watch: [
        "Two students each want $300 by the end of a 12-week semester.",
        "The first saves whatever's left. Every week, spending slowly eats the extra. By the end, they've saved $40.",
        "The second moves $25 into savings the day each paycheck lands, then spends from the rest.",
        "After 12 weeks: $25 × 12 = $300. Same income. The difference is the order."
      ],
      draw: st => {
        let s = T(40, 40, "Saves what's left", 'font-weight="700"') + T(40, 140, "Pays themself first", 'font-weight="700"');
        for (let w = 0; w < 12; w++) {
          const x = 200 + w * 30;
          if (st >= 1) { const h = [12, 0, 6, 0, 0, 10, 0, 4, 0, 0, 8, 0][w]; s += box(x, 80 - h * 2, 22, h * 2, "var(--c8)", .8); }
          if (st >= 2 && (st >= 3 || w < 4)) s += box(x, 190 - 50, 22, 50, "var(--brand)", .85);
        }
        s += `<line x1="195" x2="560" y1="80" y2="80" stroke="var(--rule)"/><line x1="195" x2="560" y1="190" y2="190" stroke="var(--rule)"/>`;
        if (st >= 1) s += Tb(570, 75, "$40", 'text-anchor="end" fill="var(--bad)"');
        if (st >= 3) s += Tb(570, 130, "$300", 'text-anchor="end" fill="var(--brand)"');
        return s;
      },
      check: { kind: "number", q: "You want $300 for spring break, and there are 12 weeks left. How much should you set aside each week?", answer: 25,
        right: "Right: $300 ÷ 12 = $25 a week. In this app, put it under Savings goals and it's set aside before your weekly number.", wrong: "Not quite. Divide the goal by the weeks you have: $300 ÷ 12." } },

    { id: "runway", title: "Read your runway", lede: "A runway chart shows your balance from today to the end of the semester. Where the line crosses zero is the day you'd run out. It turns \"I think I'm fine\" into a date.",
      watch: [
        "The line starts at what you have today.",
        "It steps up when money comes in and drops when a bill is due, like rent on the 1st.",
        "Between those, everyday spending pulls it down a little every day.",
        "This line crosses zero on November 20. The semester ends December 11. That's three weeks with no money.",
        "Spend a bit less each week and the line flattens. The dashed line is the weekly number: it lands at the end of the semester with your goals still saved."
      ],
      draw: st => {
        const pts = [], pts2 = []; let a = 900, b = 900;
        for (let d = 0; d <= 45; d++) { if (d === 5 || d === 35) { a -= 450; b -= 450; } if (d % 7 === 0 && d) { a += 160; b += 160; } a -= 38; b -= 18; pts.push([d, a]); pts2.push([d, b]); }
        const x = d => 60 + d * 11.5, y = v => 110 - v * 0.09;
        const cut = [8, 30, 46, 46, 46][st];
        let s = `<line x1="55" x2="580" y1="${y(0)}" y2="${y(0)}" stroke="var(--ink)"/>` + T(50, y(0) + 4, "$0", 'text-anchor="end" fill="var(--muted)"') + `<line x1="${x(45)}" x2="${x(45)}" y1="20" y2="200" stroke="var(--ink-2)" stroke-dasharray="3 3"/>` + T(x(45) - 4, 30, "Dec 11", 'text-anchor="end"');
        s += `<path d="M${pts.slice(0, cut).map(([d, v]) => `${x(d)} ${y(v)}`).join(" L")}" fill="none" stroke="var(--line-pace)" stroke-width="2"/>`;
        /* day 0 is Oct 27 and day 45 is Dec 11, so the crossing on day 24 is Nov 20 */
        if (st >= 3) s += `<circle cx="${x(24)}" cy="${y(0)}" r="5" fill="var(--line-pace)" stroke="var(--surface)" stroke-width="2"/>` + Tb(x(24), y(0) + 24, "Out of money Nov 20", 'text-anchor="middle" fill="var(--bad)"');
        if (st >= 4) s += `<path d="M${pts2.map(([d, v]) => `${x(d)} ${y(v)}`).join(" L")}" fill="none" stroke="var(--line-plan)" stroke-width="2" stroke-dasharray="6 4"/>`;
        return s;
      },
      check: { kind: "choice", q: "Your runway line crosses zero on November 20 and the semester ends December 11. What does that tell you?",
        options: ["You're fine, because the line starts above zero.", "At your current pace you'd have no money for the last three weeks.", "You need a new bank account.", "Your bills are too low."], answer: 1,
        right: "Right. The crossing is a date to beat. Lowering your weekly spending pushes it past the end of the semester.", wrong: "Look at where the line crosses zero, not where it starts. That's the day the money runs out." } },

    { id: "5030", title: "50/30/20 as a starting point", lede: "One common rule of thumb: about 50% of take-home money to needs, 30% to wants, and 20% to savings. It comes from Elizabeth Warren and Amelia Warren Tyagi's book All Your Worth. For students it's a starting point, not a law.",
      watch: [
        "Say $1,000 comes in each month after taxes.",
        "50%, or $500, goes to needs: rent share, groceries, gas, phone.",
        "30%, or $300, goes to wants: eating out, going out, extras.",
        "20%, or $200, goes to savings or paying down debt.",
        "In college, rent alone can be more than half. That's normal. If needs take 70%, the rule tells you the other 30% has to cover wants and savings, so choose carefully."
      ],
      draw: st => {
        const parts = [[500, "Needs 50%", "var(--c1)"], [300, "Wants 30%", "var(--c2)"], [200, "Savings 20%", "var(--c3)"]];
        let s = Tb(40, 50, "$1,000 a month"), x = 40;
        parts.forEach(([v, l, c], i) => { const w = v / 1000 * 520 - 2; s += box(x, 70, w, 50, st > i ? c : "var(--rule)", st > i ? .9 : .5); if (st > i) s += T(x + 8, 145, l, 'font-weight="700"') + T(x + 8, 165, usd(v)); x += w + 2; });
        if (st >= 4) s += box(40, 185, 520 * .7 - 2, 18, "var(--c8)", .8) + T(40 + 520 * .7 + 6, 199, "rent alone, for many students", 'fill="var(--ink-2)"');
        return s;
      },
      check: { kind: "choice", q: "You take home $1,200 a month. Under 50/30/20, about how much would go to wants?",
        options: ["$600", "$360", "$240", "$120"], answer: 1,
        right: "Right: 30% of $1,200 is $360. Needs would be $600 and savings $240.", wrong: "Wants are the 30% slice. 30% of $1,200 is $1,200 × 0.3." } }
  ];

  let cur = 0, step = 0, timer = null;
  function nav() {
    $("#lessonNav").innerHTML = LESSONS.map((l, i) => `<li><button data-l="${i}" ${i === cur ? 'aria-current="true"' : ""}><span class="k">${String(i + 1).padStart(2, "0")}</span><span>${l.title}</span><span class="ok" aria-label="${done[l.id] ? "checked" : ""}">${done[l.id] ? "✓" : ""}</span></button></li>`).join("");
    const n = LESSONS.filter(l => done[l.id]).length;
    $("#learnProgress").textContent = `${n} of ${LESSONS.length} checked. Saved on this device.`;
  }
  function lesson() {
    const L = LESSONS[cur]; stop(); step = 0;
    $("#lesson").innerHTML = `<p class="eyebrow">Lesson ${cur + 1} of ${LESSONS.length}</p><h2>${L.title}</h2><p class="lede">${L.lede}</p>
      <div class="watch" aria-label="Watch: a picture that builds in ${L.watch.length} steps">
        <svg viewBox="0 0 600 240" role="img" aria-hidden="true" id="wsvg"></svg>
        <div class="caption" aria-live="polite" id="wcap"></div>
        <div class="controls"><button class="btn small" id="wplay">Play</button><button class="btn ghost small" id="wprev" aria-label="Previous step">←</button><button class="btn ghost small" id="wnext" aria-label="Next step">→</button>
          <details><summary class="btn ghost small" style="list-style:none">Transcript</summary><ol style="margin:8px 0 0;font-size:14px">${L.watch.map(w => `<li>${w}</li>`).join("")}</ol></details>
          <span class="step" id="wstep"></span></div>
      </div>
      <div class="check" id="check"></div>
      <p class="src">Ideas in this lesson follow consumer.gov's Making a Budget, the CFPB's Your Money, Your Goals, and Federal Student Aid's budgeting guide. Examples are made up.</p>
      <div class="nav"><button class="btn ghost" id="lprev" ${cur ? "" : "disabled"}>← Previous lesson</button><button class="btn" id="lnext">${cur < LESSONS.length - 1 ? "Next lesson →" : "Back to My budget →"}</button></div>`;
    draw();
    $("#wplay").onclick = () => timer ? stop() : play();
    $("#wprev").onclick = () => { stop(); step = Math.max(0, step - 1); draw(); };
    $("#wnext").onclick = () => { stop(); step = Math.min(L.watch.length - 1, step + 1); draw(); };
    $("#lprev").onclick = () => go(cur - 1);
    $("#lnext").onclick = () => cur < LESSONS.length - 1 ? go(cur + 1) : App.showTab("budget");
    check(L);
  }
  function draw() {
    const L = LESSONS[cur];
    $("#wsvg").innerHTML = L.draw(step);
    $("#wcap").innerHTML = `<span class="who">Step ${step + 1}</span>${esc(L.watch[step])}`;
    $("#wstep").textContent = `${step + 1} / ${L.watch.length}`;
  }
  function play() {
    const L = LESSONS[cur];
    if (step >= L.watch.length - 1) { step = 0; draw(); }
    $("#wplay").textContent = "Pause";
    timer = setInterval(() => { if (step >= L.watch.length - 1) return stop(); step++; draw(); }, 4200);
  }
  function stop() { clearInterval(timer); timer = null; const b = $("#wplay"); if (b) b.textContent = "Play"; }
  function go(i) { cur = i; nav(); lesson(); $("#lesson").focus({ preventScroll: true }); $("#lesson").scrollIntoView({ block: "start", behavior: "smooth" }); }

  function check(L) {
    const C = L.check, el = $("#check");
    let body = "";
    if (C.kind === "number") body = `<form class="num" id="cform"><span class="money" style="flex:1"><input id="cnum" type="number" inputmode="decimal" step="0.01" aria-label="Your answer" required></span><button class="btn">Check</button></form>`;
    if (C.kind === "choice") body = `<form id="cform"><div class="opts" role="radiogroup">${C.options.map((o, i) => `<label class="opt"><input type="radio" name="c" value="${i}" required>${o}</label>`).join("")}</div><button class="btn">Check</button></form>`;
    if (C.kind === "sort") body = `<form id="cform"><div class="sorter">${C.items.map(([t], i) => `<div class="si" data-i="${i}"><span>${t}</span><span class="seg" role="radiogroup" aria-label="${esc(t)}">${C.labels.map((lb, j) => `<button type="button" role="radio" aria-checked="false" data-v="${j}">${lb}</button>`).join("")}</span></div>`).join("")}</div><button class="btn">Check</button></form>`;
    el.innerHTML = `<h3>Check yourself${done[L.id] ? " ✓" : ""}</h3><p>${C.q}</p>${body}<div id="cfb"></div>`;
    if (C.kind === "sort") $$(".si .seg", el).forEach(g => g.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; $$("button", g).forEach(x => x.setAttribute("aria-checked", x === b)); }));
    $("#cform").addEventListener("submit", e => {
      e.preventDefault();
      let ok = false;
      if (C.kind === "number") ok = Math.abs(Money.num($("#cnum").value) - C.answer) < 0.5;
      if (C.kind === "choice") ok = +(new FormData(e.target).get("c")) === C.answer;
      if (C.kind === "sort") {
        const rows = $$(".si", el); if (rows.some(r => !r.querySelector('[aria-checked="true"]'))) { $("#cfb").innerHTML = `<div class="fb bad">Sort every item first.</div>`; return; }
        ok = true; rows.forEach(r => { const right = +r.querySelector('[aria-checked="true"]').dataset.v === C.items[r.dataset.i][1]; r.classList.toggle("right", right); r.classList.toggle("wrong", !right); if (!right) ok = false; });
      }
      $("#cfb").innerHTML = `<div class="fb ${ok ? "good" : "bad"}">${ok ? C.right : C.wrong}</div>`;
      if (ok && !done[L.id]) { done[L.id] = true; saveDone(); nav(); el.querySelector("h3").textContent = "Check yourself ✓"; }
    });
  }

  $("#lessonNav").addEventListener("click", e => { const b = e.target.closest("[data-l]"); if (b) go(+b.dataset.l); });
  let started = false;
  window.Learn = { show() { if (!started) { started = true; nav(); lesson(); } } };
  if (!$("#view-learn").hidden) Learn.show();
})();
