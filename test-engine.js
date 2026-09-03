(function () {
  "use strict";

  const SCORE_SOURCE = "https://satsuite.collegeboard.org/media/pdf/scoring-sat-practice-test-11-digital.pdf";
  const DIFFICULTY_WEIGHTS = { Easy: 0.9, Medium: 1, Hard: 1.1 };

  // College Board Practice Test 11 paper-form score ranges (2026).
  const RW_CURVE = [
    [200, 200], [210, 220], [210, 220], [210, 220], [210, 220], [210, 230], [220, 240], [220, 240],
    [220, 250], [230, 260], [230, 270], [240, 280], [250, 290], [250, 300], [260, 310], [270, 320],
    [270, 330], [290, 330], [300, 340], [310, 350], [320, 360], [330, 370], [340, 380], [340, 380],
    [350, 390], [360, 400], [360, 400], [370, 410], [380, 420], [390, 430], [390, 430], [400, 440],
    [410, 450], [420, 460], [430, 470], [440, 480], [450, 490], [450, 490], [460, 500], [470, 510],
    [470, 530], [480, 540], [490, 550], [500, 560], [510, 570], [520, 580], [530, 590], [540, 600],
    [560, 620], [570, 630], [580, 640], [590, 650], [600, 660], [620, 680], [630, 690], [640, 700],
    [660, 700], [680, 720], [690, 730], [700, 740], [710, 750], [720, 760], [730, 770], [740, 780],
    [760, 780], [780, 800], [800, 800]
  ];

  const MATH_CURVE = [
    [200, 200], [210, 220], [210, 220], [210, 230], [220, 240], [230, 250], [240, 270], [250, 290],
    [260, 320], [270, 330], [290, 350], [310, 350], [330, 370], [340, 380], [350, 390], [350, 390],
    [360, 400], [370, 410], [370, 410], [380, 420], [390, 430], [390, 430], [400, 440], [410, 450],
    [410, 450], [420, 460], [430, 470], [440, 480], [450, 490], [460, 500], [470, 510], [480, 520],
    [490, 530], [490, 550], [500, 560], [510, 570], [530, 590], [540, 600], [550, 610], [560, 620],
    [570, 630], [590, 650], [600, 660], [610, 670], [620, 680], [640, 700], [650, 710], [660, 720],
    [680, 740], [700, 760], [710, 770], [730, 780], [750, 800], [770, 800], [790, 800]
  ];

  const SECTION_DOMAINS = {
    "Reading and Writing": {
      27: { "Information and Ideas": 7, "Craft and Structure": 8, "Expression of Ideas": 5, "Standard English Conventions": 7 },
      54: { "Information and Ideas": 14, "Craft and Structure": 15, "Expression of Ideas": 11, "Standard English Conventions": 14 }
    },
    Math: {
      22: { Algebra: 8, "Advanced Math": 8, "Problem-Solving and Data Analysis": 3, "Geometry and Trigonometry": 3 },
      44: { Algebra: 15, "Advanced Math": 15, "Problem-Solving and Data Analysis": 7, "Geometry and Trigonometry": 7 }
    }
  };

  const SKILL_RULES = {
    "Linear equations in one variable": "Undo operations in reverse order, preserve equality, and substitute the result into the original equation.",
    "Linear functions": "Track what the slope, intercept, input, and output represent before calculating.",
    "Linear equations in two variables": "A point is on a line only when its coordinates make the equation true; parallel slopes match and perpendicular slopes are negative reciprocals.",
    "Systems of two linear equations in two variables": "A system's solution must satisfy both equations at the same time.",
    "Linear inequalities in one or two variables": "Reverse the inequality only when multiplying or dividing by a negative number, and check whether the boundary is included.",
    "Equivalent expressions": "Equivalent expressions must agree for every allowed input; expand, factor, or combine them to verify the match.",
    "Nonlinear equations in one variable": "Respect domain restrictions and check every proposed root in the original equation for extraneous solutions.",
    "Systems of equations in two variables": "Intersections satisfy both equations; substitution turns the system into a one-variable equation.",
    "Nonlinear functions": "Choose the function form that exposes the requested feature—vertex, zeros, initial value, or growth factor.",
    "Ratios, rates, proportional relationships, and units": "Write units beside every quantity and cancel units before interpreting the result.",
    Percentages: "Convert the percent to a multiplier: p% is p/100, an increase uses 1 + p/100, and a decrease uses 1 − p/100.",
    "One-variable data: Distributions and measures of center and spread": "Separate measures of center from measures of spread, and consider how outliers affect each one.",
    "Two-variable data: Models and scatterplots": "Interpret slope as predicted change in y per one unit of x; a residual is observed minus predicted.",
    "Probability and conditional probability": "Define the sample space first; for conditional probability, restrict the denominator to the stated condition.",
    "Inference from sample statistics and margin of error": "Match conclusions to the population actually sampled and treat a margin of error as an interval around an estimate.",
    "Evaluating statistical claims: Observational studies and experiments": "Random sampling supports generalization; random assignment supports causal conclusions. They solve different problems.",
    "Area and volume": "Identify whether the question needs a length, area, surface area, or volume; scale factors are raised to powers 1, 2, or 3 respectively.",
    "Lines, angles, and triangles": "Mark the stated angle relationship or congruence fact before writing an equation.",
    "Right triangles and trigonometry": "Label opposite, adjacent, and hypotenuse relative to the named angle before choosing a ratio.",
    Circles: "Connect the center and radius to the equation, and distinguish central angles, inscribed angles, arcs, sectors, and tangents.",
    "Central Ideas and Details": "Choose the option that captures the passage's main result or stated detail without narrowing, reversing, or exaggerating it.",
    "Command of Evidence: Textual": "The best evidence must directly connect the same cause, group, behavior, or comparison named in the claim.",
    "Command of Evidence: Quantitative": "Read the labels and units, then cite the exact values whose comparison proves the claim.",
    Inferences: "Use only conclusions required or strongly supported by the text; avoid new causes, universal claims, and reversed relationships.",
    "Words in Context": "Use the surrounding logical relationship and grammatical role, not just a familiar dictionary meaning.",
    "Text Structure and Purpose": "Describe what the sentence or passage does in context—introduces, contrasts, qualifies, illustrates, or concludes.",
    "Cross-Text Connections": "State each author's position separately before identifying agreement, disagreement, or a likely response.",
    "Rhetorical Synthesis": "Select only notes that serve the stated goal; accurate but irrelevant information is still a wrong answer.",
    Transitions: "Name the relationship between the ideas first, then select the transition that signals exactly that relationship.",
    Boundaries: "Identify complete and dependent clauses before choosing punctuation; punctuation follows sentence structure, not pauses in speech.",
    "Form, Structure, and Sense": "Locate the sentence's true subject, time relationship, modifier target, and parallel grammatical pattern."
  };

  function hash(value) {
    let result = 2166136261;
    for (const character of String(value)) {
      result ^= character.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  }

  function randomFor(seed) {
    let state = hash(seed) || 1;
    return function () {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };
  }

  function shuffle(values, seed) {
    const result = [...values];
    const rng = randomFor(seed);
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(rng() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function allocateDifficulties(total) {
    const shares = [{ name: "Easy", value: total * 0.3 }, { name: "Medium", value: total * 0.4 }, { name: "Hard", value: total * 0.3 }];
    const allocation = Object.fromEntries(shares.map((share) => [share.name, Math.floor(share.value)]));
    let remainder = total - Object.values(allocation).reduce((sum, value) => sum + value, 0);
    for (const share of shares.sort((a, b) => (b.value % 1) - (a.value % 1))) {
      if (!remainder) break;
      allocation[share.name] += 1;
      remainder -= 1;
    }
    return allocation;
  }

  function selectAcrossSkills(candidates, amount, seed) {
    const groups = new Map();
    for (const question of candidates) {
      if (!groups.has(question.skill)) groups.set(question.skill, []);
      groups.get(question.skill).push(question);
    }
    const skills = shuffle([...groups.keys()], `${seed}/skills`);
    for (const skill of skills) groups.set(skill, shuffle(groups.get(skill), `${seed}/${skill}`));
    const selected = [];
    let cursor = 0;
    while (selected.length < amount && skills.length) {
      const skill = skills[cursor % skills.length];
      const group = groups.get(skill);
      if (group.length) selected.push(group.shift());
      cursor += 1;
      if (cursor > amount * skills.length * 4) break;
    }
    if (selected.length !== amount) throw new Error(`Unable to select ${amount} questions from ${candidates.length} candidates.`);
    return selected;
  }

  function selectSection(pool, section, total, seed) {
    const quotas = SECTION_DOMAINS[section]?.[total];
    if (!quotas) throw new Error(`No test blueprint for ${section} with ${total} questions.`);
    const selected = [];
    for (const [domain, amount] of Object.entries(quotas)) {
      const difficulties = allocateDifficulties(amount);
      for (const [difficulty, count] of Object.entries(difficulties)) {
        const candidates = pool.filter((question) => question.section === section && question.domain === domain && question.difficulty === difficulty && !selected.includes(question));
        selected.push(...selectAcrossSkills(candidates, count, `${seed}/${domain}/${difficulty}`));
      }
    }
    return shuffle(selected, `${seed}/final`);
  }

  function selectSkill(pool, section, skill, seed) {
    const selected = [];
    const targets = { Easy: 3, Medium: 4, Hard: 3 };
    for (const [difficulty, count] of Object.entries(targets)) {
      const candidates = pool.filter((question) => question.section === section && question.skill === skill && question.difficulty === difficulty);
      selected.push(...shuffle(candidates, `${seed}/${difficulty}`).slice(0, count));
    }
    if (selected.length !== 10) throw new Error(`Unable to construct a 10-question test for ${skill}.`);
    return shuffle(selected, `${seed}/final`);
  }

  function splitModules(questions, firstLabel, secondLabel, durationSeconds, seed) {
    const first = [];
    const second = [];
    const grouped = new Map();
    for (const question of questions) {
      const key = `${question.domain}/${question.difficulty}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(question);
    }
    for (const [key, items] of grouped) {
      shuffle(items, `${seed}/${key}`).forEach((question, index) => (index % 2 === 0 ? first : second).push(question));
    }
    while (first.length > questions.length / 2) second.push(first.pop());
    while (second.length > questions.length / 2) first.push(second.pop());
    return [
      { label: firstLabel, section: questions[0].section, durationSeconds, questions: shuffle(first, `${seed}/first`) },
      { label: secondLabel, section: questions[0].section, durationSeconds, questions: shuffle(second, `${seed}/second`) }
    ];
  }

  function testDefinition(kind, section, skill = null) {
    if (kind === "skill") {
      const minutes = section === "Math" ? 16 : 12;
      return { kind, section, skill, title: `${skill} mini-test`, summary: `10 questions · ${minutes} minutes`, minutes, questionCount: 10 };
    }
    if (kind === "section") {
      const questionCount = section === "Math" ? 22 : 27;
      const minutes = section === "Math" ? 35 : 32;
      return { kind, section, skill: null, title: `${section} module test`, summary: `${questionCount} questions · ${minutes} minutes`, minutes, questionCount };
    }
    return { kind: "full", section: null, skill: null, title: "Full-length SAT simulation", summary: "98 questions · 2 hours 14 minutes", minutes: 134, questionCount: 98 };
  }

  function buildSATTest(options, pool = window.SAT_QUESTIONS) {
    const definition = testDefinition(options.kind, options.section, options.skill);
    const seed = String(options.seed || "test-1");
    let modules;
    if (definition.kind === "skill") {
      modules = [{ label: definition.title, section: definition.section, durationSeconds: definition.minutes * 60, questions: selectSkill(pool, definition.section, definition.skill, seed) }];
    } else if (definition.kind === "section") {
      modules = [{ label: definition.title, section: definition.section, durationSeconds: definition.minutes * 60, questions: selectSection(pool, definition.section, definition.questionCount, seed) }];
    } else {
      const readingWriting = selectSection(pool, "Reading and Writing", 54, `${seed}/rw`);
      const math = selectSection(pool, "Math", 44, `${seed}/math`);
      modules = [
        ...splitModules(readingWriting, "Reading and Writing · Module 1", "Reading and Writing · Module 2", 32 * 60, `${seed}/rw-modules`),
        ...splitModules(math, "Math · Module 1", "Math · Module 2", 35 * 60, `${seed}/math-modules`)
      ];
    }
    const ids = modules.flatMap((module) => module.questions.map((question) => question.id));
    if (new Set(ids).size !== ids.length) throw new Error("A test contains duplicate questions.");
    return { id: `sat-test-${hash(`${seed}/${definition.title}`).toString(36)}`, seed, definition, modules };
  }

  function normalizeResponse(value) {
    const compact = String(value ?? "").trim().replaceAll(" ", "").replace(/^\+/, "");
    if (/^-?\d+\/\d+$/.test(compact)) {
      const [numerator, denominator] = compact.split("/").map(Number);
      return denominator === 0 ? compact : String(numerator / denominator);
    }
    const number = Number(compact);
    return Number.isFinite(number) && compact !== "" ? String(number) : compact.toLowerCase();
  }

  function responseIsCorrect(question, value) {
    if (value === undefined || String(value).trim() === "") return false;
    if (question.type === "mcq") return Number(value) === question.answer;
    return question.accepted.some((answer) => normalizeResponse(answer) === normalizeResponse(value));
  }

  function roundTen(value) {
    return Math.max(200, Math.min(800, Math.round(value / 10) * 10));
  }

  function wilson(successes, total, z = 1.645) {
    if (!total) return [0, 1];
    const proportion = successes / total;
    const denominator = 1 + z * z / total;
    const center = (proportion + z * z / (2 * total)) / denominator;
    const margin = z * Math.sqrt((proportion * (1 - proportion) + z * z / (4 * total)) / total) / denominator;
    return [Math.max(0, center - margin), Math.min(1, center + margin)];
  }

  function estimateSection(section, results, scope) {
    const curve = section === "Math" ? MATH_CURVE : RW_CURVE;
    const weightedTotal = results.reduce((sum, result) => sum + DIFFICULTY_WEIGHTS[result.question.difficulty], 0);
    const weightedCorrect = results.reduce((sum, result) => sum + (result.correct ? DIFFICULTY_WEIGHTS[result.question.difficulty] : 0), 0);
    const priorStrength = scope === "skill" ? 12 : scope === "section" ? 4 : 0;
    const priorRate = 0.65;
    const estimatedRate = (weightedCorrect + priorStrength * priorRate) / (weightedTotal + priorStrength);
    const equivalentRaw = Math.max(0, Math.min(curve.length - 1, Math.round(estimatedRate * (curve.length - 1))));
    const base = curve[equivalentRaw];
    const rawCorrect = results.filter((result) => result.correct).length;
    const [lowRate, highRate] = wilson(rawCorrect + priorStrength * priorRate, results.length + priorStrength);
    const lowCurve = curve[Math.max(0, Math.min(curve.length - 1, Math.floor(lowRate * (curve.length - 1))))];
    const highCurve = curve[Math.max(0, Math.min(curve.length - 1, Math.ceil(highRate * (curve.length - 1))))];
    const low = roundTen(Math.min(base[0], lowCurve[0]));
    const high = roundTen(Math.max(base[1], highCurve[1]));
    return {
      section,
      correct: rawCorrect,
      total: results.length,
      accuracy: Math.round(rawCorrect / results.length * 100),
      estimate: roundTen((base[0] + base[1]) / 2),
      low,
      high,
      equivalentRaw,
      equivalentRawMaximum: curve.length - 1
    };
  }

  function scoreSATTest(test, answers) {
    const questionResults = test.modules.flatMap((module) => module.questions.map((question) => ({
      question,
      value: answers[question.id],
      correct: responseIsCorrect(question, answers[question.id])
    })));
    const sections = {};
    for (const section of [...new Set(questionResults.map((result) => result.question.section))]) {
      sections[section] = estimateSection(section, questionResults.filter((result) => result.question.section === section), test.definition.kind);
    }
    const sectionScores = Object.values(sections);
    const total = sectionScores.length === 2 ? {
      estimate: sectionScores.reduce((sum, result) => sum + result.estimate, 0),
      low: sectionScores.reduce((sum, result) => sum + result.low, 0),
      high: sectionScores.reduce((sum, result) => sum + result.high, 0)
    } : null;
    const domainBreakdown = {};
    for (const result of questionResults) {
      const key = result.question.domain;
      domainBreakdown[key] ||= { correct: 0, total: 0 };
      domainBreakdown[key].total += 1;
      if (result.correct) domainBreakdown[key].correct += 1;
    }
    return { sections, total, questionResults, domainBreakdown, source: SCORE_SOURCE };
  }

  function answerText(question, value) {
    if (value === undefined || String(value).trim() === "") return "No answer";
    return question.type === "mcq" ? question.choices[Number(value)] ?? "No answer" : String(value);
  }

  function correctText(question) {
    return question.type === "mcq" ? question.choices[question.answer] : question.answerDisplay;
  }

  function numeric(value) {
    const normalized = normalizeResponse(value);
    const number = Number(normalized);
    return Number.isFinite(number) && normalized !== "" ? number : null;
  }

  function transitionMeaning(choice) {
    const word = String(choice).toLowerCase();
    if (/however|in contrast|nevertheless|even so|instead/.test(word)) return "a contrast or concession";
    if (/therefore|consequently|as a result/.test(word)) return "a result";
    if (/for example|for instance|specifically/.test(word)) return "an example or specification";
    if (/moreover|similarly|likewise/.test(word)) return "an addition or similarity";
    if (/next|meanwhile/.test(word)) return "a sequence or time relationship";
    return "a different logical relationship";
  }

  function diagnoseWrongAnswer(question, value) {
    const selected = answerText(question, value);
    const correct = correctText(question);
    const selectedNumber = numeric(selected);
    const correctNumber = numeric(correct);
    const recipe = question.meta.recipe;
    if (question.section === "Math" && selectedNumber !== null && correctNumber !== null) {
      if (correctNumber !== 0 && Math.abs(selectedNumber + correctNumber) < 0.00001) return `The selected value, ${selected}, has the correct magnitude but the wrong sign. Recheck subtraction, slope direction, or whether dividing by a negative reverses a relationship.`;
      if (selectedNumber !== 0 && correctNumber !== 0 && Math.abs(selectedNumber * correctNumber - 1) < 0.00001) return `The selected value, ${selected}, is the reciprocal of the required value. Check which quantity belongs in the numerator and which belongs in the denominator.`;
      if (Math.abs(selectedNumber - correctNumber * 100) < 0.00001 || Math.abs(selectedNumber * 100 - correctNumber) < 0.00001) return `The selected value, ${selected}, differs by a factor of 100. This usually comes from using a percent as a whole number instead of dividing by 100.`;
      return `Substituting ${selected} into the relationship does not produce the required result. Work from the given quantities with their signs and units intact, then verify the value in the original equation or condition.`;
    }
    if (question.section === "Math") {
      if (/equivalent-expressions/.test(recipe)) return `The selected expression, “${selected},” changes a coefficient, sign, exponent, or denominator. Expanding or simplifying it will not reproduce the original expression for every allowed value.`;
      if (/systems/.test(recipe)) return `The selected result, “${selected},” does not satisfy both equations simultaneously. A value that works in only one equation is not a system solution.`;
      if (/statistical-claims|sample-inference/.test(recipe)) return `The selected conclusion, “${selected},” claims more—or a different kind of conclusion—than the sampling and assignment method permits.`;
      if (/function/.test(recipe)) return `The selected feature, “${selected},” confuses the role of a parameter, input, output, or graph transformation. Match each number to what the chosen function form actually displays.`;
      return `The selected answer, “${selected},” does not satisfy the defining relationship in the problem. Rebuild the relationship before choosing a calculation or conclusion.`;
    }
    if (question.skill === "Transitions") return `“${selected}” signals ${transitionMeaning(selected)}, but the two ideas require ${transitionMeaning(correct)}. Decide the relationship before looking at the choices.`;
    if (question.skill === "Boundaries") return `The selected punctuation, “${selected},” does not create the boundary required by the clauses around the blank. Identify whether each side can stand alone before punctuating it.`;
    if (question.skill === "Form, Structure, and Sense") return `The selected form, “${selected},” breaks the agreement, tense, modifier, comparison, or parallel-structure relationship established by the rest of the sentence.`;
    if (/Evidence/.test(question.skill)) return `The selected evidence, “${selected},” may mention the topic, but it does not directly establish the exact comparison or claim the question asks you to support.`;
    if (question.skill === "Central Ideas and Details" || question.skill === "Inferences") {
      if (/all|always|every|prove|must|never|only/i.test(selected)) return `The selected answer, “${selected},” is more absolute than the passage. The text supports a limited finding, not a universal conclusion.`;
      return `The selected answer, “${selected},” either reverses the reported relationship, focuses on a minor detail, or adds a conclusion the passage does not support.`;
    }
    if (question.skill === "Words in Context") return `“${selected}” does not preserve the sentence's logical relationship and precise meaning. Substitute it into the sentence and check both meaning and grammatical fit.`;
    if (question.skill === "Text Structure and Purpose" || question.skill === "Cross-Text Connections") return `The selected answer, “${selected},” misidentifies what the author is doing or how the two positions relate. Account for the passage's qualifying and contrast language.`;
    if (question.skill === "Rhetorical Synthesis") return `The selected sentence, “${selected},” does not accomplish the stated goal: it is irrelevant, omits a required detail, or contradicts the notes.`;
    return `The selected answer, “${selected},” conflicts with the relationship established in the text.`;
  }

  function getSATCoaching(question, value) {
    return {
      selected: answerText(question, value),
      correct: correctText(question),
      diagnosis: diagnoseWrongAnswer(question, value),
      solution: question.explanation,
      rule: SKILL_RULES[question.skill] || "Return to the exact relationship tested, then verify the answer against the original text or equation.",
      nextStep: `Retry this question without looking at the choices first, then complete another ${question.skill} problem of the same difficulty.`
    };
  }

  window.SAT_SCORE_SOURCE = SCORE_SOURCE;
  window.SAT_TEST_DEFINITIONS = { testDefinition };
  window.buildSATTest = buildSATTest;
  window.scoreSATTest = scoreSATTest;
  window.responseIsCorrect = responseIsCorrect;
  window.getSATCoaching = getSATCoaching;
})();
