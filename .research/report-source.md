# SAT skill-bank research and implementation report

**Audience:** Form SAT Practice maintainers

**Research dates:** 2026-09-02 through 2026-09-03, with an item-authenticity audit on 2026-09-03

**Scope:** Current digital SAT Math and Reading and Writing content boundaries, item structures, and their implementation as reproducible original drills.

## Executive answer

The implemented bank maps the current first-party College Board content taxonomy into 31 drill selectors: 20 Math and 11 Reading and Writing. Each selector contains two non-overlapping sets of 25 original questions, with 8 easy, 9 medium, and 8 hard questions in each set, for 1,550 questions total. The system can regenerate both complete banks from a seed while preserving the set, recipe, seed, variant, input parameters, and retry count on every item.

This is a comprehensive skill-practice library with nonadaptive practice-test simulations and transparent estimated score ranges. The difficulty tiers are instructional judgments based on the number of steps, abstraction, representation, and distractor closeness; they are not psychometrically equated. Official Bluebook tests remain the strongest source for authentic adaptive-module practice and score estimation.

## Research findings translated into the product

### Test structure and item form

- The digital SAT has separate Reading and Writing and Math sections. Reading and Writing uses a short-passage, one-question-per-passage format. The framework describes passages or passage pairs as approximately 25–150 words.
- Math uses multiple-choice and student-produced-response questions. Questions may be set in context or presented without context.
- The official framework and public content pages organize Math into Algebra, Advanced Math, Problem-Solving and Data Analysis, and Geometry and Trigonometry.
- Reading and Writing is organized into Information and Ideas, Craft and Structure, Expression of Ideas, and Standard English Conventions.

Product consequences: Reading and Writing items are all multiple choice and keep completed stimuli within 25–150 standardized word equivalents (characters divided by six). Completion questions are measured with the keyed response inserted. Math includes both response formats. The dashboard exposes both section and exact-skill practice.

### Item-authenticity audit

Released sample questions and the framework's test-development appendix were compared with the generated parent models. The audit found three actionable differences: some generated Reading and Writing stimuli were shorter than the official floor; several distractors could be dismissed as irrelevant without applying the tested skill; and punctuation choices described punctuation abstractly rather than completing the passage as released SAT choices do.

The `baseline-v2` pass corrects those issues at the generator level. Reading and Writing passages now meet both ends of the official standardized range, evidence and comprehension distractors use close-but-wrong comparisons or claims, and Boundaries answer choices include the words around the blank. Academic lead-in sentences are tied to the tested passage topic. The validator reconstructs completed passages and enforces the official length range across the baseline and alternate seeds.

The framework also explains that College Board keeps the number of child questions from each automated parent model relatively low, reviews every permitted Reading and Writing variable in advance, constrains Math parameters for equivalent challenge, and subjects content to expert, editorial, fairness, and statistical review. The local generators can adopt the first three design principles but cannot reproduce College Board's field testing or psychometric calibration. This remains an important limit on any “true SAT” claim.

### Taxonomy resolution

College Board's assessment framework combines “Nonlinear equations in one variable and systems of equations in two variables” as one Advanced Math testing point. The current public content-domain page presents nonlinear equations and nonlinear systems separately. The product exposes two selectors because that finer split is better for targeted practice while retaining both official concepts.

The framework treats textual and quantitative Command of Evidence as distinct testing points inside one named Reading and Writing skill. The product exposes them separately for the same pedagogical reason. The resulting 20 Math and 11 Reading and Writing selectors are therefore a deliberate drill taxonomy, not a claim that College Board always counts the headings in exactly the same way on every page.

### Coverage model

The recipe catalog covers every testing point named in the framework, including algebraic manipulation and equations; nonlinear functions and systems; ratios, percentages, data, probability, inference, and study design; area, volume, similarity, angle relationships, trigonometry, unit-circle relationships, and circles. Reading and Writing recipes cover central ideas, details, evidence, inference, vocabulary in context, text purpose and structure, cross-text connections, rhetorical synthesis, transitions, sentence boundaries, and form/structure/sense conventions.

Two equal 25-question sets support isolated repetition without reusing content. Each set spans the same 166 generator recipes. The skill banks intentionally do not reproduce the domain proportions in a real adaptive module; test-mode forms use separate blueprint quotas. The detailed recipe-to-skill inventory is maintained in `GENERATION.md`.

### Generation and answer integrity

Each question is constructed from a known answer or relationship, rather than by generating arbitrary values and hoping for a clean result. Characteristic misconceptions become distractors. A 32-bit FNV-1a hash and xorshift32 stream make sets deterministic by seed; separate streams by skill, variant, difficulty, and retry prevent one recipe change from indiscriminately reshuffling the whole bank.

