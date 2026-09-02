"use strict";

global.window = {};
require("./questions.js");
require("./math-generator.js");
require("./rw-generator.js");

const BASELINE_SEED = "baseline-v1";
const STRESS_SEED_COUNT = 100;
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
    default: return undefined;
  }
}

if (!Array.isArray(questions)) fail("Question bank is not an array.");
if (questions.length !== 775) fail(`Expected 775 questions; found ${questions.length}.`);
if (new Set(questions.map((question) => question.id)).size !== questions.length) fail("Question IDs are not unique.");

for (const question of questions) {
  for (const field of ["id", "section", "domain", "skill", "difficulty", "type", "question", "explanation", "meta"]) {
    if (!question[field]) fail(`${question.id || "Unknown question"} is missing ${field}.`);
  }
  if (!question.meta?.recipe || question.meta.seed !== BASELINE_SEED || !question.meta.parameters) fail(`${question.id} has incomplete generation provenance.`);
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
  { section: "Math", skills: window.SAT_MATH_SKILLS, total: 500, domains: { Algebra: 125, "Advanced Math": 100, "Problem-Solving and Data Analysis": 175, "Geometry and Trigonometry": 100 }, difficulty: { Easy: 160, Medium: 180, Hard: 160 } },
  { section: "Reading and Writing", skills: window.SAT_RW_SKILLS, total: 275, domains: { "Information and Ideas": 100, "Craft and Structure": 75, "Expression of Ideas": 50, "Standard English Conventions": 50 }, difficulty: { Easy: 88, Medium: 99, Hard: 88 } }
];

for (const specification of specifications) {
  const sectionItems = questions.filter((question) => question.section === specification.section);
  if (sectionItems.length !== specification.total) fail(`${specification.section}: expected ${specification.total}; found ${sectionItems.length}.`);
  if (!sameCounts(counts(sectionItems, "domain"), specification.domains)) fail(`${specification.section}: domain coverage is incorrect.`);
  if (!sameCounts(counts(sectionItems, "difficulty"), specification.difficulty)) fail(`${specification.section}: difficulty coverage is incorrect.`);
  const expectedSkills = new Set(specification.skills.map((skill) => skill.name));
  const actualSkills = new Set(sectionItems.map((question) => question.skill));
  if (expectedSkills.size !== actualSkills.size || [...expectedSkills].some((skill) => !actualSkills.has(skill))) fail(`${specification.section}: skill taxonomy is incomplete.`);
  for (const skill of specification.skills) {
    const items = sectionItems.filter((question) => question.skill === skill.name);
    if (items.length !== 25) fail(`${skill.name}: expected 25 questions; found ${items.length}.`);
    if (!sameCounts(counts(items, "difficulty"), { Easy: 8, Medium: 9, Hard: 8 })) fail(`${skill.name}: expected 8 easy, 9 medium, and 8 hard questions.`);
    const signatures = items.map((question) => `${question.stimulus}|${question.question}|${JSON.stringify(question.table || null)}|${JSON.stringify(question.figure || null)}`);
    if (new Set(signatures).size !== items.length) fail(`${skill.name}: duplicate question content found.`);
  }
}

const math = questions.filter((question) => question.section === "Math");
const readingWriting = questions.filter((question) => question.section === "Reading and Writing");
const mathTypes = counts(math, "type");
if (mathTypes.mcq < 300 || mathTypes.spr < 100) fail("Math bank does not contain a substantial mix of both response formats.");
if (readingWriting.some((question) => question.type !== "mcq")) fail("Reading and Writing questions must all be multiple choice.");
for (const question of math) auditMathAnswer(question);

for (const question of readingWriting) {
  const wordCount = question.stimulus.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > 150) fail(`${question.id}: passage exceeds the official 150-word maximum.`);
}

if (JSON.stringify(math) !== JSON.stringify(window.buildSATMathQuestions(BASELINE_SEED))) fail("Math generation is not deterministic for a fixed seed.");
if (JSON.stringify(readingWriting) !== JSON.stringify(window.buildSATRWQuestions(BASELINE_SEED))) fail("Reading and Writing generation is not deterministic for a fixed seed.");

for (let index = 0; index < STRESS_SEED_COUNT; index += 1) {
  const seed = `stress-${index}`;
  const generatedSets = [["Math", window.buildSATMathQuestions(seed), 500], ["Reading and Writing", window.buildSATRWQuestions(seed), 275]];
  for (const [label, items, expectedTotal] of generatedSets) {
    if (items.length !== expectedTotal) fail(`${label} stress seed ${seed}: wrong total.`);
    if (new Set(items.map((question) => question.id)).size !== expectedTotal) fail(`${label} stress seed ${seed}: duplicate IDs.`);
    if (items.some((question) => question.type === "mcq" && new Set(question.choices).size !== 4)) fail(`${label} stress seed ${seed}: duplicate choices.`);
    if (items.some((question) => /NaN|Infinity|undefined/.test(JSON.stringify(question)))) fail(`${label} stress seed ${seed}: nonfinite or undefined output.`);
    if (label === "Math") items.forEach(auditMathAnswer);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Question bank validation passed.");
console.log("775 unique questions: 275 Reading and Writing, 500 Math.");
console.log("31 exact skill selectors; every skill has 25 questions (8 easy, 9 medium, 8 hard). ");
console.log(`${mathTypes.mcq} Math multiple-choice and ${mathTypes.spr} Math student-produced response questions.`);
console.log(`Deterministic generation, ${STRESS_SEED_COUNT} alternate seeds, response formats, choices, tables, figures, and independent numeric answer calculations passed.`);
