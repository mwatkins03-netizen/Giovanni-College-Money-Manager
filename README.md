# College Money Manager

A Grove Lab student build. **Idea and direction by Giovanni Crispo (Finance, Sophomore, WRIT 3810):** a website where college students enter their income, expenses, and savings goals, see where their money goes, and make it last the school year. Prototype by Marc Watkins, coded with Anthropic's Claude.

Giovanni's version one was "a pie chart of what their spending was on." This prototype has that, built around the question his proposal kept coming back to: **will my money last until the end of the semester?**

## What's in it

Two tabs, plus a guide. Giovanni asked to avoid "multiple unnecessary sections," so everything for the plan is on one screen.

| Part | What it does |
|---|---|
| **My budget** | Four boxes (where you are now, money coming in, money going out, savings goals) and the results beside them: a yes-or-no answer with the run-out date, the **weekly number** (safe to spend per week), **your pace** (from logged spending), a pie chart of spending (logged, or a month with bills in), needs vs. wants, a **runway** chart of the balance to the end of the semester, and rule-written notes that each say why. "Show the math" and "Show as a table" expose every number. |
| **Learn** | Six short lessons (in and out, fixed and flexible, needs and wants, pay yourself first, reading a runway, 50/30/20). Each has a picture that builds step by step with captions always on screen and a full transcript, then a "check yourself" question (a number, a sort, or a choice). This follows his "Learn and explain" pathway, "practice and check yourself," and "watch" answers, and his "captions or transcripts" accessibility answer. |
| **How to use** | `how-to-use/index.html`, linked from the app header. A student guide: filling in the boxes, reading every result, how Jev sorts, the lessons, a 20-minute first session, a 5-minute weekly habit, and a FAQ. Printable. |

## The AI part: Jev sorts, rules write

His proposal says the app should use AI "to sort or score something." Jev (TypeSafe AI) sorts each spending entry and each bill: a category (9 choices) and need or want. Jev returns probabilities only; the chip on each entry shows how sure it was, and clicking it shows every percentage and the exact question. The student can change any category, and their choice wins.

- **Only the words of an entry go to Jev**, never the amount, date, or balance. Answers are cached by wording in localStorage.
- If Jev can't be reached, a keyword list guesses, and the chip says "guess."
- The questions are at the top of `js/jev.js` and shown in the app under "What Jev is asked."
- It uses the existing Jev Sandbox Worker (`https://jev-sandbox-proxy.watkins-um.workers.dev`), same as Clarify: no key, 60 requests a minute. The sample student costs 18 requests the first time.

Everything else the app says (the verdict, the notes under "What stands out," lesson feedback) is written by rules in `js/money.js` and `js/learn.js`.

## How the math works

All of it is in `js/money.js`, with no screen code mixed in.

- **Weekly number** = (balance + income due before the end date − bills due before the end date − goal amounts still to save) ÷ weeks left.
- **Your pace** = logged spending ÷ days since the first log (at least 7) × 7.
- Weekly and every-2-weeks money lands 7 or 14 days from today and repeats; monthly money and bills land on the 1st; one-time income lands today.
- **Runway** simulates each day: income and bills on their days, plus everyday spending at your pace (solid) or at the weekly number (dashed).
- Default end date is Dec 11 (fall) or May 8 (spring); students can change it.

## Files

- `index.html`: the app shell. No build step.
- `css/app.css`: all styles. **The first block is the look**, as color and font variables.
- `js/money.js`: categories, dates, the plan, tips.
- `js/jev.js`: Jev questions, transport, keyword fallback.
- `js/charts.js`: the donut and runway charts (SVG, hover tooltips, table versions).
- `js/app.js`: the My budget screen, the sample student, saving.
- `js/learn.js`: the six lessons.
- `how-to-use/index.html`: the student guide.

Saved in the browser's localStorage under `cmm.v1.state`, `cmm.v1.learn`, and `cmm.v1.jevcache`.

## Sources credited in the app

consumer.gov's *Making a Budget* (FTC; the site Giovanni named as a look he liked), the CFPB's *Your Money, Your Goals*, Federal Student Aid's budget checklist, and the 50/30/20 guideline from Elizabeth Warren and Amelia Warren Tyagi, *All Your Worth* (2005). Lesson text is written fresh, not copied. All examples and the sample student are made up.

## Verified in the browser (October 27, 2026)

Sample student loaded; Jev live-sorted all 18 entries (e.g. "new running shoes" → Personal & health 99%, need 31%); quick-add parsing; category override; the Jev popover; both pie views; runway hover; "Show the math" matched by hand ($1,850 + $1,460 − $1,622 − $340 = $1,348 ÷ 6.4 weeks = $210); a Learn check; light and dark mode; a 375px phone with no sideways scroll. Print is styled but was not tried in this pass.

## Running it

Static files. Serve the folder (`python3 -m http.server`) or open `index.html` directly. Giovanni asked to keep the build between him and his instructor, so it is not in the gallery. A private repository keeps the code private, but a GitHub Pages site is public to anyone with the link.

### Deploy to GitHub Pages

1. Create an empty repository on github.com (no README, license, or .gitignore).
2. Upload everything in this folder to the repository root, including the hidden `.nojekyll` file (on a Mac, press Cmd+Shift+. in Finder to see it). Keep the folders as they are: `css/`, `js/`, `how-to-use/`.
3. Settings → Pages → Deploy from a branch → `main` / `/ (root)` → Save.
4. The site appears at `https://<user>.github.io/<repo>/` within a minute or two. The guide is at `…/how-to-use/`.

Nothing needs a key. Jev runs through the existing Jev Sandbox Worker, which accepts any origin; if that Worker is ever locked to specific sites, add the new Pages origin to it.

## For Giovanni

You said you want to **design the look** and **test it with real people** yourself. Two places to start:

1. **The look.** Open `css/app.css`. The first block holds every color and the two fonts, with comments. Your three words were "sharp, business, friendly." Try changing `--brand` (the money green), `--radius` (3px is sharp; 12px is softer), or the fonts. If you change chart colors, keep their order: it's tested so colorblind readers can tell neighboring slices apart.
2. **Testing.** Your measure of success was whether people "make their money stretch." Ask two or three friends to enter their real numbers (on their own phones, so it stays private) and log spending for one week. Before and after, ask: "What's your weekly number? Will you make it to December?" Watch which box they get stuck on and whether they trust Jev's categories.

Keep your AI-use notes as you go, as your proposal says. Ideas you saved for later (ways to earn more, advice for your situation) would fit as a seventh lesson or a new kind of note under "What stands out."
