"use strict";

global.window = {};
require("./questions.js");
require("./math-generator.js");
require("./rw-generator.js");
require("./test-engine.js");

const BASELINE_SEED = "baseline-v3";
const MINIMUM_RECIPES = 153;   // a floor, so adding a recipe is not a failure
const STRESS_SEED_COUNT = 100;
const EXPECTED_SKILLS = {
  "Reading and Writing": [
    "Central Ideas and Details", "Command of Evidence: Textual", "Command of Evidence: Quantitative", "Inferences",
    "Words in Context", "Text Structure and Purpose", "Cross-Text Connections", "Rhetorical Synthesis", "Transitions",
    "Boundaries", "Form, Structure, and Sense"
  ],
  Math: [
    "Linear equations in one variable", "Linear functions", "Linear equations in two variables", "Systems of two linear equations in two variables",
    "Linear inequalities in one or two variables", "Equivalent expressions", "Nonlinear equations in one variable", "Systems of equations in two variables",
    "Nonlinear functions", "Ratios, rates, proportional relationships, and units", "Percentages",
    "One-variable data: Distributions and measures of center and spread", "Two-variable data: Models and scatterplots",
    "Probability and conditional probability", "Inference from sample statistics and margin of error",
    "Evaluating statistical claims: Observational studies and experiments", "Area and volume", "Lines, angles, and triangles",
    "Right triangles and trigonometry", "Circles"
  ]
};
window.applySATMathSet(BASELINE_SEED);
window.applySATRWSet(BASELINE_SEED);

const questions = window.SAT_QUESTIONS;
const failures = [];

function fail(message) {
  failures.push(message);
}

function counts(items, field) {
  return items.reduce((result, item) => {
    result[item[field]] = (result[item[field]] || 0) + 1;
    return result;
  }, {});
}

function sameCounts(actual, target) {
  return JSON.stringify(Object.entries(actual).sort()) === JSON.stringify(Object.entries(target).sort());
}

function answerText(question) {
  return question.type === "mcq" ? question.choices[question.answer] : question.answerDisplay;
}

function numericValue(value) {
  const text = String(value).replaceAll("−", "-").trim();
  if (/^-?\d+(?:\.\d+)?\/-?\d+(?:\.\d+)?$/.test(text)) {
    const [numerator, denominator] = text.split("/").map(Number);
    return numerator / denominator;
  }
  return Number(text);
}

function requireNumericAnswer(question, expected) {
  const actual = numericValue(answerText(question));
  if (!Number.isFinite(actual) || Math.abs(actual - expected) >= 0.00011) {
    fail(`${question.id}: answer ${answerText(question)} does not equal independently calculated ${expected}.`);
  }
}

function radiansFromText(text) {
  const value = String(text).replaceAll("−", "-").trim();
  if (value === "0") return 0;
  const match = value.match(/^(-?)(\d*)\u03c0(?:\/(\d+))?$/);
  if (!match) return NaN;
  const sign = match[1] === "-" ? -1 : 1;
  const numerator = match[2] === "" ? 1 : Number(match[2]);
  const denominator = match[3] ? Number(match[3]) : 1;
  return sign * numerator * Math.PI / denominator;
}

// Handles the exact-value forms the trig recipes print: 1/2, √3/2, −√2/2, 1, 0.
function surdValue(text) {
  const value = String(text).replaceAll("−", "-").trim();
  const match = value.match(/^(-?)(?:\u221a(\d+))?(?:\/?(\d+))?$/);
  if (!match || (!match[2] && !match[3])) return numericValue(value);
  const sign = match[1] === "-" ? -1 : 1;
  const root = match[2] ? Math.sqrt(Number(match[2])) : 1;
  const denominator = match[3] ? Number(match[3]) : 1;
  return sign * root / denominator;
}

function requireApproxAnswer(question, expected) {
  const actual = surdValue(answerText(question));
  if (!Number.isFinite(actual) || Math.abs(actual - expected) >= 0.0005) {
    fail(`${question.id}: answer ${answerText(question)} does not equal independently calculated ${expected}.`);
  }
}

