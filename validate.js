"use strict";

global.window = {};
require("./questions.js");

const questions = window.SAT_QUESTIONS;
const expected = {
  "Reading and Writing": {
    total: 50,
    domains: {
      "Information and Ideas": 13,
      "Craft and Structure": 14,
      "Expression of Ideas": 10,
      "Standard English Conventions": 13
    },
    difficulty: { Easy: 15, Medium: 20, Hard: 15 },
    types: { mcq: 50 }
  },
  Math: {
    total: 50,
    domains: {
      Algebra: 18,
      "Advanced Math": 17,
      "Problem-Solving and Data Analysis": 8,
      "Geometry and Trigonometry": 7
    },
    difficulty: { Easy: 15, Medium: 20, Hard: 15 },
    types: { mcq: 39, spr: 11 }
  }
};

const failures = [];

function counts(items, field) {
  return items.reduce((result, item) => {
    result[item[field]] = (result[item[field]] || 0) + 1;
    return result;
  }, {});
}

function sameCounts(actual, target) {
  return JSON.stringify(Object.entries(actual).sort()) === JSON.stringify(Object.entries(target).sort());
}

if (!Array.isArray(questions)) failures.push("Question bank is not an array.");
if (questions.length !== 100) failures.push(`Expected 100 questions; found ${questions.length}.`);
if (new Set(questions.map((question) => question.id)).size !== questions.length) failures.push("Question IDs are not unique.");

for (const question of questions) {
  for (const field of ["id", "section", "domain", "skill", "difficulty", "type", "question", "explanation"]) {
    if (!question[field]) failures.push(`${question.id || "Unknown question"} is missing ${field}.`);
  }
  if (question.type === "mcq") {
    if (!Array.isArray(question.choices) || question.choices.length !== 4) failures.push(`${question.id} must have four choices.`);
    if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) failures.push(`${question.id} has an invalid answer index.`);
  } else if (question.type === "spr") {
    if (!Array.isArray(question.accepted) || question.accepted.length === 0) failures.push(`${question.id} has no accepted responses.`);
    if (!question.answerDisplay) failures.push(`${question.id} has no displayed answer.`);
  } else {
    failures.push(`${question.id} has an unsupported question type.`);
  }
  if (question.table) {
    if (!Array.isArray(question.table.headers) || !Array.isArray(question.table.rows)) failures.push(`${question.id} has an invalid table.`);
    if (question.table.rows.some((row) => row.length !== question.table.headers.length)) failures.push(`${question.id} has an uneven table row.`);
  }
}

for (const [section, specification] of Object.entries(expected)) {
  const items = questions.filter((question) => question.section === section);
  if (items.length !== specification.total) failures.push(`${section}: expected ${specification.total}; found ${items.length}.`);
  if (!sameCounts(counts(items, "domain"), specification.domains)) failures.push(`${section}: domain distribution does not match the specification.`);
  if (!sameCounts(counts(items, "difficulty"), specification.difficulty)) failures.push(`${section}: difficulty distribution does not match the specification.`);
  if (!sameCounts(counts(items, "type"), specification.types)) failures.push(`${section}: response format distribution does not match the specification.`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Question bank validation passed.");
console.log("100 unique questions: 50 Reading and Writing, 50 Math.");
console.log("Domain, difficulty, response-format, answer-key, and table checks passed.");