Validation checks all 1,550 items, the independent set boundaries, exact taxonomy, recipe parity, difficulty counts, unique IDs and content, response formats, four distinct multiple-choice options, tables, scatterplot data, Reading and Writing passage length, answer-specific coaching, deterministic output, and independently recalculated numeric answers. One hundred alternate two-set seeds probe parameter ranges and cross-set duplicate prevention beyond the baseline bank.

## Assumptions and boundaries

- “Every problem type” is interpreted as every official testing point plus representative recurring item structures documented in the official framework. No finite generator can guarantee every conceivable surface wording.
- All practice items are original transformations of the published content specifications. Official questions were studied for format and scope, not copied.
- The site is independent and not affiliated with or endorsed by College Board.
- Factual note-synthesis examples were checked against institutional sources where practical. They are used as short background facts, not as evidence about SAT scoring.
- This implementation does not emulate the multistage adaptive algorithm, experimental item placement, timing environment, or scaled-score conversion.

## Claim-to-source ledger

| Claim used | Source | Publisher | Source date | URL | Accessed |
|---|---|---|---|---|---|
| Official section, domain, skill, detailed testing-point, passage-length, and response-format definitions | *Assessment Framework for the Digital SAT Suite*, version 3.01 | College Board | 2024-08 | https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf | 2026-09-03 |
| Released stem patterns, passage styles, completion formats, and distractor explanations | *Digital SAT Sample Questions and Explanations* | College Board | 2022 | https://satsuite.collegeboard.org/media/pdf/digital-sat-sample-questions.pdf | 2026-09-03 |
| Current Math taxonomy and public testing-point wording | *SAT Content Domains* | College Board | Current web page | https://satsuite.collegeboard.org/higher-ed-professionals/sat-validity/content-domains | 2026-09-02 |
| Math section scope and response-format overview | *The Math Section: Overview* | College Board | Current web page | https://satsuite.collegeboard.org/sat/whats-on-the-test/math/overview | 2026-09-02 |
| Reading and Writing section format and domain overview | *The Reading and Writing Section: Overview* | College Board | Current web page | https://satsuite.collegeboard.org/sat/whats-on-the-test/reading-writing | 2026-09-02 |
| Official Math practice filtering and skill labels | *Student Question Bank: Math Questions* | College Board | Current web application | https://satsuite.collegeboard.org/practice/student-question-bank/math | 2026-09-02 |
| Official Reading and Writing practice filtering and skill labels | *Student Question Bank: Reading and Writing Questions* | College Board | Current web application | https://satsuite.collegeboard.org/practice/student-question-bank/reading-writing | 2026-09-02 |
| The live digital SAT uses multistage adaptation and item response theory; raw totals alone do not determine scores | *How Are Scores Calculated?* | College Board | Current web page | https://satsuite.collegeboard.org/scores/what-scores-mean/how-scores-calculated | 2026-09-03 |
| The operational test has 54 Reading and Writing questions in 64 minutes and 44 Math questions in 70 minutes | *How the SAT Is Structured* | College Board | Current web page | https://satsuite.collegeboard.org/sat/whats-on-the-test/structure | 2026-09-03 |
| Nonadaptive practice scoring uses a simplified score range and Practice Test 11 supplies the implemented anchor curve | *Scoring Your SAT Practice Test 11* | College Board | 2026 | https://satsuite.collegeboard.org/media/pdf/scoring-sat-practice-test-11-digital.pdf | 2026-09-03 |
| Ynes Mexia began major botanical collecting work in the 1920s and assembled a very large specimen collection | *Ynes Mexia* | U.S. National Park Service | Current biography | https://www.nps.gov/people/ynes-mexia.htm | 2026-09-02 |
| Alice Ball developed a water-soluble injectable chaulmoogra-oil treatment | *Cultivating a UH legacy: Alice Ball* | University of Hawaiʻi | 2020-03-02 | https://www.hawaii.edu/news/2020/03/02/cultivating-a-uh-legacy/ | 2026-09-02 |
| Florence Price's Symphony No. 1 and its 1933 Chicago premiere are historically significant | *Florence Price Music Manuscripts* | Library of Congress | Current finding aid | https://findingaids.loc.gov/repositories/15/resources/1623 | 2026-09-02 |
| Fazlur Rahman Khan pioneered tubular structural systems for efficient tall buildings | *Raising the Skyline* | University of Illinois | Current archival feature | https://archive.storied.illinois.edu/raising-the-skyline/ | 2026-09-02 |

## Maintainer conclusion

The bank is suitable for high-volume, skill-isolated practice and repeatable daily sets once the repository validator passes. It should be presented honestly as specification-aligned original practice. Future recipe additions should retain backward construction, meaningful distractor rationales, full metadata, and an independent validation calculation wherever the answer is numerical.
