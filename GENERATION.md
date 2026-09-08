# Question generation and coverage

This document is the durable recipe record for producing new Form SAT practice sets. The bank is generated in the browser with no network calls and no build step.

## Taxonomy decisions

The public College Board materials use two levels of granularity in a few places. The official assessment framework groups “Nonlinear equations in one variable and systems of equations in two variables” under one Advanced Math testing point, while the current public content-domain page lists those ideas separately. Form exposes them as two selectors because isolating them produces more useful drills. Likewise, College Board groups Command of Evidence at the top level but explicitly defines textual and quantitative evidence as separate testing points; Form exposes both.

This yields:

- 20 Math selectors: 5 Algebra, 4 Advanced Math, 7 Problem-Solving and Data Analysis, and 4 Geometry and Trigonometry
- 11 Reading and Writing selectors: 4 Information and Ideas, 3 Craft and Structure, 2 Expression of Ideas, and 2 Standard English Conventions
- two 25-question sets per selector
- Set 1 uses variants 1–25 and Set 2 uses variants 26–50; each independently contains 8 easy, 9 medium, and 8 hard questions

Equal-sized skill banks are for targeted drilling. They intentionally do not imitate the domain proportions of a 44-question adaptive Math section or a 54-question Reading and Writing section.

Each set spans 228 distinct generator recipes across the 31 official skill categories. The validator requires both sets to contain the same recipe catalog, prohibits duplicate question content between them, and enforces a floor on the number of recipes so a recipe cannot quietly disappear.

## Reproducible seeds

`math-generator.js` and `rw-generator.js` use the same deterministic pipeline:

1. Normalize the requested seed to a nonempty string.
2. Hash it with 32-bit FNV-1a.
3. Create a separate xorshift32 random stream for each section, skill, variant, difficulty, and duplicate retry.
4. Select a recipe and generate valid parameters from the answer backward.
5. Build distractors from characteristic errors.
6. Shuffle choices reproducibly.
7. Reject duplicate prompt/stimulus/figure combinations within a skill and retry deterministically.

Reading and Writing passages are checked using College Board's standardized measure: the completed stimulus character count divided by six. Every generated passage must fall from 25 through 150 word equivalents. Completion questions are measured after inserting the keyed response.

This floor is the reason the earlier generator prefixed each item with a generic lead-in sentence. That was contentless padding, and about a quarter of all Reading and Writing stimulus text consisted of it. Each case now carries its own context sentence, written to belong to the item, and reaches the floor with content.

Every question records `practiceSet`, `meta.practiceSet`, `meta.recipe`, `meta.generationVersion`, `meta.seed`, `meta.variant`, `meta.parameters`, and `meta.generationAttempt`. IDs include the skill slug, versioned seed hash, and variant number, so Set 1 progress cannot overwrite Set 2 progress and a revised generator cannot reuse an earlier question's saved answer. Generation checks content signatures across both sets and stops with an error rather than accepting a duplicate after its retry limit.

The default seed is `baseline-v5`. This version marks the difficulty-recalibration pass of September 2026, which rebuilt the Math easy and medium tiers and corrected the hard-tier misassignments, so saved answers from the earlier bank cannot be attached to revised questions. The dashboard's **Today's set** button uses `daily-YYYY-MM-DD`; **New variant** uses `variant-N`. A developer can reproduce a bank directly:

```js
const math = window.buildSATMathQuestions("daily-2026-09-03");
const readingWriting = window.buildSATRWQuestions("daily-2026-09-03");
```

Those calls return Set 1. Every ID and metadata record also includes the `construct-validity-v5` generator version, preventing saved daily or numbered-variant answers from being attached to content produced by a later generator. To produce both permanent sets exactly as the website does:

```js
const mathSets = window.buildSATMathQuestionSets("daily-2026-09-03");
const readingWritingSets = window.buildSATRWQuestionSets("daily-2026-09-03");
```

## Math recipe coverage

### Algebra

- **Linear equations in one variable:** one- and two-step equations, distribution, variables on both sides, one-step and multi-step contextual modeling, solving and then evaluating a further expression, zero/one/infinitely-many-solution reasoning, and solving for the coefficient that leaves an equation with no solution.
- **Linear functions:** evaluation, solving for the input that produces a given output, slope/intercept recognition and interpretation, slopes from points, rules from input/output pairs, intersections of linear rules, and interpreting a rate parameter in a contextual model.
- **Linear equations in two variables:** coordinate substitution, standard-form slope, coefficient interpretation, parallel/perpendicular lines, and the equation of a line through two given points.
- **Systems of two linear equations:** direct solution, elimination, substitution when one variable or one equation is already isolated, verifying an ordered pair against both equations, contextual systems, dependent/inconsistent systems, symmetric systems solved for x + y, and the coefficient that makes a system inconsistent.
- **Linear inequalities:** positive- and negative-coefficient solution rules, the least integer satisfying a strict inequality, testing a candidate value, translating a budget constraint into an inequality, point testing in two variables, contextual maximum constraints, systems of two inequalities, and solving for a constant from a stated boundary.

