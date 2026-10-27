/* College Money Manager: the money math. No screen code here, so every number the app shows can be traced to one place. */
(function () {
  /* Spending categories. Order matters: it sets the chart colors (--c1 ... --c8), which are tested to stay
     tellable apart for colorblind readers in this order. "Other" is always gray. */
  const CATS = [
    { id: "housing", name: "Rent & housing", desc: "rent, dorm, utilities, internet, renters insurance" },
    { id: "groceries", name: "Groceries", desc: "food and household supplies from a grocery store" },
    { id: "eating", name: "Eating out", desc: "restaurants, fast food, coffee shops, food delivery, snacks bought out" },
    { id: "transport", name: "Gas & getting around", desc: "gas, car payment, car insurance, parking, rideshare, bus, flights home" },
    { id: "fun", name: "Going out & fun", desc: "bars, parties, concerts, games, tickets, tailgates, hobbies, trips with friends" },
    { id: "school", name: "School", desc: "textbooks, course fees, supplies, printing, lab or software costs" },
    { id: "subs", name: "Phone & subscriptions", desc: "phone bill, streaming, music, apps, memberships billed every month" },
    { id: "personal", name: "Personal & health", desc: "clothes, haircuts, toiletries, gym, doctor, medicine, laundry" },
    { id: "other", name: "Other", desc: "gifts, fees, or anything that fits none of the others" }
  ];
  const CAT = Object.fromEntries(CATS.map((c, i) => [c.id, { ...c, color: `var(--c${i + 1})` }]));

  const DAY = 86400000;
  const iso = d => { const z = new Date(d); return `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, "0")}-${String(z.getDate()).padStart(2, "0")}`; };
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const today = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const daysBetween = (a, b) => Math.round((b - a) / DAY);
  const fmtDate = (d, long) => d.toLocaleDateString("en-US", long ? { weekday: "short", month: "short", day: "numeric" } : { month: "short", day: "numeric" });
  const usd = (n, cents) => (n < 0 ? "−" : "") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
  const num = v => { const n = parseFloat(String(v ?? "").replace(/[$,]/g, "")); return isFinite(n) ? n : 0; };

  function defaultEnd() { const t = today(); return t.getMonth() < 5 ? new Date(t.getFullYear(), 4, 8) : new Date(t.getFullYear(), 11, 11); }

  /* How often money moves, and what that is per month. */
  const FREQ = { weekly: { name: "every week", perMonth: 52 / 12 }, biweekly: { name: "every 2 weeks", perMonth: 26 / 12 }, monthly: { name: "every month", perMonth: 1 }, once: { name: "one time", perMonth: 0 } };

  /* When a repeating amount lands between today (exclusive) and the end (inclusive).
     Weekly and every-2-weeks start one period from today. Monthly lands on the 1st. One-time lands today. */
  function hits(freq, start, end) {
    const out = [];
    if (freq === "once") return [start];
    if (freq === "monthly") { let d = new Date(start.getFullYear(), start.getMonth() + 1, 1); while (d <= end) { out.push(d); d = new Date(d.getFullYear(), d.getMonth() + 1, 1); } return out; }
    const step = freq === "weekly" ? 7 : 14;
    for (let d = addDays(start, step); d <= end; d = addDays(d, step)) out.push(d);
    return out;
  }

  /* The whole plan, from what the student typed. */
  function plan(st) {
    const t0 = today();
    const end = st.endDate ? parse(st.endDate) : defaultEnd();
    const days = Math.max(1, daysBetween(t0, end));
    const weeks = days / 7;
    const balance = num(st.balance);

    const incomeTotal = st.income.reduce((s, i) => s + num(i.amount) * hits(i.freq, t0, end).length, 0);
    const billTotal = st.bills.reduce((s, b) => s + num(b.amount) * hits(b.freq, t0, end).length, 0);
    const goalLeft = st.goals.reduce((s, g) => s + Math.max(0, num(g.amount) - num(g.saved)), 0);
    const goalSaved = st.goals.reduce((s, g) => s + num(g.saved), 0);

    /* "Saved so far" is money already set aside, so it is not part of today's balance. */
    const free = balance + incomeTotal - billTotal - goalLeft;
    const weekly = free / weeks;

    /* Your pace: everyday spending you logged, per day, over the days you've been logging (at least a week). */
    const logs = st.spent.filter(e => e.date && parse(e.date) <= t0);
    let pace = null, logSpan = 0, logTotal = 0;
    if (logs.length) {
      const first = logs.reduce((m, e) => Math.min(m, parse(e.date)), Infinity);
      logSpan = Math.max(7, daysBetween(new Date(first), t0) + 1);
      logTotal = logs.reduce((s, e) => s + num(e.amount), 0);
      pace = logTotal / logSpan;
    }

    /* Day-by-day balance for two lines: spending at your logged pace, and spending exactly the weekly number. */
    const events = {};
    const put = (d, v) => { const k = iso(d); events[k] = (events[k] || 0) + v; };
    st.income.forEach(i => hits(i.freq, t0, end).forEach(d => put(d, num(i.amount))));
    st.bills.forEach(b => hits(b.freq, t0, end).forEach(d => put(d, -num(b.amount))));
    const planDaily = Math.max(0, weekly) / 7;
    const series = [];
    let a = balance, b = balance, outPace = null, outPlan = null;
    for (let i = 0; i <= days; i++) {
      const d = addDays(t0, i), k = iso(d);
      if (i > 0) { a += (events[k] || 0) - (pace ?? planDaily); b += (events[k] || 0) - planDaily; }
      if (a < 0 && !outPace) outPace = d;
      if (b < 0 && !outPlan) outPlan = d;
      series.push({ d, pace: a, plan: b });
    }
    return { t0, end, days, weeks, balance, incomeTotal, billTotal, goalLeft, goalSaved, free, weekly, pace, logSpan, logTotal, hasLogs: logs.length > 0,
      series, outPace, outPlan, endPace: a, endPlan: b, goalWeekly: goalLeft / weeks };
  }

  /* Spending by category for the pie. "logged" = what was typed. "month" = bills as a month plus a month at your pace, split the way your logs split. */
  function byCategory(st, mode, p) {
    const sums = Object.fromEntries(CATS.map(c => [c.id, 0]));
    if (mode === "logged") st.spent.forEach(e => { sums[e.cat || "other"] += num(e.amount); });
    else {
      st.bills.forEach(b => { sums[b.cat || "other"] += num(b.amount) * FREQ[b.freq].perMonth; });
      const logged = st.spent.reduce((s, e) => s + num(e.amount), 0);
      if (logged > 0 && p.pace) st.spent.forEach(e => { sums[e.cat || "other"] += (num(e.amount) / logged) * p.pace * 30.4; });
    }
    return CATS.map(c => ({ ...CAT[c.id], value: sums[c.id] })).filter(r => r.value > 0.004);
  }

  /* Plain-language observations. Each one names the rule that produced it. */
  function tips(st, p, monthCats) {
    const out = [];
    if (!p.balance && !st.income.length) return out;
    if (p.hasLogs && p.outPace) out.push({ k: "bad", t: `At the pace you've logged (${usd(p.pace * 7)} a week), you run out on ${fmtDate(p.outPace, true)}, ${daysBetween(p.outPace, p.end)} days before the semester ends.`, s: "Your logged spending, spread over the days you've been logging." });
    if (p.weekly < 0) out.push({ k: "bad", t: `Your bills and goals need ${usd(-p.free)} more than you'll have. Something has to change before everyday spending: a cheaper bill, more income, or a smaller goal.`, s: "Money in minus bills minus goals." });
    else if (p.hasLogs && p.pace * 7 > p.weekly) out.push({ k: "warn", t: `You're spending about ${usd(p.pace * 7 - p.weekly)} a week more than your weekly number. Trimming that much keeps you on track and protects your goals.`, s: "Your pace compared with your weekly number." });
    else if (p.hasLogs) out.push({ k: "", t: `You're spending about ${usd(p.weekly - p.pace * 7)} a week less than your weekly number. That's a cushion. Moving it into a goal makes it harder to spend by accident.`, s: "Your pace compared with your weekly number." });
    const monthTotal = monthCats.reduce((s, c) => s + c.value, 0);
    const h = monthCats.find(c => c.id === "housing");
    if (h && monthTotal && h.value / monthTotal > 0.5) out.push({ k: "warn", t: `Rent and housing take ${Math.round(h.value / monthTotal * 100)}% of a typical month. When one cost is that big, small cuts elsewhere move less. Roommates or a cheaper lease next year matter most.`, s: "Share of a month with bills included." });
    const e = monthCats.find(c => c.id === "eating"), g = monthCats.find(c => c.id === "groceries");
    if (e && e.value > (g ? g.value : 0) && e.value > 80) out.push({ k: "warn", t: `Eating out (${usd(e.value)} a month) is more than groceries${g ? ` (${usd(g.value)})` : ""}. Swapping a few meals out for groceries is usually the easiest cut.`, s: "Eating out compared with groceries, per month." });
    const wants = st.spent.filter(x => x.need === false).reduce((s, x) => s + num(x.amount), 0), all = st.spent.reduce((s, x) => s + num(x.amount), 0);
    if (all > 0 && wants / all > 0.5) out.push({ k: "", t: `About ${Math.round(wants / all * 100)}% of what you logged was a want. Wants aren't bad; they're the part of the budget you get to choose. Decide which ones are worth it to you.`, s: "Needs and wants as sorted (by Jev or by you)." });
    if (!st.goals.length) out.push({ k: "", t: "You haven't set a savings goal. Even a small one, like $100 by the end of the semester, gives you a cushion for a surprise bill.", s: "Pay yourself first (consumer.gov, CFPB)." });
    else if (p.goalLeft > 0 && p.weekly >= 0) out.push({ k: "", t: `Set aside ${usd(p.goalWeekly)} a week for your goals, ideally the day you get paid, before you spend anything else.`, s: "Goals left divided by weeks left." });
    if (!p.hasLogs) out.push({ k: "", t: "Log a week of everyday spending to see your real pace and your pie chart. Receipts, your bank app, or memory all work.", s: "" });
    return out;
  }

  window.Money = { CATS, CAT, FREQ, iso, parse, today, addDays, daysBetween, fmtDate, usd, num, defaultEnd, hits, plan, byCategory, tips };
})();
