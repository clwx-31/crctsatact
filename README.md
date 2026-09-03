# Form — SAT Practice

A no-build digital SAT practice site organized around exact College Board skill categories.

- 1,000 generated Math questions across 20 targeted selectors
- 550 generated Reading and Writing questions across 11 targeted selectors
- two non-overlapping 25-question sets per selector; each has 8 easy, 9 medium, and 8 hard
- multiple-choice and student-produced Math responses
- passages, paired texts, tables, and scatterplots
- explanations, bookmarks, a question navigator, and locally saved progress
- reproducible daily and numbered variant sets
- answer-specific misconception coaching after missed practice questions
- a top-level mini-test library with a combined 20-question Math + Reading test
- 10-question skill tests, 22/27-question module tests, and 98-question full simulations
- optional timers, deferred test feedback, score estimates and uncertainty ranges, domain results, and test history

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

Every skill has permanent **Set 1** and **Set 2** buttons. Progress is tracked independently because the two banks use distinct question IDs. The dashboard also has two controls for regenerating both sets in a section:

- **Today's set** uses a date-based seed, so the same date always reproduces the same bank.
- **New variant** increments a locally stored variant number and creates a new reproducible bank.

The generation model, recipe catalog, seed behavior, and extension instructions are documented in [GENERATION.md](GENERATION.md).

## Tests and estimated scores

The **Mini tests** tab in the site header collects every skill test and provides a combined 20-question test with 10 Reading and Writing and 10 Math questions. Every skill row also links directly to its 10-question mini-test. The Test Center provides one-module section tests and a four-module full-length simulation. Timed mode follows the current official module times; untimed mode uses the same question blueprint without a clock.

Test answers and explanations remain hidden until submission. Results include an estimated SAT section or total score, an uncertainty range, domain performance, and answer-specific review for every missed question.

The estimate is anchored to College Board's 2026 Practice Test 11 conversion ranges and widened for shorter tests. It is not an official score because the generated questions have not been psychometrically calibrated and the simulation is nonadaptive. The complete methodology is documented in [SCORING.md](SCORING.md).

## Validate the bank

With Node.js installed:

```sh
node validate.js
node --check app.js
node --check math-generator.js
node --check rw-generator.js
node --check test-engine.js
node --check questions.js
```

The validator checks all 1,550 questions, both set boundaries, exact skill and difficulty coverage, cross-set content uniqueness, recipe parity, unique IDs and prompts, answer formats and SAT-grid-length responses, unique choices, table and figure structure, deterministic regeneration, 100 alternate two-set banks, independent Math calculations, coaching coverage, mini-test and module blueprints, full-test assembly, and score behavior.

## Calibration sources

Content boundaries and question stems were mapped to current first-party College Board materials:

- [Assessment Framework for the Digital SAT Suite](https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf)
- [Student Question Bank: Math Questions](https://satsuite.collegeboard.org/practice/student-question-bank/math)
- [Student Question Bank: Reading and Writing Questions](https://satsuite.collegeboard.org/practice/student-question-bank/reading-writing)
- [SAT content domains](https://satsuite.collegeboard.org/higher-ed-professionals/sat-validity/content-domains)
- [Math section overview](https://satsuite.collegeboard.org/sat/whats-on-the-test/math/overview)
- [Reading and Writing section overview](https://satsuite.collegeboard.org/sat/whats-on-the-test/reading-writing)

Difficulty labels are deliberate instructional tiers, not College Board psychometric ratings. Generated practice complements—but does not replace—official Bluebook tests and the official Student Question Bank.