function auditMathAnswer(question) {
  const recipe = question.meta.recipe;
  const p = question.meta.parameters;
  switch (recipe) {
    case "linear-equations-one/two-step-solve":
    case "linear-equations-one/distribution-solve":
    case "linear-equations-one/context-create-solve":
    case "linear-equations-one/variables-both-sides": return requireNumericAnswer(question, p.x ?? p.hours);
    case "linear-functions/evaluate": return requireNumericAnswer(question, p.y);
    case "linear-functions/slope-intercept":
    case "linear-functions/slope-from-points": return requireNumericAnswer(question, p.m);
    case "linear-functions/intersect-linear-rules": return requireNumericAnswer(question, p.k);
    case "linear-equations-two/substitute-coordinate": return requireNumericAnswer(question, p.y);
    case "linear-systems/add-subtract-system": return requireNumericAnswer(question, p.x);
    case "linear-systems/context-system": return requireNumericAnswer(question, p.adults);
    case "linear-systems/elimination-system": return requireNumericAnswer(question, p.x + p.y);
    case "linear-inequalities/context-maximum": return requireNumericAnswer(question, Math.floor((p.capacity - p.fixed) / p.weight));
    case "nonlinear-equations/radical-basic": return requireNumericAnswer(question, p.root * p.root - p.shift);
    case "nonlinear-equations/quadratic-root-sum": return requireNumericAnswer(question, p.r1 + p.r2);
    case "nonlinear-equations/rational-equation": return requireNumericAnswer(question, p.x);
    case "nonlinear-equations/discriminant-parameter": return requireNumericAnswer(question, p.h * p.h);
    case "nonlinear-equations/exponential-common-base": return requireNumericAnswer(question, p.x);
    case "nonlinear-equations/polynomial-greatest-root": return requireNumericAnswer(question, Math.max(...p.roots));
    case "nonlinear-equations/quadratic-formula-solve": return requireNumericAnswer(question, p.positiveRoot);
    case "nonlinear-systems/intersection-root-sum": return requireNumericAnswer(question, p.r1 + p.r2);
    case "nonlinear-systems/intersection-root-product": return requireNumericAnswer(question, p.r1 * p.r2);
    case "nonlinear-functions/evaluate-quadratic": return requireNumericAnswer(question, p.a * p.x * p.x + p.b * p.x + p.c);
    case "nonlinear-functions/quadratic-vertex": return requireNumericAnswer(question, p.k);
    case "nonlinear-functions/exponential-use": return requireNumericAnswer(question, p.initial * p.factor ** p.steps);
    case "ratios-rates-units/unit-rate": return requireNumericAnswer(question, p.total / p.quantity);
    case "ratios-rates-units/scale-drawing": return requireNumericAnswer(question, p.scale * p.mapDistance);
    case "ratios-rates-units/convert-time-rate": return requireNumericAnswer(question, p.speed * p.minutes / 60);
    case "ratios-rates-units/compound-unit-conversion": return requireNumericAnswer(question, p.metersPerSecond * 3.6);
    case "ratios-rates-units/derived-unit-density": return requireNumericAnswer(question, p.mass / p.volume);
    case "percentages/percent-of": return requireNumericAnswer(question, p.original * p.percent / 100);
    case "percentages/discount": return requireNumericAnswer(question, p.original * (1 - p.percent / 100));
    case "percentages/reverse-percent": return requireNumericAnswer(question, p.final / (1 + p.percent / 100));
    case "percentages/percent-of-subgroup": return requireNumericAnswer(question, p.totalPercent * p.subgroupPercent / 100);
    case "one-variable-data/mean": return requireNumericAnswer(question, p.values.reduce((sum, value) => sum + value, 0) / p.values.length);
    case "one-variable-data/updated-mean": return requireNumericAnswer(question, (p.oldCount * p.oldMean + p.newValue) / (p.oldCount + 1));
    case "one-variable-data/median": {
      const values = [...p.values].sort((a, b) => a - b);
      return requireNumericAnswer(question, values[Math.floor(values.length / 2)]);
    }
    case "two-variable-data/model-prediction": return requireNumericAnswer(question, p.m * p.x + p.b);
    case "two-variable-data/residual": return requireNumericAnswer(question, p.observed - p.predicted);
    case "probability/independent-intersection": return requireNumericAnswer(question, p.pA * p.pB);
    case "probability/addition-rule": return requireNumericAnswer(question, p.pA + p.pB - p.overlap);
    case "probability/expected-count": return requireNumericAnswer(question, p.probability * p.trials);
    case "area-volume/rectangle-area": return requireNumericAnswer(question, p.length * p.width);
    case "area-volume/rectangle-perimeter": return requireNumericAnswer(question, 2 * (p.length + p.width));
    case "area-volume/triangle-area": return requireNumericAnswer(question, p.base * p.height / 2);
    case "area-volume/rectangular-prism-surface-area": return requireNumericAnswer(question, 2 * (p.length * p.width + p.length * p.height + p.width * p.height));
    case "area-volume/similar-solids": return requireNumericAnswer(question, p.largeVolume * (p.linearNumerator / p.linearDenominator) ** 3);
    case "lines-angles-triangles/triangle-angle-sum": return requireNumericAnswer(question, 180 - p.first - p.second);
    case "lines-angles-triangles/vertical-angles":
    case "lines-angles-triangles/parallel-corresponding-angles": return requireNumericAnswer(question, p.angle);
    case "lines-angles-triangles/similar-triangle-side": return requireNumericAnswer(question, p.small * p.scaleD / p.scaleN);
    case "lines-angles-triangles/linear-pair": return requireNumericAnswer(question, 180 - p.angle);
    case "lines-angles-triangles/algebraic-supplementary": return requireNumericAnswer(question, p.x);
    case "lines-angles-triangles/exterior-angle": return requireNumericAnswer(question, p.interior + p.other);
    case "right-triangles-trig/pythagorean-hypotenuse": return requireNumericAnswer(question, Math.hypot(p.a, p.b));
    case "right-triangles-trig/coordinate-distance": return requireNumericAnswer(question, Math.hypot(p.dx, p.dy));
    case "circles/diameter-from-radius": return requireNumericAnswer(question, 2 * p.radius);
    case "circles/radius-from-point": return requireNumericAnswer(question, Math.hypot(p.dx, p.dy));
    case "circles/inscribed-angle": return requireNumericAnswer(question, p.central / 2);
    // Recipes added in the difficulty-ceiling pass. Each expected value is
    // recomputed from the recorded parameters rather than read back.
    case "linear-equations-one/no-solution-parameter": return requireNumericAnswer(question, p.q);
    case "linear-systems/symmetric-sum": return requireNumericAnswer(question, (p.m + p.n) / (p.p + p.q));
    case "linear-systems/no-solution-coefficient": return requireNumericAnswer(question, p.d * (p.bCoef / p.e));
    case "linear-inequalities/boundary-parameter": return requireNumericAnswer(question, p.c - p.a * p.k);
    case "equivalent-expressions/complete-the-square": return requireNumericAnswer(question, p.cValue - (p.bCoef / 2) ** 2);
    case "nonlinear-systems/one-solution-parameter": return requireNumericAnswer(question, p.cValue - (p.bCoef / 2) ** 2);
    case "ratios-rates-units/combined-rate": return requireNumericAnswer(question, p.units / (p.rateA + p.rateB) * 60);
    case "percentages/nested-percent-reverse": return requireNumericAnswer(question, p.both / (p.innerPercent / 100) / (p.outerPercent / 100));
    case "one-variable-data/missing-value-from-mean": return requireNumericAnswer(question, p.mean * 5 - (p.first + p.second + p.third + p.fourth));
    case "two-variable-data/prediction-residual-gap": return requireNumericAnswer(question, p.slope * p.xVal + p.intercept - p.observed);
    case "area-volume/cylinder-radius-from-volume": return requireNumericAnswer(question, Math.sqrt(p.volume / p.height));
    case "linear-equations-two/standard-form-slope": return requireNumericAnswer(question, -p.a / p.b);
    case "nonlinear-systems/circle-horizontal-line": return requireNumericAnswer(question, Math.abs(p.y) < p.radius ? 2 : Math.abs(p.y) === p.radius ? 1 : 0);
    case "probability/simple-probability": return requireNumericAnswer(question, p.favorable / (p.favorable + p.other));
    case "probability/conditional-table": return requireNumericAnswer(question, p.bYes / (p.aYes + p.bYes));
    case "probability/conditional-two-way-table": return requireNumericAnswer(question, p.yesA / (p.yesA + p.noA));
    case "probability/complement-probability": return requireNumericAnswer(question, p.other / (p.favorable + p.other));
    case "probability/probability-from-frequency-table": return requireNumericAnswer(question, p.third / (p.favorable + p.other + p.third));
    case "probability/union-of-categories": return requireNumericAnswer(question, (p.favorable + p.other) / (p.favorable + p.other + p.third));
    case "probability/joint-from-table": return requireNumericAnswer(question, p.aNo / (p.aYes + p.aNo + p.bYes + p.bNo));
    case "probability/without-replacement-pair": return requireNumericAnswer(question, p.favorable * (p.favorable - 1) / ((p.favorable + p.other) * (p.favorable + p.other - 1)));
    case "sample-inference/sample-size-margin": return requireNumericAnswer(question, 1 / Math.sqrt(p.factor));
    case "area-volume/surface-area-scale": return requireNumericAnswer(question, Math.sqrt(p.ratioN / p.ratioD));
    case "right-triangles-trig/trig-ratio": return requireNumericAnswer(question, p.kind === "cos" ? p.b / p.c : p.kind === "tan" ? p.a / p.b : p.a / p.c);
    case "right-triangles-trig/pythagorean-leg": return requireNumericAnswer(question, Math.sqrt(p.c * p.c - p.b * p.b));
    case "right-triangles-trig/right-triangle-area": return requireNumericAnswer(question, p.a * p.b / 2);
    case "right-triangles-trig/identify-trig-ratio": return requireNumericAnswer(question, p.a / p.b);
    case "right-triangles-trig/side-from-sine": return requireNumericAnswer(question, p.c * (p.triple[0] / p.triple[2]));
    case "right-triangles-trig/thirty-sixty-ninety": return requireNumericAnswer(question, 2 * p.short);
    case "right-triangles-trig/unit-circle-radians": return requireApproxAnswer(question, Math.cos(radiansFromText(p.entry.angle)));
    default: return recipe;
  }
}