### Advanced Math

- **Equivalent expressions:** monic trinomial factoring, common factors, differences of squares, polynomial combination and multiplication, distributing before combining like terms, exponent products and quotients, rational expressions, rational-exponent/radical forms, and completing the square.
- **Nonlinear equations in one variable:** quadratic roots and root relationships, roots read from factored form, discriminants, absolute value, radical, cube-root, rational, exponential, and factored polynomial equations.
- **Systems of equations in two variables:** verifying intersections, counting the intersections of a parabola and a horizontal line, the x-coordinates where they meet, identifying a system with no real solution, linear–quadratic root sums/products, tangent systems, circle–line intersection counts, and the horizontal line meeting a parabola exactly once.
- **Nonlinear functions:** quadratic evaluation, vertices, zeros, useful forms, exponential parameters and values, and function transformations.

### Problem-Solving and Data Analysis

- **Ratios, rates, proportional relationships, and units:** unit rates, proportional scaling of a recipe, converting with a stated conversion factor, splitting a total by a part-to-part ratio, scale drawings, time/rate conversion, compound-unit conversion, density, and combined rates of two sources working together.
- **Percentages:** percent of a quantity, what percent one number is of another, recovering the whole from a part, percent increase, discounts, reverse percentages, successive changes, subgroup percentages, growth factors, and recovering a total from a nested percentage.
- **One-variable data:** mean, median with odd and even counts, mode, range, mean and median weighted by a frequency table, updated mean, the combined mean of two unequal groups, range/spread comparisons, standard deviation, outlier effects, and recovering a missing value from a stated mean.
- **Two-variable data:** model prediction in both directions, reading a value off a scatterplot, slope and intercept interpretation, choosing a line of best fit for plotted data, residuals, the limits of extrapolating beyond the observed range, model selection, recovering an exponential model from a table, association, tables, scatterplots, and the gap between a predicted and an observed value.
- **Probability and conditional probability:** simple probability, complements, probability from a frequency table, the union of two disjoint categories, two draws without replacement, conditional and joint probability from two-way tables, independent intersections, unions, and expected counts.
- **Inference from sample statistics and margin of error:** sample statistics, what a margin of error does and does not describe, why a sample is drawn at random, plausible ranges and the values inside them, recovering an estimate and margin from a reported range, comparing two overlapping ranges, population estimates, interpreting a confidence interval, sample-size effects in both directions, and generalization.
- **Evaluating statistical claims:** random samples, random assignment, the role of random selection, distinguishing observational studies from experiments, the purpose of a control group, the limits of a convenience sample, observational confounding, self-selection, comparison groups, causation, generalizability, and what a randomly sampled observational study can and cannot establish.

### Geometry and Trigonometry

- **Area and volume:** rectangle and triangle measures, circle area, cylinder volume, prism surface area, similar-figure length/area/volume scaling, and recovering a cylinder's radius from its volume.
- **Lines, angles, and triangles:** triangle sums, vertical/corresponding/supplementary/exterior angles, parallel-line relationships, similarity, and SAS sufficiency.
- **Right triangles and trigonometry:** the Pythagorean theorem for a hypotenuse or a missing leg, right-triangle area, coordinate distance, both special right triangles, identifying and computing sine/cosine/tangent, recovering a side from a given ratio, complementary angles and cofunctions within a triangle, and unit-circle radians.
- **Circles:** radius/diameter, circumference/area, area from a given circumference, equations and the radius recovered from one, arc length, sector area, inscribed angles, and tangent lines.

## Reading and Writing recipe coverage

