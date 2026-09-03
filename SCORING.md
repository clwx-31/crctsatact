# Estimated SAT scoring model

Form reports an estimated score and an uncertainty range for every mini-test, module test, and full-length simulation. These values are practice projections, not official College Board scores.

## What the official scoring system does

The digital SAT reports Reading and Writing and Math section scores from 200 to 800 and a total score from 400 to 1600. Each section contains two timed modules. The operational digital test has 54 Reading and Writing questions in 64 minutes and 44 Math questions in 70 minutes.

College Board explains that the live test uses multistage adaptation and item response theory. A score depends on the characteristics and difficulty of the questions answered, not only the raw number correct. Consequently, two students with the same number correct can receive different section scores.

College Board's downloadable nonadaptive practice tests use more questions—66 Reading and Writing and 54 Math—to compensate for the absence of adaptation. Their scoring guides return a score range and explicitly describe the method as simplified and less precise than live-test scoring.

Sources, accessed 2026-09-03:

- [How Are Scores Calculated?](https://satsuite.collegeboard.org/scores/what-scores-mean/how-scores-calculated), College Board
- [How the SAT Is Structured](https://satsuite.collegeboard.org/sat/whats-on-the-test/structure), College Board
- [Scoring Your SAT Practice Test 11](https://satsuite.collegeboard.org/media/pdf/scoring-sat-practice-test-11-digital.pdf), College Board, 2026
- [Full-Length SAT and PSAT Paper Practice Tests](https://satsuite.collegeboard.org/practice/practice-tests/paper), College Board

## What Form calculates

### Test assembly

- Skill mini-test: 10 questions, split 3 easy, 4 medium, and 3 hard.
- Reading and Writing module test: 27 questions and an optional 32-minute timer.
- Math module test: 22 questions and an optional 35-minute timer.
- Full simulation: four modules containing 54 Reading and Writing and 44 Math questions, with official per-module times.
- Section and full-test domain quotas approximate the published SAT domain proportions. Questions are spread across skills and difficulty tiers without duplicates.

The full simulation is fixed and nonadaptive. Calling it adaptive would imply calibrated routing and item parameters that this original bank does not have.

### Score center

1. Correct answers receive difficulty weights of 0.9 for easy, 1.0 for medium, and 1.1 for hard. This modest adjustment prevents a hard question from dominating the estimate.
2. A skill mini-test uses a 12-question prior and a module test uses a 4-question prior, both centered at 65% performance. This guards against extreme 200 or 800 predictions from a very small sample. A full simulation uses no prior.
3. The adjusted proportion is normalized to the raw-score axis of College Board Practice Test 11: 0–66 for Reading and Writing and 0–54 for Math.
4. The corresponding official lower and upper values are looked up, and their midpoint is rounded to the nearest ten for the displayed estimate.

### Uncertainty range

Form calculates a 90% Wilson interval for the observed correct-answer proportion, including the same small-test prior where applicable. The lower and upper proportions are mapped through the Practice Test 11 conversion table. The displayed range is expanded when necessary to include College Board's published range at the center estimate.

For a full test, Reading and Writing and Math ranges are added to produce the total range, following College Board's paper-practice scoring instructions. A skill test therefore yields a deliberately broad section projection; a full test yields a stronger, though still unofficial, estimate.

## Interpretation

- Use the center estimate as a directional snapshot, not a promised score.
- Use the range to judge uncertainty. Ten questions from one skill cannot measure an entire SAT section precisely.
- Compare repeated tests of similar scope to monitor movement.
- Use an official Bluebook practice test for the strongest available score estimate and an authentic adaptive experience.

## Regression expectations

The automated validator verifies deterministic test assembly, exact test and module sizes, no duplicate questions, the 3/4/3 mini-test difficulty split, coaching coverage for every bank item, valid score ranges, and full-test endpoints of 400 for no correct answers and 1600 for all correct answers.