if (!Array.isArray(questions)) fail("Question bank is not an array.");
if (questions.length !== 1550) fail(`Expected 1,550 questions; found ${questions.length}.`);
if (new Set(questions.map((question) => question.id)).size !== questions.length) fail("Question IDs are not unique.");

for (const question of questions) {
  for (const field of ["id", "section", "domain", "skill", "difficulty", "type", "question", "explanation", "meta"]) {
    if (!question[field]) fail(`${question.id || "Unknown question"} is missing ${field}.`);
  }
  if (!question.meta?.recipe || question.meta.generationVersion !== "construct-validity-v3" || question.meta.seed !== BASELINE_SEED || !question.meta.parameters || ![1, 2].includes(question.meta.practiceSet) || question.practiceSet !== question.meta.practiceSet) fail(`${question.id} has incomplete generation provenance.`);
  if (!["Easy", "Medium", "Hard"].includes(question.difficulty)) fail(`${question.id} has an invalid difficulty.`);
  if (question.type === "mcq") {
    if (!Array.isArray(question.choices) || question.choices.length !== 4) fail(`${question.id} must have four choices.`);
    if (new Set(question.choices).size !== 4) fail(`${question.id} has duplicate choices.`);
    if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) fail(`${question.id} has an invalid answer index.`);
  } else if (question.type === "spr") {
    if (question.section !== "Math") fail(`${question.id}: only Math may use student-produced response.`);
    if (!Array.isArray(question.accepted) || question.accepted.length === 0) fail(`${question.id} has no accepted responses.`);
    if (question.accepted?.some((response) => !/^-?(?:\d+(?:\.\d+)?|\d+\/\d+)$/.test(String(response)))) fail(`${question.id} has a nonstandard student-produced response.`);
    if (question.accepted && !question.accepted.some((response) => String(response).length <= 5)) fail(`${question.id} has no SAT-grid-length accepted response.`);
    if (!question.answerDisplay) fail(`${question.id} has no displayed answer.`);
  } else {
    fail(`${question.id} has an unsupported question type.`);
  }
  if (question.table) {
    if (!Array.isArray(question.table.headers) || !Array.isArray(question.table.rows)) fail(`${question.id} has an invalid table.`);
    if (question.table.rows.some((row) => row.length !== question.table.headers.length)) fail(`${question.id} has an uneven table row.`);
  }
  if (question.figure) {
    if (question.figure.kind !== "scatter" || !Array.isArray(question.figure.points) || question.figure.points.length < 4) fail(`${question.id} has an invalid figure.`);
    if (question.figure.points?.some((point) => !Array.isArray(point) || point.length !== 2 || point.some((coordinate) => !Number.isFinite(coordinate)))) fail(`${question.id} has a nonnumeric figure point.`);
  }
  if (/Alternative \d|NaN|Infinity|undefined/.test(JSON.stringify(question))) fail(`${question.id} contains a generator artifact.`);
}

