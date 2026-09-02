# Question generation and coverage

This document is the durable recipe record for producing new Form SAT practice sets. The bank is generated in the browser with no network calls and no build step.

## Taxonomy decisions

The public College Board materials use two levels of granularity in a few places. The official assessment framework groups “Nonlinear equations in one variable and systems of equations in two variables” under one Advanced Math testing point, while the current public content-domain page lists those ideas separately. Form exposes them as two selectors because isolating them produces more useful drills. Likewise, College Board groups Command of Evidence at the top level but explicitly defines textual and quantitative evidence as separate testing points; Form exposes both.

This yields:

- 20 Math selectors: 5 Algebra, 4 Advanced Math, 7 Problem-Solving and Data Analysis, and 4 Geometry and Trigonometry
- 11 Reading and Writing selectors: 4 Information and Ideas, 3 Craft and Structure, 2 Expression of Ideas, and 2 Standard English Conventions
- 25 questions per selector: variants 1–8 easy, 9–17 medium, and 18–25 hard

Equal-sized skill banks are for targeted drilling. They intentionally do not imitate the domain proportions of a 44-question adaptive Math section or a 54-question Reading and Writing section.

## Reproducible seeds

`math-generator.js` and `rw-generator.js` use the same deterministic pipeline:

1. Normalize the requested seed to a nonempty string.
2. Hash it with 32-bit FNV-1a.
3. Create a separate xorshift32 random stream for each section, skill, variant, difficulty, and duplicate retry.
4. Select a recipe and generate valid parameters from the answer backward.
5. Build distractors from characteristic errors.
6. Shuffle choices reproducibly.
7. Reject duplicate prompt/stimulus/figure combinations within a skill and retry deterministically.

Every question records `meta.recipe`, `meta.seed`, `meta.variant`, `meta.parameters`, and `meta.generationAttempt`. IDs include the skill slug, seed hash, and variant number, so progress from one set cannot overwrite progress from another.

The default seed is `baseline-v1`. The dashboard's **Today's set** button uses `daily-YYYY-MM-DD`; **New variant** uses `variant-N`. A developer can reproduce a bank directly:

```js
const math = window.buildSATMathQuestions("daily-2026-09-03");
const readingWriting = window.buildSATRWQuestions("daily-2026-09-03");
```

## Math recipe coverage

### Algebra

- **Linear equations in one variable:** one- and two-step equations, distribution, variables on both sides, contextual modeling, and zero/one/infinitely-many-solution reasoning.
- **Linear functions:** evaluation, slope/intercept recognition and interpretation, slopes from points, rules from input/output pairs, and intersections of linear rules.
- **Linear equations in two variables:** coordinate substitution, standard-form slope, coefficient interpretation, and parallel/perpendicular lines.
- **Systems of two linear equations:** direct solution, elimination, contextual systems, and dependent/inconsistent systems.
- **Linear inequalities:** positive- and negative-coefficient solution rules, point testing in two variables, and contextual maximum constraints.

### Advanced Math

- **Equivalent expressions:** monic trinomial factoring, common factors, differences of squares, polynomial combination and multiplication, exponent quotients, rational expressions, and rational-exponent/radical forms.
- **Nonlinear equations in one variable:** quadratic roots and root relationships, discriminants, absolute value, radical, rational, exponential, and factored polynomial equations.
- **Systems of equations in two variables:** verifying intersections, linear–quadratic root sums/products, tangent systems, and circle–line intersection counts.
- **Nonlinear functions:** quadratic evaluation, vertices, zeros, useful forms, exponential parameters and values, and function transformations.

### Problem-Solving and Data Analysis

- **Ratios, rates, proportional relationships, and units:** unit rates, scale drawings, time/rate conversion, compound-unit conversion, and density.
- **Percentages:** percent of a quantity, discounts, reverse percentages, successive changes, subgroup percentages, and growth factors.
- **One-variable data:** mean, median, updated mean, range/spread comparisons, standard deviation, and outlier effects.
- **Two-variable data:** model prediction, slope interpretation, residuals, model selection, association, tables, and scatterplots.
- **Probability and conditional probability:** simple and conditional probability, two-way tables, independent intersections, unions, and expected counts.
- **Inference from sample statistics and margin of error:** sample statistics, population estimates, intervals, sample-size effects, and generalization.
- **Evaluating statistical claims:** random samples, random assignment, observational confounding, self-selection, comparison groups, causation, and generalizability.

### Geometry and Trigonometry

- **Area and volume:** rectangle and triangle measures, circle area, cylinder volume, prism surface area, and similar-figure length/area/volume scaling.
- **Lines, angles, and triangles:** triangle sums, vertical/corresponding/supplementary/exterior angles, parallel-line relationships, similarity, and SAS sufficiency.
- **Right triangles and trigonometry:** Pythagorean theorem, coordinate distance, special right triangles, sine/cosine/tangent, complementary angles, and unit-circle radians.
- **Circles:** radius/diameter, circumference/area, equations, arc length, sector area, inscribed angles, and tangent lines.

## Reading and Writing recipe coverage

- **Central Ideas and Details:** central claims and explicit detail retrieval.
- **Command of Evidence—Textual:** findings that directly support a specified claim.
- **Command of Evidence—Quantitative:** accurate comparisons and differences from tables.
- **Inferences:** supported conclusions without reversals, unsupported causation, or overstatement.
- **Words in Context:** logical/precise completion and meaning-in-context stems using high-utility academic vocabulary.
- **Text Structure and Purpose:** whole-text purpose and sentence-function questions.
- **Cross-Text Connections:** agreement and one author's likely response to another.
- **Rhetorical Synthesis:** selecting notes for significance, date/introduction, and field/achievement goals.
- **Transitions:** contrast, result, example, addition, concession, and sequence.
- **Boundaries:** between-sentence punctuation, introductory elements, lists, supplementary information, conjunctive adverbs, and cases requiring no punctuation.
- **Form, Structure, and Sense:** subject–verb and pronoun–antecedent agreement, verb finiteness, tense/aspect, modifier placement, parallel structure, logical comparison, genitives, and plurals.

## Adding or changing a recipe

1. Add the recipe inside the generator for its exact skill; do not create an unofficial skill label just for a subtype.
2. Generate parameters from a known solution or relationship. Avoid solving a randomly generated problem after the fact when backward construction can guarantee clean values.
3. Give each distractor a reason: sign error, wrong denominator, reciprocal, incorrect growth factor, wrong comparison group, overstatement, punctuation misconception, or another identifiable error.
4. Record every parameter required to independently recompute the answer in `meta.parameters`.
5. Keep Math student-response answers within the accepted integer, decimal, or fraction conventions, and always provide an accepted response that fits the SAT's five-character answer grid. Do not require symbols in a student response.
6. Add an independent recalculation case to `validate.js` for any new numerical recipe.
7. Run all validation commands in `README.md` and inspect representative easy, medium, and hard output.

## Quality boundaries

- All items are original and derived from skill definitions and question structures, not copied official questions.
- Difficulty is an instructional construction based on steps, abstraction, representation, and distractor closeness. It has not been statistically equated on a student population.
- A generated bank is a drill library, not an adaptive scored SAT form. Use official Bluebook practice tests for score prediction, timing, and adaptive-module experience.
- Generator changes that alter an existing seed's output should use a new baseline version such as `baseline-v2` so old progress remains interpretable.
