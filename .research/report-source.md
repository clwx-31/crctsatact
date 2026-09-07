# SAT skill-bank research and implementation report

**Audience:** Form SAT Practice maintainers

**Research dates:** 2026-09-02 through 2026-09-03, with an item-authenticity audit on 2026-09-03, a cold construct-validity re-audit on 2026-09-04, and a Math item-variety audit on 2026-09-07

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

The `baseline-v2` pass addressed part of this. Reading and Writing passages were brought inside the official standardized range, and Boundaries answer choices were changed to include the words around the blank. The validator reconstructs completed passages and enforces the length range across the baseline and alternate seeds.

### Correction: what the v2 pass did not fix

A cold re-audit on 2026-09-04 found that two of the three v2 claims did not hold in the generated bank, and that a larger problem had gone unmeasured. The record above should be read with these corrections.

- **Distractors were not fixed.** Command of Evidence items still carried options that could be dismissed without reading the claim ("The species has colorful wing feathers"). Because those options were also short, picking the longest choice answered 100% of the skill's fifty items.
- **Lead-in sentences were padding, not context.** They were added unconditionally to clear the 25-word-equivalent floor, and accounted for roughly 23% of all Reading and Writing stimulus text. The claim that the generator avoided "empty filler solely to reach the range" was not accurate.
- **Item counts were inflated.** Years and week counts were taken directly from the loop index, which made each signature unique and so satisfied the uniqueness check while leaving the questions identical. Normalizing those digits reduced 550 Reading and Writing items to 256 distinct ones; Transitions held six.
- **Difficulty labels carried little information.** Nine of eleven Reading and Writing skills drew every tier from one pool. For Transitions and Cross-Text Connections, 100% of distinct items appeared under more than one label. In Inferences, the sentence appended to make an item "hard" pre-eliminated a distractor in fourteen of sixteen cases, making the hard variant easier than the easy one.

The `baseline-v3` pass rebuilds the affected skills from authored, difficulty-tagged case pools and adds construct-validity checks to the validator so these properties are measured rather than asserted. The lesson for future passes is that the earlier report described intentions accurately but was not checked against generated output; the claims in this document should be re-derived from the bank before they are relied on.

### Correction: the v3 checks exempted Math from the finding that motivated them

A follow-up audit on 2026-09-07 re-derived the v3 claims from generated output, as the paragraph above says future passes should. The Reading and Writing claims held: all eleven skills produce fifty distinct items, and no item straddles a difficulty label. The Math claims did not.

- **The distinctness check skipped Math entirely.** Its stated reason — that numeric parameters are genuine content in Math — is true when the numbers change the work, and false when they do not. All eight easy items in Inference from sample statistics asked "Which quantity is a sample statistic?" about a proposal and some city residents, with a sample size and a percentage that did not affect the answer. All nine medium items were one margin-of-error interval. Probability's easy tier was one bag of blue and red tiles, eight times.
- **The v3 pass raised the hard tier only.** The `MATH_HARD_TEMPLATE_FLOOR` added then applied to hard tiers alone. Measured as distinct item shapes per tier per set with digits normalized, ten Math skills sat at three or fewer, and fifteen of the twenty drew their whole easy tier from one recipe. A single recipe is not automatically a defect — solving eight different linear equations is eight pieces of work — but it becomes one when the recipe's only variation is a number the answer does not depend on.
- **Where variety existed, some of it was luck.** Several tiers reached four shapes on the baseline seed only because a random pick happened to draw four different values. Bumping the baseline seed to v4 dropped the statistical-claims easy tier to two, and running the floor across a hundred alternate seeds found six more tiers that failed on at least one seed.

The `baseline-v4` pass rebuilds those tiers with seventy-five added recipes, raising the catalog from 153 to 228, and adds a per-tier shape floor of four that runs on the baseline bank and on every alternate seed. A 400-seed sweep now finds no tier below the floor, where the same sweep found seven before the change. The audit gate added in v3 did its job throughout: every new numeric recipe was reported as unchecked until an independent recalculation was written for it, and the difficulty-straddle check caught a new easy inequality recipe that reproduced the hard tier's exactly.

The lesson from the v2 correction repeats with a refinement. It is not enough to re-derive claims from generated output; a property that depends on a random draw must be measured across many draws, or the measurement records a coincidence.

The framework also explains that College Board keeps the number of child questions from each automated parent model relatively low, reviews every permitted Reading and Writing variable in advance, constrains Math parameters for equivalent challenge, and subjects content to expert, editorial, fairness, and statistical review. The local generators can adopt the first three design principles but cannot reproduce College Board's field testing or psychometric calibration. This remains an important limit on any “true SAT” claim.

### Taxonomy resolution

College Board's assessment framework combines “Nonlinear equations in one variable and systems of equations in two variables” as one Advanced Math testing point. The current public content-domain page presents nonlinear equations and nonlinear systems separately. The product exposes two selectors because that finer split is better for targeted practice while retaining both official concepts.

The framework treats textual and quantitative Command of Evidence as distinct testing points inside one named Reading and Writing skill. The product exposes them separately for the same pedagogical reason. The resulting 20 Math and 11 Reading and Writing selectors are therefore a deliberate drill taxonomy, not a claim that College Board always counts the headings in exactly the same way on every page.

### Coverage model

The recipe catalog covers every testing point named in the framework, including algebraic manipulation and equations; nonlinear functions and systems; ratios, percentages, data, probability, inference, and study design; area, volume, similarity, angle relationships, trigonometry, unit-circle relationships, and circles. Reading and Writing recipes cover central ideas, details, evidence, inference, vocabulary in context, text purpose and structure, cross-text connections, rhetorical synthesis, transitions, sentence boundaries, and form/structure/sense conventions.

Two equal 25-question sets support isolated repetition without reusing content. Each set spans the same 228 generator recipes. The skill banks intentionally do not reproduce the domain proportions in a real adaptive module; test-mode forms use separate blueprint quotas. The detailed recipe-to-skill inventory is maintained in `GENERATION.md`.

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