- **Central Ideas and Details:** central claims and explicit detail retrieval across twenty-five passages spanning science, history, social science, the arts, and literary narrative.
- **Command of Evidence—Textual:** findings that support a research claim, and quotations that illustrate a claim about a literary work.
- **Command of Evidence—Quantitative:** accurate comparisons and differences from tables, and rate claims where the largest raw count is not the largest proportion.
- **Inferences:** supported conclusions and logical completions, without reversals, unsupported causation, or overstatement.
- **Words in Context:** logical/precise completion and meaning-in-context stems using high-utility academic vocabulary.
- **Text Structure and Purpose:** whole-text purpose and sentence-function questions across twenty-five passages of varied rhetorical shape.
- **Cross-Text Connections:** agreement and response questions over five relations between the texts — a disputed conclusion, an alternative explanation, a challenged method, limited scope, and extension.
- **Rhetorical Synthesis:** selecting notes for significance, date/introduction, and field/achievement goals.
- **Transitions:** contrast, result, example, addition, concession, and sequence.
- **Boundaries:** between-sentence punctuation, introductory elements, lists, supplementary information, conjunctive adverbs, and cases requiring no punctuation.
- **Form, Structure, and Sense:** subject–verb and pronoun–antecedent agreement, verb finiteness, tense/aspect, modifier placement, parallel structure, logical comparison, genitives, and plurals.

## Authenticity controls

- Reading and Writing stems follow the recurring wording in College Board's framework and released samples.
- Every skill carries a pool of authored cases, each tagged with the difficulty it was written for. Set 1 and Set 2 are dealt alternately from a recipe-ordered pool, so both sets drill the same recipes without sharing a question. No question is differentiated from another by a year, a week count, or any other decorative digit.
- Distractors are on-topic and comparable in length to the key. Overstatement is expressed through what a choice claims rather than through words like "every" or "must", so eliminating absolutes does not locate the answer.
- Boundaries choices show the words surrounding the tested punctuation, matching the completion format of released questions instead of presenting abstract labels such as "no punctuation."
- Academic contexts span scientific research, history and social studies, and the humanities; rhetorical-synthesis notes retain the concise bullet-note format, and every option draws on the notes so that only the stated goal separates them.
- Math keeps the official approximate response-format mix: the baseline bank is 72.4% multiple choice and 27.6% student-produced response.
- Default-bank revisions receive a new baseline seed so previously stored answers cannot be scored against changed content.

## Difficulty model

Difficulty is a property of the item, not of the slot it lands in.

- In Reading and Writing, each authored case states the tier it was written for. Easy cases oppose plainly different alternatives; Medium cases require tracking the direction of a relationship; Hard cases place a near-miss among the distractors.
- In Math, difficulty follows the recipe. A recipe belongs to exactly one tier, and every hard tier draws on at least three recipes so eight hard questions are not eight instances of one mold.
- In every section, each tier of each skill must produce at least four distinct item shapes per set, counted with digits normalized. A rewritten sample size, growth factor, or coefficient does not count as a second shape. The check runs on the baseline bank and on all 100 alternate seeds, so a tier cannot satisfy it on a lucky draw.
- The validator fails the bank if one question appears under more than one difficulty label.

These remain instructional tiers. They have not been equated on a student population, and nothing here estimates an item's difficulty from response data.

## Adding or changing a recipe

1. Add the recipe inside the generator for its exact skill; do not create an unofficial skill label just for a subtype.
2. Generate parameters from a known solution or relationship. Avoid solving a randomly generated problem after the fact when backward construction can guarantee clean values.
3. Give each distractor a reason: sign error, wrong denominator, reciprocal, incorrect growth factor, wrong comparison group, overstatement, punctuation misconception, or another identifiable error.
4. Record every parameter required to independently recompute the answer in `meta.parameters`.
5. Keep Math student-response answers within the accepted integer, decimal, or fraction conventions, and always provide an accepted response that fits the SAT's five-character answer grid. Do not require symbols in a student response.
6. Add an independent recalculation case to `validate.js` for any new numerical recipe. The validator now fails if a recipe with a numeric answer has none, so this is enforced rather than remembered.
7. Tag every new Reading and Writing case with the difficulty it was written for, and keep each recipe family present at least twice per tier so both practice sets receive it.
8. Give each tier of a skill at least four recipes, or one recipe with genuinely different question forms. A single recipe whose only variation is its numbers will fail the per-tier shape floor on some seed even when it passes on the baseline.
9. Run all validation commands in `README.md` and inspect representative easy, medium, and hard output.

## Quality boundaries

- All items are original and derived from skill definitions and question structures, not copied official questions.
- Difficulty is an instructional construction based on steps, abstraction, representation, and distractor closeness. It has not been statistically equated on a student population.
- A generated bank is a drill library, not an adaptive scored SAT form. Use official Bluebook practice tests for score prediction, timing, and adaptive-module experience.
- Generator changes that alter an existing seed's output should use a new baseline version such as `baseline-v5` so old progress remains interpretable.