const specifications = [
  { section: "Math", skills: window.SAT_MATH_SKILLS, total: 1000, domains: { Algebra: 250, "Advanced Math": 200, "Problem-Solving and Data Analysis": 350, "Geometry and Trigonometry": 200 }, difficulty: { Easy: 320, Medium: 360, Hard: 320 } },
  { section: "Reading and Writing", skills: window.SAT_RW_SKILLS, total: 550, domains: { "Information and Ideas": 200, "Craft and Structure": 150, "Expression of Ideas": 100, "Standard English Conventions": 100 }, difficulty: { Easy: 176, Medium: 198, Hard: 176 } }
];

for (const specification of specifications) {
  const sectionItems = questions.filter((question) => question.section === specification.section);
  if (sectionItems.length !== specification.total) fail(`${specification.section}: expected ${specification.total}; found ${sectionItems.length}.`);
  if (!sameCounts(counts(sectionItems, "domain"), specification.domains)) fail(`${specification.section}: domain coverage is incorrect.`);
  if (!sameCounts(counts(sectionItems, "difficulty"), specification.difficulty)) fail(`${specification.section}: difficulty coverage is incorrect.`);
  const expectedSkills = new Set(specification.skills.map((skill) => skill.name));
  const actualSkills = new Set(sectionItems.map((question) => question.skill));
  if (JSON.stringify([...expectedSkills]) !== JSON.stringify(EXPECTED_SKILLS[specification.section])) fail(`${specification.section}: exposed selectors do not match the audited SAT skill taxonomy.`);
  if (expectedSkills.size !== actualSkills.size || [...expectedSkills].some((skill) => !actualSkills.has(skill))) fail(`${specification.section}: skill taxonomy is incomplete.`);
  for (const skill of specification.skills) {
    const items = sectionItems.filter((question) => question.skill === skill.name);
    if (items.length !== 50) fail(`${skill.name}: expected 50 questions; found ${items.length}.`);
    for (const practiceSet of [1, 2]) {
      const setItems = items.filter((question) => question.practiceSet === practiceSet);
      if (setItems.length !== 25) fail(`${skill.name}, set ${practiceSet}: expected 25 questions; found ${setItems.length}.`);
      if (!sameCounts(counts(setItems, "difficulty"), { Easy: 8, Medium: 9, Hard: 8 })) fail(`${skill.name}, set ${practiceSet}: expected 8 easy, 9 medium, and 8 hard questions.`);
      const expectedVariants = Array.from({ length: 25 }, (_, index) => index + 1 + (practiceSet - 1) * 25);
      const actualVariants = setItems.map((question) => question.meta.variant).sort((a, b) => a - b);
      if (JSON.stringify(actualVariants) !== JSON.stringify(expectedVariants)) fail(`${skill.name}, set ${practiceSet}: variant provenance is incomplete.`);
    }
    const set1Recipes = [...new Set(items.filter((question) => question.practiceSet === 1).map((question) => question.meta.recipe))].sort();
    const set2Recipes = [...new Set(items.filter((question) => question.practiceSet === 2).map((question) => question.meta.recipe))].sort();
    if (JSON.stringify(set1Recipes) !== JSON.stringify(set2Recipes)) fail(`${skill.name}: the two sets do not cover the same problem recipes.`);
    const signatures = items.map((question) => `${question.stimulus}|${question.question}|${JSON.stringify(question.table || null)}|${JSON.stringify(question.figure || null)}`);
    if (new Set(signatures).size !== items.length) fail(`${skill.name}: duplicate question content found.`);
  }
}

