# Form — SAT Practice

A no-build digital SAT practice site organized around exact College Board skill categories.

- 500 generated Math questions across 20 targeted selectors
- 275 generated Reading and Writing questions across 11 targeted selectors
- 25 questions per selector: 8 easy, 9 medium, and 8 hard
- multiple-choice and student-produced Math responses
- passages, paired texts, tables, and scatterplots
- explanations, bookmarks, a question navigator, and locally saved progress
- reproducible daily and numbered variant sets

All questions are original. This project is independent and is not affiliated with or endorsed by College Board. SAT is a registered trademark of College Board.

## Live site

[Open Form SAT Practice](https://clwx-31.github.io/crctsatact/)

## Run the site

From this directory, start a local server:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. The site can also be opened directly through `index.html`, although a local server is more consistent across browsers.

## Generate fresh sets

The dashboard has two controls for each section:

- **Today's set** uses a date-based seed, so the same date always reproduces the same bank.
- **New variant** increments a locally stored variant number and creates a new reproducible bank.

The generation model, recipe catalog, seed behavior, and extension instructions are documented in [GENERATION.md](GENERATION.md).

## Validate the bank

With Node.js installed:

```sh
node validate.js
node --check app.js
node --check math-generator.js
node --check rw-generator.js
node --check questions.js
```

The validator checks totals, exact skill and difficulty coverage, unique IDs and prompts, answer formats and SAT-grid-length responses, unique choices, table and figure structure, deterministic regeneration, alternate seeds, and independently recalculates numerical answers for high-risk Math recipes.

## Calibration sources

Content boundaries and question stems were mapped to current first-party College Board materials:

- [Assessment Framework for the Digital SAT Suite](https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf)
- [Student Question Bank: Math Questions](https://satsuite.collegeboard.org/practice/student-question-bank/math)
- [Student Question Bank: Reading and Writing Questions](https://satsuite.collegeboard.org/practice/student-question-bank/reading-writing)
- [SAT content domains](https://satsuite.collegeboard.org/higher-ed-professionals/sat-validity/content-domains)
- [Math section overview](https://satsuite.collegeboard.org/sat/whats-on-the-test/math/overview)
- [Reading and Writing section overview](https://satsuite.collegeboard.org/sat/whats-on-the-test/reading-writing)

Difficulty labels are deliberate instructional tiers, not College Board psychometric ratings. Generated practice complements—but does not replace—official Bluebook tests and the official Student Question Bank.
