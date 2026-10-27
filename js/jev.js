/* College Money Manager: Jev sorts spending. Jev (TypeSafe AI) never writes text. It returns probabilities for
   questions written here, and every probability is shown. Only the words of an entry go to Jev, never the amount or date.
   If Jev can't be reached, a keyword list makes a guess and says so. The student can change any category. */
(function () {
  const { CATS } = Money;
  const ENDPOINT = "https://jev-sandbox-proxy.watkins-um.workers.dev";

  /* ---------- the questions Jev is asked ---------- */
  const QUESTIONS = {
    cat: { type: "choice", instructions: "A college student wrote this note about something they spent money on. Which budget category does it belong in?",
      criteria: Object.fromEntries(CATS.map(c => [c.id, c.desc])) },
    need: { type: "noul", instructions: "Is this a need for a college student, meaning something they must pay for to live safely, stay healthy, get to class, or stay enrolled, rather than a want they could skip or replace with something cheaper?" }
  };

  /* ---------- keyword guess, used only when Jev is out of reach ---------- */
  const WORDS = {
    housing: "rent lease dorm apartment utilities utility electric water internet wifi renters landlord deposit housing",
    groceries: "grocery groceries kroger walmart publix aldi costco target food lion market milk eggs produce",
    eating: "chipotle mcdonald chick-fil-a chickfila starbucks coffee pizza taco burger restaurant lunch dinner breakfast doordash ubereats uber eats grubhub cava sonic subway wings sushi boba smoothie snack takeout",
    transport: "gas fuel shell exxon chevron parking uber lyft bus car insurance oil change tire flight airline toll",
    fun: "bar bars drinks beer party concert ticket tickets game games movie movies tailgate club cover formal date bowling show festival steam playstation xbox",
    school: "textbook textbooks book books tuition fee fees lab supplies printing calculator notebook course software clicker",
    subs: "phone verizon at&t att t-mobile tmobile netflix spotify hulu disney apple music icloud subscription prime youtube max",
    personal: "haircut clothes shirt shoes gym toiletries shampoo pharmacy medicine doctor cvs walgreens laundry dentist copay",
    other: "gift fee venmo atm"
  };
  const NEEDS = ["housing", "groceries", "school", "transport"];
  function guess(text) {
    const t = " " + text.toLowerCase() + " ";
    let best = "other", n = 0;
    for (const [id, list] of Object.entries(WORDS)) {
      const hit = list.split(" ").filter(w => t.includes(w)).length;
      if (hit > n) { n = hit; best = id; }
    }
    return { cat: best, need: NEEDS.includes(best), by: "keyword" };
  }

  /* ---------- transport: a few at a time, under the proxy's 60 requests a minute ---------- */
  const starts = [];
  async function ask(text) {
    while (true) {
      const now = Date.now(); while (starts.length && now - starts[0] > 60000) starts.shift();
      if (starts.length < 50) break;
      await new Promise(r => setTimeout(r, 60000 - (now - starts[0]) + 50));
    }
    starts.push(Date.now());
    const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: text.slice(0, 500), model: "jev-latest", questions: QUESTIONS }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "HTTP " + r.status);
    return d.answers;
  }
  const top = p => Object.keys(p).reduce((b, k) => p[k] > p[b] ? k : b, Object.keys(p)[0]);

  /* Sort one entry. Returns { cat, need, by, probs, needP }. Answers are remembered by wording, so "chipotle" is asked once. */
  const cache = (() => { try { return JSON.parse(localStorage.getItem("cmm.v1.jevcache") || "{}"); } catch { return {}; } })();
  const saveCache = () => { try { localStorage.setItem("cmm.v1.jevcache", JSON.stringify(cache)); } catch {} };
  let online = null;
  async function sort(text) {
    const key = text.trim().toLowerCase();
    if (cache[key]) return cache[key];
    try {
      const a = await ask(text);
      const probs = a.cat.probabilities, cat = a.cat.choice || top(probs);
      const res = { cat, need: a.need.noul >= 0.5, by: "jev", probs, needP: a.need.noul };
      cache[key] = res; saveCache(); online = true; return res;
    } catch (e) {
      online = false;
      return guess(text);
    }
  }

  window.Jev = { QUESTIONS, sort, guess, ENDPOINT, top, get online() { return online; } };
})();