const math = questions.filter((question) => question.section === "Math");
const readingWriting = questions.filter((question) => question.section === "Reading and Writing");
for (const practiceSet of [1, 2]) {
  const recipeCount = new Set(questions.filter((question) => question.practiceSet === practiceSet).map((question) => question.meta.recipe)).size;
  if (recipeCount < MINIMUM_RECIPES) fail(`Set ${practiceSet}: expected at least ${MINIMUM_RECIPES} distinct problem recipes; found ${recipeCount}.`);
}
const mathTypes = counts(math, "type");
if (mathTypes.mcq < 600 || mathTypes.spr < 200) fail("Math bank does not contain a substantial mix of both response formats.");
const mathMultipleChoiceShare = mathTypes.mcq / math.length;
if (mathMultipleChoiceShare < 0.7 || mathMultipleChoiceShare > 0.8) fail("Math multiple-choice share is outside the official approximate three-quarters target.");
if (readingWriting.some((question) => question.type !== "mcq")) fail("Reading and Writing questions must all be multiple choice.");
// Every recipe whose answer is a plain number or fraction must have an
// independent recalculation above; auditMathAnswer returns the recipe name when
// it has none. Without this, a new numeric recipe could ship unchecked.
const unauditedNumericRecipes = new Set();
for (const question of math) {
  const standardizedWordCount = `${question.stimulus || ""} ${question.question}`.length / 6;
  if (standardizedWordCount > 50) fail(`${question.id}: Math prompt exceeds the official typical 50-word-equivalent context ceiling.`);
  const unhandled = auditMathAnswer(question);
  if (unhandled && /^-?\d+(?:\.\d+)?(?:\/-?\d+(?:\.\d+)?)?$/.test(String(answerText(question)).replaceAll("−", "-").trim())) {
    unauditedNumericRecipes.add(unhandled);
  }
}
if (unauditedNumericRecipes.size) {
  fail(`Numeric recipes without an independent recalculation in auditMathAnswer: ${[...unauditedNumericRecipes].sort().join(", ")}.`);
}

for (const question of readingWriting) {
  const completedStimulus = question.stimulus.includes("______")
    ? question.stimulus.replace("______", answerText(question))
    : question.stimulus;
  const standardizedWordCount = completedStimulus.length / 6;
  if (standardizedWordCount < 25) fail(`${question.id}: passage is below the official 25-word-equivalent minimum.`);
  if (standardizedWordCount > 150) fail(`${question.id}: passage exceeds the official 150-word-equivalent maximum.`);
}

for (const question of questions) {
  const wrongValue = question.type === "mcq" ? (question.answer + 1) % 4 : "987654";
  const correctValue = question.type === "mcq" ? question.answer : question.accepted[0];
  if (!window.responseIsCorrect(question, correctValue)) fail(`${question.id}: the test engine rejected a correct response.`);
  if (window.responseIsCorrect(question, wrongValue)) fail(`${question.id}: the test engine accepted a known wrong response.`);
  const coaching = window.getSATCoaching(question, wrongValue);
  for (const field of ["selected", "correct", "diagnosis", "solution", "rule", "nextStep"]) {
    if (!coaching[field] || /undefined|NaN/.test(String(coaching[field]))) fail(`${question.id}: coaching is missing ${field}.`);
  }
}

if (JSON.stringify(math) !== JSON.stringify(window.buildSATMathQuestionSets(BASELINE_SEED))) fail("Math generation is not deterministic for a fixed seed.");
if (JSON.stringify(readingWriting) !== JSON.stringify(window.buildSATRWQuestionSets(BASELINE_SEED))) fail("Reading and Writing generation is not deterministic for a fixed seed.");

for (let index = 0; index < STRESS_SEED_COUNT; index += 1) {
  const seed = `stress-${index}`;
  const generatedSets = [["Math", window.buildSATMathQuestionSets(seed), 1000], ["Reading and Writing", window.buildSATRWQuestionSets(seed), 550]];
  for (const [label, items, expectedTotal] of generatedSets) {
    if (items.length !== expectedTotal) fail(`${label} stress seed ${seed}: wrong total.`);
    if (new Set(items.map((question) => question.id)).size !== expectedTotal) fail(`${label} stress seed ${seed}: duplicate IDs.`);
    if (items.some((question) => question.type === "mcq" && new Set(question.choices).size !== 4)) fail(`${label} stress seed ${seed}: duplicate choices.`);
    if (items.some((question) => /NaN|Infinity|undefined/.test(JSON.stringify(question)))) fail(`${label} stress seed ${seed}: nonfinite or undefined output.`);
    const signatures = items.map((question) => `${question.stimulus}|${question.question}|${JSON.stringify(question.table || null)}|${JSON.stringify(question.figure || null)}`);
    if (new Set(signatures).size !== items.length) fail(`${label} stress seed ${seed}: duplicate content across question sets.`);
    if (label === "Math") {
      for (const question of items) {
        if (`${question.stimulus || ""} ${question.question}`.length / 6 > 50) fail(`${question.id}: alternate-seed Math prompt exceeds 50 word equivalents.`);
        auditMathAnswer(question);
      }
    } else {
      for (const question of items) {
        const completedStimulus = question.stimulus.includes("______")
          ? question.stimulus.replace("______", answerText(question))
          : question.stimulus;
        const standardizedWordCount = completedStimulus.length / 6;
        if (standardizedWordCount < 25 || standardizedWordCount > 150) fail(`${question.id}: alternate-seed Reading and Writing passage is outside 25–150 word equivalents.`);
      }
    }
  }
}

const testDefinitions = [
  ...window.SAT_MATH_SKILLS.map((skill) => ({ kind: "skill", section: "Math", skill: skill.name, expected: 10 })),
  ...window.SAT_RW_SKILLS.map((skill) => ({ kind: "skill", section: "Reading and Writing", skill: skill.name, expected: 10 })),
  { kind: "section", section: "Math", expected: 22 },
  { kind: "section", section: "Reading and Writing", expected: 27 },
  { kind: "mixed", expected: 20 },
  { kind: "full", expected: 98 }
];

for (const definition of testDefinitions) {
  const test = window.buildSATTest({ ...definition, seed: "validator-test" }, questions);
  const repeated = window.buildSATTest({ ...definition, seed: "validator-test" }, questions);
  const secondSetTest = window.buildSATTest({ ...definition, seed: "validator-test", practiceSets: { "Reading and Writing": 2, Math: 2 } }, questions);
  const testQuestions = test.modules.flatMap((module) => module.questions);
  const secondSetQuestions = secondSetTest.modules.flatMap((module) => module.questions);
  if (testQuestions.length !== definition.expected) fail(`${test.definition.title}: expected ${definition.expected} test questions; found ${testQuestions.length}.`);
  if (new Set(testQuestions.map((question) => question.id)).size !== testQuestions.length) fail(`${test.definition.title}: duplicate test questions.`);
  if (JSON.stringify(test) !== JSON.stringify(repeated)) fail(`${test.definition.title}: test assembly is not deterministic.`);
  if (testQuestions.some((question) => question.practiceSet !== 1)) fail(`${test.definition.title}: default test assembly mixed question sets.`);
  if (secondSetQuestions.some((question) => question.practiceSet !== 2)) fail(`${test.definition.title}: set 2 test assembly mixed question sets.`);
  if (definition.kind === "skill") {
    if (testQuestions.some((question) => question.skill !== definition.skill)) fail(`${test.definition.title}: includes another skill.`);
    if (!sameCounts(counts(testQuestions, "difficulty"), { Easy: 3, Medium: 4, Hard: 3 })) fail(`${test.definition.title}: difficulty mix is incorrect.`);
  }
}

const mixedTest = window.buildSATTest({ kind: "mixed", seed: "validator-mixed", practiceSets: { "Reading and Writing": 2, Math: 1 } }, questions);
if (mixedTest.modules.length !== 2 || mixedTest.modules[0].section !== "Reading and Writing" || mixedTest.modules[1].section !== "Math") fail("Combined mini-test must contain Reading and Writing followed by Math.");
if (mixedTest.modules[0].questions.length !== 10 || mixedTest.modules[1].questions.length !== 10) fail("Combined mini-test module lengths are incorrect.");
if (mixedTest.modules[0].durationSeconds !== 12 * 60 || mixedTest.modules[1].durationSeconds !== 16 * 60) fail("Combined mini-test module times are incorrect.");
if (mixedTest.modules[0].questions.some((question) => question.practiceSet !== 2) || mixedTest.modules[1].questions.some((question) => question.practiceSet !== 1)) fail("Combined mini-test did not preserve independent section set choices.");

const fullTest = window.buildSATTest({ kind: "full", seed: "validator-full" }, questions);
if (fullTest.modules.length !== 4 || !sameCounts(counts(fullTest.modules, "section"), { "Reading and Writing": 2, Math: 2 })) fail("Full test must contain four correctly labeled modules.");
if (!fullTest.modules.every((module) => module.questions.length === (module.section === "Math" ? 22 : 27))) fail("Full test module lengths are incorrect.");
if (!fullTest.modules.every((module) => module.durationSeconds === (module.section === "Math" ? 35 : 32) * 60)) fail("Full test module times are incorrect.");
const fullQuestions = fullTest.modules.flatMap((module) => module.questions);
if (!sameCounts(counts(fullQuestions, "domain"), {
  "Information and Ideas": 14,
  "Craft and Structure": 15,
  "Expression of Ideas": 11,
  "Standard English Conventions": 14,
  Algebra: 15,
  "Advanced Math": 15,
  "Problem-Solving and Data Analysis": 7,
  "Geometry and Trigonometry": 7
})) fail("Full test domain quotas are incorrect.");
const correctAnswers = Object.fromEntries(fullQuestions.map((question) => [question.id, question.type === "mcq" ? question.answer : question.answerDisplay]));
const wrongAnswers = Object.fromEntries(fullQuestions.map((question) => [question.id, question.type === "mcq" ? (question.answer + 1) % 4 : "987654"]));
const perfectScore = window.scoreSATTest(fullTest, correctAnswers);
const minimumScore = window.scoreSATTest(fullTest, wrongAnswers);
if (perfectScore.total?.estimate !== 1600 || minimumScore.total?.estimate !== 400) fail("Full-test score endpoints must be 400 and 1600.");
for (const score of [perfectScore, minimumScore]) {
  for (const result of Object.values(score.sections)) {
    if (result.low > result.estimate || result.high < result.estimate || result.low < 200 || result.high > 800) fail(`${result.section}: estimated range is invalid.`);
  }
}

let previousEstimate = 400;
for (let correctCount = 0; correctCount <= fullQuestions.length; correctCount += 1) {
  const answers = Object.fromEntries(fullQuestions.map((question, index) => [
    question.id,
    index < correctCount ? (question.type === "mcq" ? question.answer : question.accepted[0]) : (question.type === "mcq" ? (question.answer + 1) % 4 : "987654")
  ]));
  const estimate = window.scoreSATTest(fullTest, answers).total.estimate;
  if (estimate < previousEstimate) fail(`Full-test estimate decreased from ${previousEstimate} to ${estimate} after an additional correct answer.`);
  previousEstimate = estimate;
}

// --- Construct-validity checks -------------------------------------------
// A question is only measuring its skill if it cannot be answered without it.
// These checks fail the bank when an item is solvable by test-wiseness alone,
// when "difficulty" carries no information, or when decorative digits are
// standing in for genuine item variation.

const HEURISTIC_CEILING = 0.4;      // chance is 0.25 on a 4-choice item
// The check is deliberately one-sided. A key that echoes the passage is a cue a
// reader can use; a key that echoes it less than the distractors mostly is not.
// Function and citation items are built with an abstract key ("It concedes
// that...") against distractors that name passage content, so their overlap
// score sits near zero by design. A two-sided band would push those items away
// from the form the SAT actually uses. Eliminating the top-overlap choice and
// guessing is worth about 30% against a 25% baseline on the current bank.
const RW_DISTINCT_FLOOR = 50;       // every R&W item in a skill must be distinct
const MATH_HARD_TEMPLATE_FLOOR = 3; // 8 hard questions may not come from 1-2 molds
const VISIBLY_LONGER_CHARS = 12;   // a length edge smaller than this is not a usable cue

const HEURISTIC_STOPWORDS = new Set(
  ("the a an and or but of to in for on with that this these those from as at by is are was were be been " +
   "it its their they them which who what when whom does did do not more most than then also such some other")
    .split(" ")
);

function contentWords(text) {
  return new Set(
    String(text || "").toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/)
      .filter((word) => word.length > 3 && !HEURISTIC_STOPWORDS.has(word))
  );
}

// Collapse digits so index-derived years and week counts cannot pass as variation.
function contentSignature(question) {
  const strip = (text) => String(text || "").replace(/\d+/g, "#").replace(/\s+/g, " ").trim();
  return [
    strip(question.stimulus),
    question.passages ? strip(JSON.stringify(question.passages)) : "",
    strip(question.question),
    (question.choices || []).map(strip).sort().join("~")
  ].join("|");
}

const ABSOLUTE_PATTERN = /\b(every|all|always|never|must|entirely|completely|only|any|guarantees|cannot|none)\b/i;

// Each heuristic returns the index it would pick, or -1 if it does not apply.
const HEURISTICS = {
  "topic-word overlap": (question) => {
    const stimulus = contentWords(
      (question.stimulus || "") + " " + (question.passages ? JSON.stringify(question.passages) : "")
    );
    if (!stimulus.size) return -1;
    const ratios = question.choices.map((choice) => {
      const words = contentWords(choice);
      if (!words.size) return 0;
      let shared = 0;
      for (const word of words) if (stimulus.has(word)) shared += 1;
      return shared / words.size;
    });
    const best = Math.max(...ratios);
    // No overlap anywhere, or a tie for the most overlap, is not a cue a reader
    // could act on. Scoring those as a pick would credit the heuristic for what
    // is really a coin toss.
    if (best <= 0 || ratios.filter((ratio) => ratio === best).length > 1) return -1;
    return ratios.indexOf(best);
  },
  // Only fires when one choice is *visibly* longest. A one- or two-character
  // edge among four similar choices is not a cue a test taker can act on, and
  // treating it as one would push authors to pad text to defeat the metric.
  "longest choice": (question) => {
    const ordered = [...question.choices].sort((left, right) => right.length - left.length);
    if (ordered[0].length - ordered[1].length < VISIBLY_LONGER_CHARS) return -1;
    return question.choices.indexOf(ordered[0]);
  },
  "eliminate absolutes": (question) => {
    const surviving = question.choices
      .map((choice, index) => index)
      .filter((index) => !ABSOLUTE_PATTERN.test(question.choices[index]));
    return surviving.length === 1 ? surviving[0] : -1;
  }
};

const skillNames = [...new Set(questions.map((question) => question.skill))];

for (const skill of skillNames) {
  const choiceItems = questions.filter((question) => question.skill === skill && question.type === "mcq");
  if (choiceItems.length < 10) continue;
  for (const [name, heuristic] of Object.entries(HEURISTICS)) {
    let applicable = 0;
    let correct = 0;
    for (const question of choiceItems) {
      const picked = heuristic(question);
      if (picked < 0) continue;
      applicable += 1;
      if (picked === question.answer) correct += 1;
    }
    if (applicable < 10) continue;
    const rate = correct / applicable;
    if (rate > HEURISTIC_CEILING) {
      fail(
        `${skill}: the "${name}" heuristic answers ${(rate * 100).toFixed(0)}% of items correctly ` +
        `(${correct}/${applicable}); chance is 25% and the ceiling is ${HEURISTIC_CEILING * 100}%. ` +
        `These items are solvable without the tested skill.`
      );
    }
  }
}

// Difficulty must describe the item, not the slot it happened to land in.
const tiersBySignature = new Map();
for (const question of questions) {
  const signature = question.skill + "|" + contentSignature(question);
  if (!tiersBySignature.has(signature)) tiersBySignature.set(signature, new Set());
  tiersBySignature.get(signature).add(question.difficulty);
}
const straddling = [...tiersBySignature.values()].filter((tiers) => tiers.size > 1).length;
if (straddling) {
  fail(`${straddling} question(s) appear under more than one difficulty label; difficulty must be a property of the item.`);
}

// Decorative digits must not be the only thing separating two questions.
for (const skill of skillNames) {
  const items = questions.filter((question) => question.skill === skill);
  if (items[0].section === "Math") continue; // numeric parameters are genuine content in Math
  const distinct = new Set(items.map(contentSignature)).size;
  if (distinct < RW_DISTINCT_FLOOR) {
    fail(
      `${skill}: only ${distinct} of ${items.length} questions are distinct once decorative digits are ` +
      `normalized (floor is ${RW_DISTINCT_FLOOR}). Years and counts are not item variation.`
    );
  }
}

// A difficulty tier built from one or two molds cannot vary its own difficulty.
for (const skill of skillNames) {
  const items = questions.filter((question) => question.skill === skill);
  if (items[0].section !== "Math") continue;
  for (const set of [1, 2]) {
    const hard = items.filter((question) => question.difficulty === "Hard" && question.practiceSet === set);
    const templates = new Set(hard.map((question) => question.meta.recipe)).size;
    if (templates < MATH_HARD_TEMPLATE_FLOOR) {
      fail(
        `${skill} (set ${set}): ${hard.length} hard questions are generated from only ${templates} ` +
        `recipe(s); the floor is ${MATH_HARD_TEMPLATE_FLOOR}.`
      );
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Question bank validation passed.");
console.log("1,550 unique questions: 550 Reading and Writing, 1,000 Math.");
console.log(`31 exact skill selectors and ${MINIMUM_RECIPES} problem recipes per set; every skill has two unique 25-question sets (8 easy, 9 medium, 8 hard per set). `);
console.log(`${mathTypes.mcq} Math multiple-choice and ${mathTypes.spr} Math student-produced response questions.`);
console.log(`Deterministic generation, ${STRESS_SEED_COUNT} alternate seeds, response formats, choices, tables, figures, and independent numeric answer calculations passed.`);
console.log("Answer-specific coaching, 31 skill mini-tests, combined mini-tests, section tests, full-test blueprints, and monotonic score estimates passed.");
