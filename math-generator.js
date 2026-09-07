(function () {
  "use strict";

  const DIFFICULTIES = [
    ...Array(8).fill("Easy"),
    ...Array(9).fill("Medium"),
    ...Array(8).fill("Hard")
  ];
  const GENERATOR_VERSION = "construct-validity-v4";

  const SKILLS = [
    { slug: "linear-equations-one", domain: "Algebra", name: "Linear equations in one variable", description: "Solve, create, and interpret linear equations in one variable." },
    { slug: "linear-functions", domain: "Algebra", name: "Linear functions", description: "Connect linear functions with equations, tables, rates of change, and contexts." },
    { slug: "linear-equations-two", domain: "Algebra", name: "Linear equations in two variables", description: "Work with lines in the coordinate plane and equations of the form Ax + By = C." },
    { slug: "linear-systems", domain: "Algebra", name: "Systems of two linear equations in two variables", description: "Solve and interpret systems, including their number of solutions." },
    { slug: "linear-inequalities", domain: "Algebra", name: "Linear inequalities in one or two variables", description: "Solve, graph, create, and interpret linear inequalities." },
    { slug: "equivalent-expressions", domain: "Advanced Math", name: "Equivalent expressions", description: "Rewrite polynomial, rational, radical, and exponential expressions using structure." },
    { slug: "nonlinear-equations", domain: "Advanced Math", name: "Nonlinear equations in one variable", description: "Solve and analyze quadratic, absolute value, radical, rational, exponential, and polynomial equations." },
    { slug: "nonlinear-systems", domain: "Advanced Math", name: "Systems of equations in two variables", description: "Solve and analyze systems containing at least one nonlinear equation." },
    { slug: "nonlinear-functions", domain: "Advanced Math", name: "Nonlinear functions", description: "Create, use, interpret, and transform quadratic, exponential, polynomial, and rational functions." },
    { slug: "ratios-rates-units", domain: "Problem-Solving and Data Analysis", name: "Ratios, rates, proportional relationships, and units", description: "Use proportional reasoning, rates, units, conversions, scale, and derived units." },
    { slug: "percentages", domain: "Problem-Solving and Data Analysis", name: "Percentages", description: "Solve percent, percent-change, growth-factor, tax, discount, and interest problems." },
    { slug: "one-variable-data", domain: "Problem-Solving and Data Analysis", name: "One-variable data: Distributions and measures of center and spread", description: "Analyze distributions and calculate or interpret center and spread." },
    { slug: "two-variable-data", domain: "Problem-Solving and Data Analysis", name: "Two-variable data: Models and scatterplots", description: "Analyze associations, models, residuals, rates, and predictions for paired data." },
    { slug: "probability", domain: "Problem-Solving and Data Analysis", name: "Probability and conditional probability", description: "Use counts, tables, relative frequency, conditional probability, and independence." },
    { slug: "sample-inference", domain: "Problem-Solving and Data Analysis", name: "Inference from sample statistics and margin of error", description: "Connect random samples, estimates, populations, sample size, and margin of error." },
    { slug: "statistical-claims", domain: "Problem-Solving and Data Analysis", name: "Evaluating statistical claims: Observational studies and experiments", description: "Judge generalizability, causation, random sampling, random assignment, and study design." },
    { slug: "area-volume", domain: "Geometry and Trigonometry", name: "Area and volume", description: "Solve problems involving perimeter, area, surface area, volume, density, and scale factors." },
    { slug: "lines-angles-triangles", domain: "Geometry and Trigonometry", name: "Lines, angles, and triangles", description: "Use angle relationships, similarity, congruence, and triangle theorems." },
    { slug: "right-triangles-trig", domain: "Geometry and Trigonometry", name: "Right triangles and trigonometry", description: "Use the Pythagorean theorem, special triangles, trigonometric ratios, and complementary angles." },
    { slug: "circles", domain: "Geometry and Trigonometry", name: "Circles", description: "Use circle equations, radii, tangents, arcs, sectors, circumference, and area." }
  ];

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

  function int(rng, minimum, maximum) {
    return Math.floor(rng() * (maximum - minimum + 1)) + minimum;
  }

  function pick(rng, values) {
    return values[int(rng, 0, values.length - 1)];
  }

  function nonzero(rng, minimum, maximum) {
    let value = 0;
    while (value === 0) value = int(rng, minimum, maximum);
    return value;
  }

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) [x, y] = [y, x % y];
    return x || 1;
  }

  function fraction(numerator, denominator) {
    if (denominator < 0) return fraction(-numerator, -denominator);
    const divisor = gcd(numerator, denominator);
    const n = numerator / divisor;
    const d = denominator / divisor;
    return d === 1 ? String(n) : `${n}/${d}`;
  }

  function numberText(value) {
    if (Number.isInteger(value)) return String(value);
    return String(Number(value.toFixed(4)));
  }

  function rootName(index) {
    if (index === 2) return "square root";
    if (index === 3) return "cube root";
    return `${index}th root`;
  }

  function cleanMathText(value) {
    return String(value)
      // Binary floating point leaks values like 0.44999999999999996 into
      // distractors and explanations. Round anything longer than the four
      // decimals numberText produces.
      .replace(/\d+\.\d{5,}/g, (number) => String(Number(Number(number).toFixed(4))))
      .replace(/− \((-?\d+(?:\.\d+)?)\)/g, (_, number) => Number(number) < 0 ? `+ ${Math.abs(Number(number))}` : `− ${number}`)
      .replace(/\+ \((-?\d+(?:\.\d+)?)\)/g, (_, number) => Number(number) < 0 ? `− ${Math.abs(Number(number))}` : `+ ${number}`)
      .replace(/\(−(\d+(?:\.\d+)?)\)/g, "(−$1)");
  }

  function signedTerm(value, variable = "") {
    const magnitude = Math.abs(value);
    const coefficient = variable && magnitude === 1 ? "" : magnitude;
    return `${value < 0 ? "−" : "+"} ${coefficient}${variable}`;
  }

  // A leading coefficient of 1 is not written, and −1 is written as a bare sign.
  function coefficientText(value) {
    const text = String(value);
    if (text === "1") return "";
    if (text === "-1" || text === "−1") return "−";
    return text;
  }

  function linearText(a, variable, b) {
    const first = a === 1 ? variable : a === -1 ? `−${variable}` : `${a}${variable}`;
    return b === 0 ? first : `${first} ${signedTerm(b)}`;
  }

  function shuffledChoices(rng, correct, distractors) {
    const correctText = String(correct);
    const unique = [];
    for (const candidate of distractors.map(String)) {
      if (candidate !== correctText && !unique.includes(candidate)) unique.push(candidate);
    }
    let offset = 1;
    const nonnumericFallbacks = [
      "No real value satisfies the conditions.",
      "Infinitely many real values satisfy the conditions.",
      "More information is required."
    ];
    while (unique.length < 3) {
      const numericCorrect = Number(correct);
      const fallback = Number.isFinite(numericCorrect) ? String(numericCorrect + offset) : nonnumericFallbacks[offset - 1];
      if (fallback !== correctText && !unique.includes(fallback)) unique.push(fallback);
      offset += 1;
    }
    const choices = [correctText, ...unique.slice(0, 3)];
    for (let index = choices.length - 1; index > 0; index -= 1) {
      const target = int(rng, 0, index);
      [choices[index], choices[target]] = [choices[target], choices[index]];
    }
    return { choices, answer: choices.indexOf(correctText) };
  }

  function mcq(ctx, details) {
    const choiceData = shuffledChoices(ctx.rng, details.correct, details.distractors);
    return finish(ctx, { ...details, ...choiceData, type: "mcq" });
  }

  function conceptual(ctx, details) {
    return mcq(ctx, details);
  }

  function numeric(ctx, details) {
    const canUseSpr = details.spr !== false && ctx.index % 2 === 1;
    if (!canUseSpr) return mcq(ctx, details);
    const display = String(details.correct);
    const accepted = details.accepted || [display];
    return finish(ctx, { ...details, type: "spr", accepted, answerDisplay: display });
  }

  function finish(ctx, details) {
    const common = {
      id: `math-${ctx.skill.slug}-${ctx.setId}-${String(ctx.index + 1).padStart(2, "0")}`,
      section: "Math",
      domain: ctx.skill.domain,
      skill: ctx.skill.name,
      difficulty: ctx.difficulty,
      stimulus: cleanMathText(details.stimulus || ""),
      question: cleanMathText(details.question),
      explanation: cleanMathText(details.explanation),
      type: details.type,
      meta: {
        recipe: `${ctx.skill.slug}/${details.recipe}`,
        generationVersion: GENERATOR_VERSION,
        seed: ctx.seed,
        variant: ctx.index + 1,
        parameters: details.parameters || {}
      }
    };
    if (details.table) common.table = details.table;
    if (details.figure) common.figure = details.figure;
    if (details.type === "mcq") {
      common.choices = details.choices.map(cleanMathText);
      common.answer = details.answer;
    } else {
      common.accepted = details.accepted;
      common.answerDisplay = details.answerDisplay;
    }
    return common;
  }

  function linearEquationsOne(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 5;
    const tierMode = index % 3;
    if (difficulty === "Easy" && tierMode === 1) {
      const x = int(rng, -8, 12);
      const a = nonzero(rng, 2, 9);
      const b = int(rng, -12, 12);
      const c = a * x + b;
      return numeric(ctx, {
        recipe: "solve-then-evaluate", stimulus: `In the equation ${linearText(a, "x", b)} = ${c}, x has one value.`,
        question: `What is the value of x + ${Math.abs(b) + 1}?`, correct: x + Math.abs(b) + 1,
        distractors: [x, c, a + b],
        explanation: `Solving ${linearText(a, "x", b)} = ${c} gives x = ${x}. Adding ${Math.abs(b) + 1} gives ${x + Math.abs(b) + 1}; stopping at x = ${x} answers a question that was not asked.`,
        parameters: { a, b, c, x, shift: Math.abs(b) + 1 }
      });
    }
    if (difficulty === "Easy" && tierMode === 2) {
      const x = int(rng, 2, 14);
      const perUnit = int(rng, 3, 12);
      const fixed = int(rng, 5, 40);
      const total = perUnit * x + fixed;
      const goods = pick(rng, ["boxes", "tickets", "gallons", "lessons", "panels"]);
      return numeric(ctx, {
        recipe: "context-one-step", stimulus: `An order costs a flat $${fixed} plus $${perUnit} for each of the ${goods} purchased, and the total is $${total}.`,
        question: `How many ${goods} were purchased?`, correct: x,
        distractors: [total - fixed, total, fixed],
        explanation: `Subtract the flat charge: ${total} − ${fixed} = ${total - fixed} is spent on the ${goods}. Dividing by the $${perUnit} each gives ${x}.`,
        parameters: { perUnit, fixed, total, x }
      });
    }
    if (difficulty === "Easy") {
      const x = int(rng, -9, 12);
      const a = nonzero(rng, 2, 9);
      const b = int(rng, -12, 12);
      const c = a * x + b;
      return numeric(ctx, {
        recipe: "two-step-solve", question: `What is the solution to ${linearText(a, "x", b)} = ${c}?`, correct: x,
        distractors: [c - b, (c + b) / a, x + Math.sign(b || 1)],
        explanation: `Subtract ${b} from both sides and divide by ${a}. This gives x = (${c} − (${b}))/${a} = ${x}.`, parameters: { a, b, c, x }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      const x = int(rng, -7, 11);
      const a = nonzero(rng, 2, 8);
      const d = nonzero(rng, -6, 6);
      const b = int(rng, -8, 8);
      const c = a * (x + d) + b;
      return numeric(ctx, {
        recipe: "distribution-solve", question: `What is the solution to ${a}(x ${signedTerm(d)}) ${signedTerm(b)} = ${c}?`, correct: x,
        distractors: [x + d, x - d, c - a * d - b],
        explanation: `Distribute ${a}, isolate the x-term, and divide by ${a}. The resulting value is x = ${x}.`, parameters: { a, b, c, d, x }
      });
    }
    if (difficulty === "Medium") {
      const rate = int(rng, 4, 12);
      const fee = int(rng, 8, 30);
      const hours = int(rng, 3, 10);
      const total = rate * hours + fee;
      return numeric(ctx, {
        recipe: "context-create-solve", stimulus: `A rental shop charges a fixed fee of $${fee} plus $${rate} per hour. A customer pays $${total}.`,
        question: "For how many hours did the customer rent the item?", correct: hours,
        distractors: [total / rate, (total + fee) / rate, total - fee],
        explanation: `The situation is ${rate}h + ${fee} = ${total}. Subtracting ${fee} and dividing by ${rate} gives h = ${hours}.`, parameters: { rate, fee, total, hours }
      });
    }
    if (mode < 2) {
      const a = nonzero(rng, 2, 9);
      const b = int(rng, -15, 15);
      const relation = mode === 0 ? "no solution" : "infinitely many solutions";
      const rightConstant = mode === 0 ? b + nonzero(rng, 1, 5) : b;
      return conceptual(ctx, {
        recipe: "number-of-solutions", question: `How many solutions does ${linearText(a, "x", b)} = ${linearText(a, "x", rightConstant)} have?`,
        correct: relation, distractors: ["exactly one solution", mode === 0 ? "infinitely many solutions" : "no solution", "exactly two solutions"],
        explanation: `The x-terms cancel. The remaining statement is ${b} = ${rightConstant}, which is ${mode === 0 ? "false for every x" : "true for every x"}; therefore, the equation has ${relation}.`, parameters: { a, b, rightConstant }
      });
    }
    if (mode === 4) {
      const q = nonzero(rng, 2, 9);
      const p = int(rng, -12, 12);
      const r = p + nonzero(rng, 1, 8);
      return numeric(ctx, {
        recipe: "no-solution-parameter",
        question: `In the equation ax ${signedTerm(p)} = ${q}x ${signedTerm(r)}, a is a constant. If the equation has no solution, what is the value of a?`,
        correct: q, distractors: [q + 1, r - p, -q],
        explanation: `Collecting the x-terms gives (a − ${q})x = ${r - p}. Because ${r - p} is not zero, no value of x can satisfy the equation exactly when a − ${q} = 0, so a = ${q}.`,
        parameters: { q, p, r }
      });
    }
    const x = int(rng, -8, 10);
    const a = nonzero(rng, 2, 7);
    const d = nonzero(rng, -8, 8);
    let e = nonzero(rng, -6, 6);
    while (e === a) e = nonzero(rng, -6, 6);
    const c = a * (x + d) - e * x;
    return numeric(ctx, {
      recipe: "variables-both-sides", question: `What is the solution to ${a}(x ${signedTerm(d)}) = ${linearText(e, "x", c)}?`, correct: x,
      distractors: [x + d, -x, x + Math.sign(d)],
      explanation: `After distributing and collecting x-terms, (${a} − (${e}))x = ${c} − ${a * d}. Solving gives x = ${x}.`, parameters: { a, c, d, e, x }
    });
  }

  function linearFunctions(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 5;
    const m = nonzero(rng, -7, 8);
    const b = int(rng, -12, 15);
    if (difficulty === "Easy") {
      const x = int(rng, -5, 8);
      const y = m * x + b;
      return numeric(ctx, {
        recipe: mode % 2 ? "evaluate" : "slope-intercept", question: mode % 2 ? `For f(x) = ${linearText(m, "x", b)}, what is f(${x})?` : `What is the slope of the graph of y = ${linearText(m, "x", b)}?`,
        correct: mode % 2 ? y : m, distractors: mode % 2 ? [m + x + b, m * x - b, y + m] : [b, -m, fraction(1, m)],
        explanation: mode % 2 ? `Substitute ${x} for x: f(${x}) = ${m}(${x}) + (${b}) = ${y}.` : `In y = mx + b, m is the slope. Here m = ${m}.`, parameters: { m, b, x, y }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      const x1 = int(rng, -6, 2);
      const step = int(rng, 2, 7);
      const x2 = x1 + step;
      const y1 = m * x1 + b;
      const y2 = m * x2 + b;
      return numeric(ctx, {
        recipe: "slope-from-points", stimulus: `A linear function f satisfies f(${x1}) = ${y1} and f(${x2}) = ${y2}.`,
        question: "What is the slope of the graph of y = f(x)?", correct: m,
        distractors: [y2 - y1, fraction(step, y2 - y1), m + b],
        explanation: `Slope is change in output divided by change in input: (${y2} − (${y1}))/(${x2} − (${x1})) = ${m}.`, parameters: { m, b, x1, x2, y1, y2 }
      });
    }
    if (difficulty === "Medium" && mode === 3) {
      const m = nonzero(rng, 2, 7);
      const b = int(rng, -10, 10);
      const x = int(rng, -6, 9);
      const value = m * x + b;
      return numeric(ctx, {
        recipe: "solve-for-input", stimulus: `The linear function f is defined by f(x) = ${linearText(m, "x", b)}.`,
        question: `For what value of x does f(x) = ${value}?`, correct: x,
        distractors: [value, value - b, m + b],
        explanation: `Set ${linearText(m, "x", b)} equal to ${value}. ${b < 0 ? `Adding ${-b}` : `Subtracting ${b}`} gives ${m}x = ${value - b}, so x = ${x}.`,
        parameters: { m, b, x, value }
      });
    }
    if (difficulty === "Medium") {
      const rate = int(rng, 5, 20);
      const initial = int(rng, 20, 100);
      return conceptual(ctx, {
        recipe: "interpret-parameter", stimulus: `The function C(t) = ${rate}t + ${initial} gives a service's total charge, in dollars, for t hours.`,
        question: `What does ${initial} represent in this context?`, correct: "The fixed charge before any hourly charges",
        distractors: ["The charge for each hour", "The number of hours included for free", `The total charge for ${initial} hours`],
        explanation: `The constant term is C(0), so $${initial} is the charge when zero hours are used: the fixed initial charge.`, parameters: { rate, initial }
      });
    }
    if (mode < 3) {
      const x1 = int(rng, -5, 4);
      const x2 = x1 + int(rng, 2, 6);
      const y1 = m * x1 + b;
      const y2 = m * x2 + b;
      const equationDistractors = [
        `f(x) = ${linearText(-m, "x", b + 1)}`,
        `f(x) = ${linearText(m + Math.sign(m), "x", b)}`,
        `f(x) = ${linearText(m, "x", b + Math.sign(b || 1))}`
      ];
      return conceptual(ctx, {
        recipe: "equation-from-values", stimulus: `The function f is linear, and f(${x1}) = ${y1} and f(${x2}) = ${y2}.`,
        question: "Which equation defines f?", correct: `f(x) = ${linearText(m, "x", b)}`,
        distractors: equationDistractors,
        explanation: `The slope is (${y2} − (${y1}))/(${x2} − (${x1})) = ${m}. Substituting (${x1}, ${y1}) gives the intercept ${b}.`, parameters: { m, b, x1, x2, y1, y2 }
      });
    }
    if (mode === 4) {
      const start = int(rng, 12, 40) * 10;
      const rate = pick(rng, [5, 8, 10, 12, 15, 20]);
      return conceptual(ctx, {
        recipe: "model-parameter-meaning",
        stimulus: `The function P is defined by P(t) = ${start} − ${rate}t, where P(t) is the number of unsold tickets t days after a show goes on sale.`,
        question: `Which of the following is the best interpretation of ${rate} in this context?`,
        correct: "The number of tickets sold each day",
        distractors: ["The number of tickets that were unsold when the show went on sale", "The number of days it takes for every ticket to be sold", "The total number of tickets sold over the whole period"],
        explanation: `P falls by ${rate} for each increase of 1 in t, so ${rate} is the number of tickets sold per day. The value ${start} is the number unsold when t = 0.`,
        parameters: { start, rate }
      });
    }
    const k = int(rng, -10, 10);
    const leftB = int(rng, -15, 15);
    const rightB = (m - 2) * k + leftB;
    return numeric(ctx, {
      recipe: "intersect-linear-rules", stimulus: `The linear function f is defined by f(x) = ${linearText(m, "x", leftB)}.`,
      question: `For what value of k is f(k) = ${linearText(2, "k", rightB)}?`, correct: k,
      distractors: [-k, rightB - leftB, fraction(rightB - leftB, m + 2)],
      explanation: `Set ${linearText(m, "k", leftB)} equal to ${linearText(2, "k", rightB)} and solve. This gives k = ${k}.`, parameters: { m, leftB, rightB, k }
    });
  }

  function linearEquationsTwo(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 5;
    const a = nonzero(rng, -8, 9);
    const b = nonzero(rng, -8, 9);
    const x = int(rng, -6, 8);
    const y = int(rng, -6, 8);
    const c = a * x + b * y;
    if (difficulty === "Easy") {
      return numeric(ctx, {
        recipe: "substitute-coordinate", question: `The point (${x}, y) lies on the line ${a}x ${signedTerm(b, "y")} = ${c}. What is the value of y?`, correct: y,
        distractors: [c - a * x, fraction(c - b * x, a), -y],
        explanation: `Substitute x = ${x}: ${a}(${x}) + ${b}y = ${c}. Solving gives y = ${y}.`, parameters: { a, b, c, x, y }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      const slope = fraction(-a, b);
      return conceptual(ctx, {
        recipe: "standard-form-slope", question: `What is the slope of the line ${a}x ${signedTerm(b, "y")} = ${c}?`, correct: slope,
        distractors: [fraction(a, b), fraction(-b, a), fraction(b, a)],
        explanation: `Solving for y gives y = (${fraction(-a, b)})x + ${fraction(c, b)}, so the slope is ${slope}.`, parameters: { a, b, c }
      });
    }
    if (difficulty === "Medium") {
      const sideA = int(rng, 3, 9);
      const sideB = int(rng, 4, 11);
      const countA = int(rng, 5, 14);
      const countB = int(rng, 5, 14);
      const total = sideA * countA + sideB * countB;
      return conceptual(ctx, {
        recipe: "coefficient-in-context", stimulus: `Regular polygon A has x sides of length ${sideA} cm. Regular polygon B has y sides of length ${sideB} cm. Their combined perimeter is ${total} cm, so ${sideA}x + ${sideB}y = ${total}.`,
        question: `What does ${sideB} represent?`, correct: "The length, in centimeters, of each side of polygon B",
        distractors: ["The number of sides of polygon B", "The perimeter of polygon B", "The length, in centimeters, of each side of polygon A"],
        explanation: `Because y counts the sides of polygon B, ${sideB}y is its perimeter. Thus ${sideB} is the length of each side.`, parameters: { sideA, sideB, total }
      });
    }
    if (mode === 4) {
      const slope = nonzero(rng, -4, 5);
      const x1 = nonzero(rng, -5, 3);
      const y1 = int(rng, -6, 8);
      const step = int(rng, 1, 4);
      const x2 = x1 + step;
      const y2 = y1 + slope * step;
      const intercept = y1 - slope * x1;
      return conceptual(ctx, {
        recipe: "line-through-two-points",
        stimulus: `Line k passes through the points (${x1}, ${y1}) and (${x2}, ${y2}) in the xy-plane.`,
        question: "Which equation represents line k?",
        correct: `y = ${linearText(slope, "x", intercept)}`,
        distractors: [`y = ${linearText(-slope, "x", intercept)}`, `y = ${linearText(slope, "x", y1)}`, `y = ${linearText(slope + 1, "x", intercept)}`],
        explanation: `The slope is (${y2} − (${y1}))/(${x2} − (${x1})) = ${slope}. Substituting (${x1}, ${y1}) gives an intercept of ${intercept}.`,
        parameters: { slope, x1, y1, x2, y2, intercept }
      });
    }
    const m = nonzero(rng, -6, 7);
    const px = nonzero(rng, -5, 6);
    const py = int(rng, -5, 6);
    const intercept = py - m * px;
    const targetSlope = mode < 3 ? String(m) : fraction(-1, m);
    const relationship = mode < 3 ? "parallel" : "perpendicular";
    return conceptual(ctx, {
      recipe: `${relationship}-line`, stimulus: `Line ℓ has slope ${m}. Line n passes through (${px}, ${py}) and is ${relationship} to ℓ.`,
      question: "Which equation represents line n?", correct: `y − (${py}) = ${coefficientText(targetSlope)}(x − (${px}))`,
      distractors: [`y − (${py}) = ${coefficientText(fraction(1, m))}(x − (${px + 1}))`, `y − (${py + 1}) = ${coefficientText(targetSlope)}(x − (${px}))`, `y − (${py}) = ${coefficientText(targetSlope)}(x + (${px}))`],
      explanation: `A ${relationship} line has slope ${targetSlope}. Point-slope form through (${px}, ${py}) is y − (${py}) = ${targetSlope}(x − (${px})).`, parameters: { m, px, py, targetSlope }
    });
  }

  function linearSystems(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 5;
    const tierMode = index % 4;
    if (difficulty === "Easy" && tierMode === 0) {
      const x = int(rng, -5, 9);
      const y = int(rng, -5, 9);
      const sum = x + y;
      const difference = x - y;
      return numeric(ctx, {
        recipe: "add-subtract-system", question: `The solution to the system x + y = ${sum} and x − y = ${difference} is (x, y). What is x?`, correct: x,
        distractors: [y, sum + difference, fraction(sum - difference, 2)],
        explanation: `Adding the equations gives 2x = ${sum + difference}, so x = ${x}.`, parameters: { x, y, sum, difference }
      });
    }
    if (difficulty === "Easy" && tierMode === 1) {
      const x = int(rng, -4, 8);
      const y = int(rng, -4, 8);
      const a = nonzero(rng, 2, 5);
      const b = nonzero(rng, 2, 5);
      return conceptual(ctx, {
        recipe: "verify-ordered-pair",
        stimulus: `Consider the system x + y = ${x + y} and ${a}x ${signedTerm(b, "y")} = ${a * x + b * y}.`,
        question: "Which ordered pair is the solution to the system?", correct: `(${x}, ${y})`,
        distractors: [`(${y}, ${x})`, `(${x + 1}, ${y - 1})`, `(${-x}, ${-y})`],
        explanation: `Substituting x = ${x} and y = ${y} satisfies both equations: ${x} ${signedTerm(y)} = ${x + y}, and ${a}(${x}) ${signedTerm(b)}(${y}) = ${a * x + b * y}. The reversed pair (${y}, ${x}) fails the second equation unless the coefficients happen to match.`,
        parameters: { x, y, a, b }
      });
    }
    if (difficulty === "Easy" && tierMode === 2) {
      const m = nonzero(rng, 2, 6);
      const b = int(rng, -9, 9);
      const x = int(rng, -5, 8);
      const known = m * x + b;
      return numeric(ctx, {
        recipe: "substitution-known-y", question: `The system y = ${linearText(m, "x", b)} and y = ${known} has one solution. What is the value of x?`, correct: x,
        distractors: [known, known - b, m + b],
        explanation: `Both equations give y, so ${linearText(m, "x", b)} = ${known}. ${b < 0 ? `Adding ${-b}` : `Subtracting ${b}`} and dividing by ${m} gives x = ${x}.`,
        parameters: { m, b, x, known }
      });
    }
    if (difficulty === "Easy") {
      const a = nonzero(rng, 2, 6);
      const b = nonzero(rng, 2, 6);
      const x = int(rng, -6, 8);
      const y = int(rng, -6, 8);
      const total = a * x + b * y;
      return numeric(ctx, {
        recipe: "one-variable-known", stimulus: `In a system of equations, ${a}x ${signedTerm(b, "y")} = ${total} and y = ${y}.`,
        question: "What is the value of x?", correct: x,
        distractors: [y, total - b * y, total],
        explanation: `Substitute y = ${y} into the first equation: ${a}x ${signedTerm(b * y)} = ${total}, so ${a}x = ${total - b * y} and x = ${x}.`,
        parameters: { a, b, x, y, total }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      const adults = int(rng, 20, 80);
      const students = int(rng, 30, 100);
      const adultPrice = int(rng, 10, 18);
      const studentPrice = int(rng, 4, 9);
      const count = adults + students;
      const revenue = adultPrice * adults + studentPrice * students;
      return numeric(ctx, {
        recipe: "context-system", stimulus: `At an event, adult tickets cost $${adultPrice} and student tickets cost $${studentPrice}. In total, ${count} tickets were sold for $${revenue}.`,
        question: "How many adult tickets were sold?", correct: adults,
        distractors: [students, Math.round(revenue / adultPrice), count - adults + 1],
        explanation: `Let a and s be the ticket counts. Solving a + s = ${count} and ${adultPrice}a + ${studentPrice}s = ${revenue} gives a = ${adults}.`, parameters: { adults, students, adultPrice, studentPrice, count, revenue }
      });
    }
    if (difficulty === "Medium") {
      const x = int(rng, -5, 7);
      const y = int(rng, -5, 7);
      const a = nonzero(rng, 2, 6);
      const b = nonzero(rng, -5, 5);
      const d = nonzero(rng, 2, 7);
      const e = nonzero(rng, -6, 6);
      const c = a * x + b * y;
      const f = d * x + e * y;
      return numeric(ctx, {
        recipe: "elimination-system", question: `The system ${a}x ${signedTerm(b, "y")} = ${c} and ${d}x ${signedTerm(e, "y")} = ${f} has solution (x, y). What is x + y?`, correct: x + y,
        distractors: [x - y, x, y],
        explanation: `Eliminating one variable gives x = ${x} and y = ${y}; therefore, x + y = ${x + y}.`, parameters: { a, b, c, d, e, f, x, y }
      });
    }
    if (mode === 4) {
      const p = int(rng, 2, 5);
      const q = p + int(rng, 1, 3);
      const x = int(rng, -6, 8);
      const y = int(rng, -6, 8);
      const m = p * x + q * y;
      const n = q * x + p * y;
      return numeric(ctx, {
        recipe: "symmetric-sum",
        question: `If ${p}x ${signedTerm(q, "y")} = ${m} and ${q}x ${signedTerm(p, "y")} = ${n}, what is the value of x + y?`,
        correct: x + y, distractors: [x - y, m + n, x],
        explanation: `Adding the two equations gives ${p + q}x + ${p + q}y = ${m + n}. Dividing by ${p + q} gives x + y = ${x + y}.`,
        parameters: { p, q, m, n, x, y }
      });
    }
    if (mode === 3) {
      const d = int(rng, 2, 6);
      const e = int(rng, 2, 6);
      const t = int(rng, 2, 4);
      const bCoef = e * t;
      const kValue = d * t;
      const f = nonzero(rng, -12, 12);
      const c = f * t + nonzero(rng, 1, 4);
      return numeric(ctx, {
        recipe: "no-solution-coefficient",
        stimulus: `In the system kx ${signedTerm(bCoef, "y")} = ${c} and ${d}x ${signedTerm(e, "y")} = ${f}, k is a constant.`,
        question: "If the system has no solution, what is the value of k?",
        correct: kValue, distractors: [d, t, -kValue],
        explanation: `Two lines have no common point when they are parallel and distinct. Matching the coefficient ratios requires k/${d} = ${bCoef}/${e} = ${t}, so k = ${kValue}.`,
        parameters: { d, e, t, bCoef, kValue, c, f }
      });
    }
    const a = nonzero(rng, 2, 8);
    const b = nonzero(rng, -7, 7);
    const c = int(rng, -20, 20);
    const factor = int(rng, 2, 5);
    const infinite = mode % 2 === 0;
    const secondC = c * factor + (infinite ? 0 : nonzero(rng, 1, 5));
    const result = infinite ? "infinitely many solutions" : "no solution";
    return conceptual(ctx, {
      recipe: "dependent-or-inconsistent", question: `How many solutions does the system ${a}x ${signedTerm(b, "y")} = ${c} and ${a * factor}x ${signedTerm(b * factor, "y")} = ${secondC} have?`,
      correct: result, distractors: [infinite ? "no solution" : "infinitely many solutions", "exactly one solution", "exactly two solutions"],
      explanation: `The second equation's left side is ${factor} times the first. Its constant is ${infinite ? "also" : "not"} ${factor} times the first constant, so the lines ${infinite ? "coincide" : "are parallel and distinct"}.`, parameters: { a, b, c, factor, secondC }
    });
  }

  function linearInequalities(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 5;
    const tierMode = index % 4;
    if (difficulty === "Easy" && tierMode === 0) {
      const boundary = nonzero(rng, -8, 12);
      const a = int(rng, 2, 8);
      const b = int(rng, -12, 12);
      const c = a * boundary + b;
      return conceptual(ctx, {
        recipe: "solve-one-variable", question: `Which inequality is equivalent to ${linearText(a, "x", b)} > ${c}?`, correct: `x > ${boundary}`,
        distractors: [`x < ${boundary}`, `x > ${c - b}`, `x < ${c - b}`],
        explanation: `Subtract ${b} and divide by the positive number ${a}, which preserves the inequality direction: x > ${boundary}.`, parameters: { a, b, c, boundary }
      });
    }
    if (difficulty === "Easy" && tierMode === 1) {
      const boundary = int(rng, -6, 12);
      const a = int(rng, 2, 6);
      const b = int(rng, -12, 12);
      const c = a * boundary + b;
      return numeric(ctx, {
        recipe: "least-integer-solution", stimulus: `Consider the inequality ${linearText(a, "x", b)} > ${c}.`,
        question: "What is the least integer value of x that satisfies the inequality?", correct: boundary + 1,
        distractors: [boundary, boundary + 2, c - b],
        explanation: `Subtract ${b} and divide by ${a} to get x > ${boundary}. Because the inequality is strict, x = ${boundary} does not satisfy it, so the least integer that does is ${boundary + 1}.`,
        parameters: { a, b, c, boundary }
      });
    }
    if (difficulty === "Easy" && tierMode === 2) {
      const a = int(rng, 2, 6);
      const b = int(rng, -8, 8);
      const boundary = int(rng, 3, 12);
      const c = a * boundary + b;
      const offset = int(rng, 1, 3);
      const satisfying = boundary - offset;
      return numeric(ctx, {
        recipe: "test-value", stimulus: `Consider the inequality ${linearText(a, "x", b)} ≤ ${c}.`,
        question: "Which value of x satisfies the inequality?", correct: satisfying, spr: false,
        distractors: [boundary + 1, boundary + 2, boundary + 3],
        explanation: `Solving gives x ≤ ${boundary}. Of the choices, only ${satisfying} is at most ${boundary}; substituting it gives ${a}(${satisfying}) ${signedTerm(b)} = ${a * satisfying + b}, which is at most ${c}.`,
        parameters: { a, b, c, boundary, offset, satisfying }
      });
    }
    if (difficulty === "Easy") {
      const price = pick(rng, [4, 5, 6, 8, 12]);
      const budget = price * int(rng, 6, 20);
      const goods = pick(rng, ["shirts", "posters", "tickets", "planters", "trophies"]);
      return conceptual(ctx, {
        recipe: "translate-context", stimulus: `A club has $${budget} to spend on ${goods} that cost $${price} each and cannot spend more than it has.`,
        question: `Which inequality represents the possible numbers n of ${goods} the club can buy?`, correct: `${price}n ≤ ${budget}`,
        distractors: [`${price}n ≥ ${budget}`, `n + ${price} ≤ ${budget}`, `${budget}n ≤ ${price}`],
        explanation: `Each of the n ${goods} costs $${price}, so the club spends ${price}n dollars, and that total can be at most the $${budget} available: ${price}n ≤ ${budget}.`,
        parameters: { price, budget, goods }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      const m = nonzero(rng, -5, 6);
      const b = int(rng, -8, 9);
      const validX = int(rng, -5, 5);
      const boundaryY = m * validX + b;
      const validY = boundaryY - int(rng, 1, 5);
      return conceptual(ctx, {
        recipe: "test-point-two-variable", question: `Which point is a solution to y < ${linearText(m, "x", b)}?`, correct: `(${validX}, ${validY})`,
        distractors: [`(${validX}, ${boundaryY})`, `(${validX}, ${boundaryY + 2})`, `(${-validX}, ${m * -validX + b + 1})`],
        explanation: `For (${validX}, ${validY}), the right side is ${boundaryY}, and ${validY} < ${boundaryY}. A point on the boundary is not included because the inequality is strict.`, parameters: { m, b, validX, validY }
      });
    }
    if (difficulty === "Medium") {
      const capacity = int(rng, 1200, 2400);
      const fixed = int(rng, 200, 500);
      const weight = pick(rng, [40, 50, 60, 75, 80]);
      const maximum = Math.floor((capacity - fixed) / weight);
      return numeric(ctx, {
        recipe: "context-maximum", stimulus: `A vehicle can carry at most ${capacity} kg. Its driver and equipment weigh ${fixed} kg, and each crate weighs ${weight} kg.`,
        question: "What is the greatest number of whole crates the vehicle can carry?", correct: maximum,
        distractors: [Math.ceil((capacity - fixed) / weight), Math.floor(capacity / weight), maximum - 1],
        explanation: `Solve ${fixed} + ${weight}c ≤ ${capacity}. This gives c ≤ ${(capacity - fixed) / weight}; the greatest whole-number value is ${maximum}.`, parameters: { capacity, fixed, weight, maximum }
      });
    }
    if (mode === 4) {
      const a = int(rng, 2, 8);
      const k = nonzero(rng, -6, 8);
      const c = int(rng, -20, 20);
      const b = c - a * k;
      return numeric(ctx, {
        recipe: "boundary-parameter",
        stimulus: `In the inequality ${a}x + b > ${c}, b is a constant.`,
        question: `If the solution to the inequality is x > ${k}, what is the value of b?`,
        correct: b, distractors: [-b, c - k, a * k],
        explanation: `Solving gives x > (${c} − b)/${a}. Setting (${c} − b)/${a} = ${k} gives b = ${c} − ${a}(${k}) = ${b}.`,
        parameters: { a, k, c, b }
      });
    }
    if (mode === 3) {
      const m1 = int(rng, 1, 3);
      const b1 = int(rng, -6, 2);
      const m2 = -int(rng, 1, 3);
      const b2 = b1 + int(rng, 4, 9);
      const lo = b1;
      const hi = b2;
      const y0 = lo + 1 + int(rng, 0, Math.max(0, hi - lo - 2));
      return conceptual(ctx, {
        recipe: "system-of-inequalities",
        stimulus: `A system of inequalities is given by y > ${linearText(m1, "x", b1)} and y < ${linearText(m2, "x", b2)}.`,
        question: "Which point is a solution to the system?",
        correct: `(0, ${y0})`,
        distractors: [`(0, ${lo - 1})`, `(0, ${hi + 1})`, `(0, ${lo})`],
        explanation: `At x = 0 the system requires y > ${lo} and y < ${hi}. The value ${y0} satisfies both; the other points fall on or outside a boundary.`,
        parameters: { m1, b1, m2, b2, y0 }
      });
    }
    const boundary = nonzero(rng, -6, 9);
    const negative = -int(rng, 2, 8);
    const b = int(rng, -10, 10);
    const c = negative * boundary + b;
    return conceptual(ctx, {
      recipe: "negative-coefficient", question: `Which inequality is equivalent to ${linearText(negative, "x", b)} ≥ ${c}?`, correct: `x ≤ ${boundary}`,
      distractors: [`x ≥ ${boundary}`, `x ≤ ${-boundary}`, `x ≥ ${-boundary}`],
      explanation: `After isolating ${negative}x, divide by the negative coefficient ${negative}; this reverses the inequality, giving x ≤ ${boundary}.`, parameters: { negative, b, c, boundary }
    });
  }

  function equivalentExpressions(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 5;
    if (difficulty === "Easy") {
      if (mode === 1) {
        const factor = int(rng, 2, 9);
        const a = int(rng, 2, 8);
        const b = nonzero(rng, -8, 8);
        return conceptual(ctx, {
          recipe: "factor-common-factor", question: `Which expression is equivalent to ${factor * a}x² ${signedTerm(factor * b, "x")}?`,
          correct: `${factor}x(${a}x ${signedTerm(b)})`,
          distractors: [`${factor}(${a}x² ${signedTerm(b, "x")})`, `${factor}x(${a}x ${signedTerm(-b)})`, `x(${factor * a}x ${signedTerm(b)})`],
          explanation: `Both terms share the factor ${factor}x. Factoring it out gives ${factor}x(${a}x + (${b})).`, parameters: { factor, a, b }
        });
      }
      if (mode === 2) {
        const a = int(rng, 2, 9);
        const b = int(rng, 2, 12);
        return conceptual(ctx, {
          recipe: "difference-of-squares", question: `Which expression is equivalent to ${a * a}x² − ${b * b}?`,
          correct: `(${a}x − ${b})(${a}x + ${b})`,
          distractors: [`(${a}x − ${b})²`, `(${a}x + ${b})²`, `(${a}x − ${b})(${a}x − ${b})`],
          explanation: `This is a difference of squares: (${a}x)² − ${b}² = (${a}x − ${b})(${a}x + ${b}).`, parameters: { a, b }
        });
      }
      if (mode === 3) {
        const a = int(rng, 2, 8);
        const b = nonzero(rng, -9, 9);
        const c = nonzero(rng, -9, 9);
        return conceptual(ctx, {
          recipe: "combine-polynomials", question: `Which expression is equivalent to (${a}x² ${signedTerm(b, "x")}) + (${a + 1}x² ${signedTerm(c, "x")})?`,
          correct: `${2 * a + 1}x² ${signedTerm(b + c, "x")}`,
          distractors: [`${2 * a + 1}x² ${signedTerm(b * c, "x")}`, `${a * (a + 1)}x⁴ ${signedTerm(b + c, "x")}`, `${2 * a}x² ${signedTerm(b + c, "x")}`],
          explanation: `Combine like terms: (${a} + ${a + 1})x² = ${2 * a + 1}x² and (${b} + ${c})x = ${b + c}x.`, parameters: { a, b, c }
        });
      }
      const p = nonzero(rng, -9, 9);
      const q = nonzero(rng, -9, 9);
      const sum = p + q;
      const product = p * q;
      return conceptual(ctx, {
        recipe: "factor-monic-quadratic", question: `Which expression is equivalent to x² ${signedTerm(sum, "x")} ${signedTerm(product)}?`, correct: `(x ${signedTerm(p)})(x ${signedTerm(q)})`,
        distractors: [`x² ${signedTerm(-sum, "x")} ${signedTerm(product)}`, `x² ${signedTerm(sum, "x")} ${signedTerm(-product)}`, `x² ${signedTerm(product, "x")} ${signedTerm(sum)}`],
        explanation: `The constants ${p} and ${q} add to ${sum} and multiply to ${product}, so the expression factors as (x + (${p}))(x + (${q})).`, parameters: { p, q }
      });
    }
    if (difficulty === "Medium" && mode === 0) {
      const p = int(rng, 4, 9);
      const q = int(rng, 2, 3);
      const coefficient = int(rng, 2, 6);
      return conceptual(ctx, {
        recipe: "exponent-product", question: `Which expression is equivalent to (${coefficient}x^${p})(x^${q})?`, correct: `${coefficient}x^${p + q}`,
        distractors: [`${coefficient}x^${p * q}`, `${coefficient}x^${p - q}`, `${coefficient * coefficient}x^${p + q}`],
        explanation: `Multiplying powers of the same base adds the exponents: x^${p} · x^${q} = x^${p + q}. The coefficient ${coefficient} is multiplied by 1, so it is unchanged.`,
        parameters: { coefficient, p, q }
      });
    }
    if (difficulty === "Medium" && mode === 1) {
      const outer = int(rng, 2, 6);
      const inner = int(rng, 2, 8);
      const constant = int(rng, 2, 9);
      // A distractor uses inner − subtracted, so an equal pair would print "0x".
      let subtracted = int(rng, 2, 8);
      while (subtracted === inner) subtracted = int(rng, 2, 8);
      return conceptual(ctx, {
        recipe: "distribute-and-combine",
        question: `Which expression is equivalent to ${outer}(${inner}x + ${constant}) − ${subtracted}x?`,
        correct: linearText(outer * inner - subtracted, "x", outer * constant),
        distractors: [
          linearText(outer * inner + subtracted, "x", outer * constant),
          linearText(outer * inner - subtracted, "x", constant),
          linearText(inner - subtracted, "x", outer * constant)
        ],
        explanation: `Distribute first: ${outer}(${inner}x + ${constant}) = ${outer * inner}x + ${outer * constant}. Subtracting ${subtracted}x leaves ${linearText(outer * inner - subtracted, "x", outer * constant)}; the constant is multiplied by ${outer} as well.`,
        parameters: { outer, inner, constant, subtracted }
      });
    }
    if (difficulty === "Medium" && mode < 4) {
      const a = int(rng, 2, 7);
      const b = nonzero(rng, -8, 8);
      const c = nonzero(rng, -7, 7);
      return conceptual(ctx, {
        recipe: "expand-binomial", question: `Which expression is equivalent to (${a}x ${signedTerm(b)})(x ${signedTerm(c)})?`,
        correct: `${a}x² ${signedTerm(a * c + b, "x")} ${signedTerm(b * c)}`,
        distractors: [`${a}x² ${signedTerm(a * c, "x")} ${signedTerm(b * c)}`, `${a}x² ${signedTerm(a * c - b, "x")} ${signedTerm(b * c)}`, `${a}x² ${signedTerm(a * c + b, "x")} ${signedTerm(-b * c)}`],
        explanation: `Distribute each term. The middle coefficient is ${a}(${c}) + (${b}) = ${a * c + b}, and the constant is (${b})(${c}) = ${b * c}.`, parameters: { a, b, c }
      });
    }
    if (difficulty === "Medium") {
      const base = pick(rng, [2, 3, 5, 7]);
      const p = int(rng, 3, 9);
      const q = int(rng, 2, p - 1);
      return conceptual(ctx, {
        recipe: "exponent-quotient", question: `Which expression is equivalent to (${base}x^${p})/(${base}x^${q}), for x ≠ 0?`, correct: `x^${p - q}`,
        distractors: [`x^${p + q}`, `x^${p * q}`, `${base}x^${p - q}`],
        explanation: `The numerical factors cancel, and dividing like bases means subtracting exponents: x^(${p} − ${q}) = x^${p - q}.`, parameters: { base, p, q }
      });
    }
    if (mode < 3) {
      const a = int(rng, 2, 7);
      const b = int(rng, 2, 8);
      return conceptual(ctx, {
        recipe: "rational-combination", question: `For x ≠ 0, which expression is equivalent to ${a}/x + ${b}/x²?`, correct: `(${a}x + ${b})/x²`,
        distractors: [`${a + b}/x³`, `(${a} + ${b}x)/x²`, `${a + b}/x²`],
        explanation: `Rewrite ${a}/x as ${a}x/x², then add numerators to obtain (${a}x + ${b})/x².`, parameters: { a, b }
      });
    }
    if (mode === 4) {
      const h = nonzero(rng, -6, 6);
      const kValue = nonzero(rng, -20, 20);
      const bCoef = 2 * h;
      const cValue = h * h + kValue;
      return numeric(ctx, {
        recipe: "complete-the-square",
        stimulus: `The expression x² ${signedTerm(bCoef, "x")} ${signedTerm(cValue)} can be rewritten in the form (x ${signedTerm(h)})² + k, where k is a constant.`,
        question: "What is the value of k?",
        correct: kValue, distractors: [cValue, cValue - bCoef, -kValue],
        explanation: `Half of ${bCoef} is ${h}, and (x ${signedTerm(h)})² expands to x² ${signedTerm(bCoef, "x")} + ${h * h}. Subtracting ${h * h} from ${cValue} leaves k = ${kValue}.`,
        parameters: { h, kValue, bCoef, cValue }
      });
    }
    const p = int(rng, 2, 5);
    let q = int(rng, 2, 5);
    while (q === p) q = int(rng, 2, 5);
    return conceptual(ctx, {
      recipe: "rational-exponent", question: `Which radical expression is equivalent to x^(${p}/${q}) for x > 0?`, correct: `${rootName(q)} of x^${p}`,
      distractors: [`${rootName(p)} of x^${q}`, `x^${p * q}`, `${rootName(p + q)} of x`],
      explanation: `The denominator of a rational exponent is the root index: x^(${p}/${q}) = the ${rootName(q)} of x^${p}.`, parameters: { p, q }
    });
  }

  function nonlinearEquations(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 7;
    const tierMode = index % 4;
    if (difficulty === "Easy") {
      const root = int(rng, 2, 12);
      const square = root * root;
      if (tierMode === 0) {
        return conceptual(ctx, {
          recipe: "difference-of-squares", question: `Which values of x satisfy x² − ${square} = 0?`, correct: `x = −${root} and x = ${root}`,
          distractors: [`x = ${root} only`, `x = ${square} only`, `x = −${square} and x = ${square}`],
          explanation: `x² = ${square}, so x can be either square root: x = ±${root}.`, parameters: { root }
        });
      }
      if (tierMode === 1) {
        const shift = int(rng, 1, 10);
        const x = square - shift;
        return numeric(ctx, {
          recipe: "radical-basic", question: `If √(x + ${shift}) = ${root}, what is x?`, correct: x,
          distractors: [root - shift, square + shift, root + shift],
          explanation: `Square both sides to get x + ${shift} = ${square}; therefore, x = ${x}.`, parameters: { root, shift, x }
        });
      }
      if (tierMode === 2) {
        const first = int(rng, 2, 9);
        const second = int(rng, 2, 9);
        return conceptual(ctx, {
          recipe: "factored-form-roots", question: `Which values of x satisfy (x − ${first})(x + ${second}) = 0?`,
          correct: `x = ${first} and x = −${second}`,
          distractors: [`x = −${first} and x = ${second}`, `x = ${first} and x = ${second}`, `x = ${first * second} only`],
          explanation: `A product is zero when a factor is zero. x − ${first} = 0 gives x = ${first}, and x + ${second} = 0 gives x = −${second}; each root has the opposite sign of the number in its factor.`,
          parameters: { first, second }
        });
      }
      const cubeRoot = int(rng, 2, 6);
      const cube = cubeRoot ** 3;
      return numeric(ctx, {
        recipe: "cube-root-equation", question: `If x³ = ${cube}, what is the value of x?`, correct: cubeRoot,
        distractors: [cubeRoot * 3, cubeRoot * cubeRoot, cube - cubeRoot],
        explanation: `Take the cube root of both sides: x = ∛${cube} = ${cubeRoot}, because ${cubeRoot} × ${cubeRoot} × ${cubeRoot} = ${cube}. Multiplying by 3 instead would give ${cubeRoot * 3}.`,
        parameters: { cubeRoot, cube }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      const r1 = int(rng, -8, 2);
      const r2 = int(rng, 3, 11);
      const sum = r1 + r2;
      const product = r1 * r2;
      return numeric(ctx, {
        recipe: "quadratic-root-sum", stimulus: `The equation x² ${signedTerm(-sum, "x")} ${signedTerm(product)} = 0 has two solutions.`,
        question: "What is the sum of the solutions?", correct: sum,
        distractors: [product, -sum, -product],
        explanation: `For x² + bx + c = 0, the sum of the roots is −b. Here b = ${-sum}, so the sum is ${sum}.`, parameters: { r1, r2, sum, product }
      });
    }
    if (difficulty === "Medium" && mode < 5) {
      const center = nonzero(rng, -6, 8);
      const distance = int(rng, 2, 9);
      return conceptual(ctx, {
        recipe: "absolute-value", question: `Which values of x satisfy |x − (${center})| = ${distance}?`, correct: `x = ${center - distance} and x = ${center + distance}`,
        distractors: [`x = ${center + distance} only`, `x = ${-center - distance} and x = ${-center + distance}`, `x = ${distance - center} only`],
        explanation: `The distance between x and ${center} is ${distance}, so x = ${center} − ${distance} or x = ${center} + ${distance}.`, parameters: { center, distance }
      });
    }
    if (difficulty === "Medium") {
      const x = int(rng, 2, 12);
      const excluded = int(rng, -5, 1);
      const numerator = int(rng, 2, 9) * (x - excluded);
      const quotient = numerator / (x - excluded);
      return numeric(ctx, {
        recipe: "rational-equation", question: `If ${numerator}/(x − (${excluded})) = ${quotient} and x ≠ ${excluded}, what is x?`, correct: x,
        distractors: [excluded, x - excluded, numerator / quotient + excluded + 1],
        explanation: `Multiply by x − (${excluded}): ${numerator} = ${quotient}(x − (${excluded})). Solving gives x = ${x}, which is allowed.`, parameters: { numerator, excluded, quotient, x }
      });
    }
    if (mode < 3) {
      if (mode === 2) {
        const positiveRoot = int(rng, 2, 8);
        const negativeNumerator = int(rng, 1, 7);
        const leading = int(rng, 2, 6);
        const sum = positiveRoot - negativeNumerator / leading;
        const product = -positiveRoot * negativeNumerator / leading;
        const b = -leading * sum;
        const c = leading * product;
        return numeric(ctx, {
          recipe: "quadratic-formula-solve", question: `What is the positive solution to ${leading}x² ${signedTerm(b, "x")} ${signedTerm(c)} = 0?`, correct: positiveRoot,
          distractors: [-positiveRoot, negativeNumerator, leading * positiveRoot],
          explanation: `Applying the quadratic formula (or checking the two roots) gives x = ${positiveRoot} and x = ${fraction(-negativeNumerator, leading)}. The positive solution is ${positiveRoot}.`, parameters: { positiveRoot, negativeNumerator, leading, b, c }
        });
      }
      const h = int(rng, -8, 8);
      const k = h * h;
      return numeric(ctx, {
        recipe: "discriminant-parameter", question: `For what value of k does x² ${signedTerm(-2 * h, "x")} + k = 0 have exactly one real solution?`, correct: k,
        distractors: [2 * h, -k, Math.abs(h)],
        explanation: `Exactly one real solution requires discriminant 0: (${ -2 * h})² − 4k = 0, so k = ${k}. Equivalently, the expression becomes (x − (${h}))².`, parameters: { h, k }
      });
    }
    if (mode < 5) {
      const x = int(rng, 1, 5);
      const base = pick(rng, [2, 3, 5]);
      const leftShift = int(rng, 1, 4);
      const multiplier = int(rng, 2, 4);
      const rightShift = (x + leftShift) / multiplier - x;
      const rightExponent = Number.isInteger(rightShift) ? `${multiplier}(x ${signedTerm(rightShift)})` : `${multiplier}x ${signedTerm(multiplier * rightShift)}`;
      return numeric(ctx, {
        recipe: "exponential-common-base", question: `If ${base}^(x + ${leftShift}) = (${base}^${multiplier})^(${rightExponent.includes("(") ? rightExponent.slice(rightExponent.indexOf("(") + 1, -1) : `x ${signedTerm(rightShift)}`}), what is x?`, correct: x,
        distractors: [-x, x + leftShift, multiplier * x],
        explanation: `Rewrite both sides with base ${base} and equate exponents. Solving the resulting linear equation gives x = ${x}.`, parameters: { base, x, leftShift, multiplier, rightShift }
      });
    }
    const roots = [int(rng, -6, -1), int(rng, 1, 5), int(rng, 6, 10)].sort((a, b) => a - b);
    return numeric(ctx, {
      recipe: "polynomial-greatest-root", stimulus: `The polynomial equation (x − (${roots[0]}))(x − (${roots[1]}))(x − (${roots[2]})) = 0 has three real solutions.`,
      question: "What is the greatest solution?", correct: roots[2],
      distractors: [roots[0], roots[1], roots.reduce((sum, value) => sum + value, 0)],
      explanation: `A product is zero when any factor is zero, giving roots ${roots.join(", ")}. The greatest is ${roots[2]}.`, parameters: { roots }
    });
  }

  function nonlinearSystems(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 5;
    const r1 = int(rng, -6, 1);
    const r2 = int(rng, 2, 8);
    const slope = r1 + r2;
    const intercept = -r1 * r2;
    const tierMode = index % 4;
    if (difficulty === "Easy" && tierMode === 0) {
      const x = pick(rng, [-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9]);
      const y = x * x;
      return conceptual(ctx, {
        recipe: "verify-solution", question: `Which point is a solution to both y = x² and y = ${linearText(x, "x", 0)}?`, correct: `(${x}, ${y})`,
        distractors: [`(${y}, ${x})`, `(${-x}, ${y})`, `(${x}, ${-y})`],
        explanation: `At x = ${x}, both equations give y = ${x}² = ${y}.`, parameters: { x, y }
      });
    }
    if (difficulty === "Easy" && tierMode === 1) {
      const level = pick(rng, [-16, -9, -4, 0, 4, 9, 16, 25]);
      const solutions = level > 0 ? 2 : level === 0 ? 1 : 0;
      return numeric(ctx, {
        recipe: "intersection-count-horizontal", stimulus: `Consider the system of equations y = x² and y = ${level}.`,
        question: "How many solutions does the system have?", correct: solutions, spr: false,
        distractors: [solutions === 2 ? 1 : 2, solutions === 0 ? 1 : 0, 4],
        explanation: `The graph of y = x² has its lowest point at y = 0, so a horizontal line at y = ${level} ${level > 0 ? "crosses it twice" : level === 0 ? "touches it exactly once, at the vertex" : "never meets it"}.`,
        parameters: { level, solutions }
      });
    }
    if (difficulty === "Easy" && tierMode === 2) {
      const root = int(rng, 2, 10);
      const square = root * root;
      return conceptual(ctx, {
        recipe: "parabola-horizontal-roots", stimulus: `The system y = x² and y = ${square} has two solutions.`,
        question: "What are the x-coordinates of those solutions?", correct: `x = −${root} and x = ${root}`,
        distractors: [`x = ${root} only`, `x = ${square} and x = −${square}`, `x = ${root} and x = 0`],
        explanation: `Setting the two expressions equal gives x² = ${square}, so x = ±${root}. Both points, (−${root}, ${square}) and (${root}, ${square}), lie on each graph.`,
        parameters: { root, square }
      });
    }
    if (difficulty === "Easy") {
      const shift = int(rng, 2, 14);
      const below = int(rng, 2, 12);
      const above = int(rng, 2, 12);
      return conceptual(ctx, {
        recipe: "no-real-solution-identify",
        stimulus: `Each system below pairs the equation y = x² ${signedTerm(shift)} with a second equation.`,
        question: "Which system has no real solution?",
        correct: `y = x² ${signedTerm(shift)} and y = ${shift - below}`,
        distractors: [
          `y = x² ${signedTerm(shift)} and y = ${shift + above}`,
          `y = x² ${signedTerm(shift)} and y = ${shift}`,
          `y = x² ${signedTerm(shift)} and y = x + ${shift}`
        ],
        explanation: `Because x² is never negative, the smallest value y = x² ${signedTerm(shift)} takes is ${shift}. A horizontal line at ${shift - below} passes below the whole graph, so that system has no solution; y = ${shift + above} crosses twice, y = ${shift} touches the vertex, and y = x + ${shift} meets the curve where x² = x.`,
        parameters: { shift, below, above }
      });
    }
    if (difficulty === "Medium") {
      return numeric(ctx, {
        recipe: mode < 3 ? "intersection-root-sum" : "intersection-root-product",
        stimulus: `The graphs of y = x² and y = ${linearText(slope, "x", intercept)} intersect at two points.`,
        question: mode < 3 ? "What is the sum of the x-coordinates of the intersection points?" : "What is the product of the x-coordinates of the intersection points?",
        correct: mode < 3 ? slope : -intercept,
        distractors: mode < 3 ? [-intercept, -slope, intercept] : [intercept, slope, -slope],
        explanation: `Set the equations equal: x² − ${slope}x − (${intercept}) = 0. Its roots are ${r1} and ${r2}, so the requested value is ${mode < 3 ? slope : -intercept}.`, parameters: { r1, r2, slope, intercept }
      });
    }
    if (mode < 3) {
      const [integerX, absoluteY, radius] = pick(rng, [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17]]);
      const y = pick(rng, [-absoluteY, absoluteY]);
      const xSquared = radius * radius - y * y;
      return conceptual(ctx, {
        recipe: "circle-horizontal-line", question: `How many points of intersection do x² + y² = ${radius * radius} and y = ${y} have?`, correct: "2",
        distractors: ["0", "1", "infinitely many"],
        explanation: `Substitution gives x² = ${xSquared}, which has the two real solutions x = ±${integerX}.`, parameters: { radius, y, integerX }
      });
    }
    if (mode === 4) {
      const h = int(rng, -5, 5);
      const kValue = int(rng, -10, 10);
      const bCoef = -2 * h;
      const cValue = h * h + kValue;
      return numeric(ctx, {
        recipe: "one-solution-parameter",
        stimulus: `In the xy-plane, the graph of y = x² ${signedTerm(bCoef, "x")} ${signedTerm(cValue)} intersects the line y = k at exactly one point.`,
        question: "What is the value of k?",
        correct: kValue, distractors: [cValue, -kValue, h],
        explanation: `Completing the square gives y = (x ${signedTerm(-h)})² + ${kValue}, so the parabola's minimum value is ${kValue}. A horizontal line meets it once only at that minimum, so k = ${kValue}.`,
        parameters: { h, kValue, bCoef, cValue }
      });
    }
    const tangentX = int(rng, -6, 6);
    const vertexY = int(rng, -8, 8);
    return conceptual(ctx, {
      recipe: "tangent-line-parabola", question: `How many solutions does the system y = (x − (${tangentX}))² ${signedTerm(vertexY)} and y = ${vertexY} have?`, correct: "exactly one solution",
      distractors: ["no solution", "exactly two solutions", "infinitely many solutions"],
      explanation: `Equating the expressions gives (x − (${tangentX}))² = 0, so x = ${tangentX} only. The line is tangent to the parabola at its vertex.`, parameters: { tangentX, vertexY }
    });
  }

  function nonlinearFunctions(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 6;
    if (difficulty === "Easy") {
      const x = int(rng, -4, 6);
      const a = nonzero(rng, -3, 4);
      const b = int(rng, -8, 8);
      const c = int(rng, -8, 8);
      const value = a * x * x + b * x + c;
      return numeric(ctx, {
        recipe: "evaluate-quadratic", question: `For f(x) = ${a}x² ${signedTerm(b, "x")} ${signedTerm(c)}, what is f(${x})?`, correct: value,
        distractors: [a * x + b * x + c, a * x * x + b + c, value - a],
        explanation: `Substitute ${x}: f(${x}) = ${a}(${x})² + (${b})(${x}) + (${c}) = ${value}.`, parameters: { a, b, c, x, value }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      const h = int(rng, -6, 8);
      const k = int(rng, 5, 40);
      const a = -int(rng, 1, 5);
      return numeric(ctx, {
        recipe: "quadratic-vertex", stimulus: `The function h(t) = ${coefficientText(a)}(t − (${h}))² + ${k} models an object's height.`,
        question: "What is the maximum value of the function?", correct: k,
        distractors: [h, a, k + h],
        explanation: `The squared term is never negative, and its coefficient is negative. The maximum occurs when the square is 0, giving h(t) = ${k}.`, parameters: { a, h, k }
      });
    }
    if (difficulty === "Medium") {
      const initial = int(rng, 100, 900);
      const percent = pick(rng, [10, 15, 20, 25, 30, 40]);
      const growth = mode % 2 === 0;
      const factor = growth ? 1 + percent / 100 : 1 - percent / 100;
      return conceptual(ctx, {
        recipe: "exponential-parameter", stimulus: `The function V(t) = ${initial}(${factor})^t models a quantity after t years.`,
        question: `How does the quantity change each year?`, correct: `It ${growth ? "increases" : "decreases"} by ${percent}%.`,
        distractors: [`It ${growth ? "decreases" : "increases"} by ${percent}%.`, `It ${growth ? "increases" : "decreases"} by ${numberText(factor)}%.`, `It changes by ${initial}% each year.`],
        explanation: `The growth factor ${factor} equals 1 ${growth ? "+" : "−"} ${percent / 100}, so the yearly ${growth ? "increase" : "decrease"} is ${percent}%.`, parameters: { initial, percent, factor }
      });
    }
    if (mode < 3) {
      const originalX = int(rng, -6, 8);
      const originalY = int(rng, -5, 12);
      const horizontal = nonzero(rng, -5, 5);
      const vertical = nonzero(rng, -5, 5);
      const newX = originalX - horizontal;
      const newY = originalY + vertical;
      return conceptual(ctx, {
        recipe: "function-transformation", stimulus: `The point (${originalX}, ${originalY}) lies on y = f(x). Function g is defined by g(x) = f(x ${signedTerm(horizontal)}) ${signedTerm(vertical)}.`,
        question: "Which point must lie on y = g(x)?", correct: `(${newX}, ${newY})`,
        distractors: [`(${originalX + horizontal}, ${newY})`, `(${newX}, ${originalY - vertical})`, `(${originalX + horizontal}, ${originalY - vertical})`],
        explanation: `Set x + (${horizontal}) = ${originalX}, giving x = ${newX}. Then g(${newX}) = ${originalY} + (${vertical}) = ${newY}.`, parameters: { originalX, originalY, horizontal, vertical }
      });
    }
    if (mode === 3) {
      const r1 = int(rng, -8, -1);
      const r2 = int(rng, 2, 9);
      return conceptual(ctx, {
        recipe: "quadratic-x-intercepts", question: `The function f is defined by f(x) = (x − (${r1}))(x − (${r2})). Which points are the x-intercepts of y = f(x)?`,
        correct: `(${r1}, 0) and (${r2}, 0)`,
        distractors: [`(${-r1}, 0) and (${-r2}, 0)`, `(0, ${r1}) and (0, ${r2})`, `(${r1}, ${r2}) and (${r2}, ${r1})`],
        explanation: `The x-intercepts occur where f(x) = 0. Each factor can be zero, so x = ${r1} or x = ${r2}.`, parameters: { r1, r2 }
      });
    }
    if (mode === 4) {
      const h = int(rng, -6, 8);
      const k = int(rng, -10, 20);
      const a = nonzero(rng, -4, 4);
      return conceptual(ctx, {
        recipe: "quadratic-useful-form", question: `Which form of f(x) = ${coefficientText(a)}(x − (${h}))² ${signedTerm(k)} most directly displays the vertex of its graph?`,
        correct: `The given form; it shows the vertex (${h}, ${k}).`,
        distractors: [`Standard form; it shows the vertex (0, ${k}).`, `Factored form; it shows that both zeros equal ${k}.`, `No algebraic form can display a vertex.`],
        explanation: `Vertex form a(x − h)² + k displays the vertex directly as (h, k), here (${h}, ${k}).`, parameters: { a, h, k }
      });
    }
    const initial = int(rng, 20, 100);
    const factor = pick(rng, [2, 3, 4]);
    const steps = int(rng, 2, 4);
    const value = initial * factor ** steps;
    return numeric(ctx, {
      recipe: "exponential-use", stimulus: `For an exponential function f, f(0) = ${initial}, and each increase of 1 in x multiplies f(x) by ${factor}.`,
      question: `What is f(${steps})?`, correct: value,
      distractors: [initial + factor * steps, initial * factor * steps, initial * factor ** (steps - 1)],
      explanation: `The function is f(x) = ${initial}(${factor})^x. Thus f(${steps}) = ${initial}(${factor})^${steps} = ${value}.`, parameters: { initial, factor, steps }
    });
  }

  function ratiosRatesUnits(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 6;
    const tierMode = index % 4;
    if (difficulty === "Easy" && tierMode === 0) {
      const goods = pick(rng, ["notebooks", "tickets", "seedlings", "batteries", "wall tiles"]);
      const unitRate = int(rng, 3, 18);
      const quantity = int(rng, 4, 15);
      const total = unitRate * quantity;
      return numeric(ctx, {
        recipe: "unit-rate", stimulus: `${quantity} identical ${goods} cost $${total}.`, question: `What is the cost, in dollars, of one of the ${goods}?`, correct: unitRate,
        distractors: [total - quantity, quantity / total, total + quantity],
        explanation: `Divide total cost by count: ${total}/${quantity} = ${unitRate} dollars per item.`, parameters: { unitRate, quantity, total }
      });
    }
    if (difficulty === "Easy" && tierMode === 1) {
      const servings = pick(rng, [4, 5, 6, 8]);
      const cups = int(rng, 2, 9);
      const factor = int(rng, 2, 5);
      const targetServings = servings * factor;
      const targetCups = cups * factor;
      return numeric(ctx, {
        recipe: "proportion-scale", stimulus: `A recipe that makes ${servings} servings uses ${cups} cups of flour.`,
        question: `At the same rate, how many cups of flour are needed for ${targetServings} servings?`, correct: targetCups,
        distractors: [cups + factor, targetServings - servings, cups * targetServings],
        explanation: `${targetServings} servings is ${factor} times ${servings} servings, so the flour scales by the same factor: ${cups} × ${factor} = ${targetCups} cups.`,
        parameters: { servings, cups, factor, targetServings, targetCups }
      });
    }
    if (difficulty === "Easy" && tierMode === 2) {
      const conversion = pick(rng, [
        { large: "foot", plural: "feet", small: "inches", per: 12 },
        { large: "hour", plural: "hours", small: "minutes", per: 60 },
        { large: "minute", plural: "minutes", small: "seconds", per: 60 },
        { large: "yard", plural: "yards", small: "feet", per: 3 },
        { large: "kilogram", plural: "kilograms", small: "grams", per: 1000 }
      ]);
      const wholes = int(rng, 3, 9);
      const extra = int(rng, 1, conversion.per - 1);
      const totalSmall = wholes * conversion.per + extra;
      return numeric(ctx, {
        recipe: "unit-conversion", stimulus: `There are ${conversion.per} ${conversion.small} in 1 ${conversion.large}.`,
        question: `How many ${conversion.small} are in ${wholes} ${conversion.plural} and ${extra} ${conversion.small}?`, correct: totalSmall,
        distractors: [wholes * conversion.per, wholes + extra, (wholes + extra) * conversion.per],
        explanation: `Convert the whole ${conversion.plural} first: ${wholes} × ${conversion.per} = ${wholes * conversion.per} ${conversion.small}. Adding the remaining ${extra} gives ${totalSmall}.`,
        parameters: { conversion, wholes, extra, totalSmall }
      });
    }
    if (difficulty === "Easy") {
      const first = int(rng, 2, 7);
      const second = int(rng, 2, 7);
      const groups = int(rng, 4, 12);
      const total = (first + second) * groups;
      const firstCount = first * groups;
      const colors = pick(rng, [["red", "blue"], ["oak", "pine"], ["short", "long"], ["ripe", "unripe"], ["glazed", "plain"]]);
      return numeric(ctx, {
        recipe: "ratio-part-from-total", stimulus: `A collection of ${total} items contains only ${colors[0]} and ${colors[1]} items, in the ratio ${first} to ${second}.`,
        question: `How many of the items are ${colors[0]}?`, correct: firstCount,
        distractors: [first, total - first, second * groups + 1],
        explanation: `The ratio splits the collection into ${first} + ${second} = ${first + second} equal parts, so each part holds ${total} ÷ ${first + second} = ${groups} items. The ${colors[0]} items make up ${first} parts: ${first} × ${groups} = ${firstCount}.`,
        parameters: { first, second, groups, total, firstCount }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      const scale = int(rng, 8, 30);
      const mapDistance = int(rng, 3, 12) / 2;
      const actual = scale * mapDistance;
      return numeric(ctx, {
        recipe: "scale-drawing", stimulus: `A map uses a scale of 1 centimeter to ${scale} kilometers. Two locations are ${mapDistance} centimeters apart on the map.`,
        question: "What is their actual distance, in kilometers?", correct: numberText(actual),
        distractors: [numberText(scale / mapDistance), numberText(scale + mapDistance), numberText(actual / 10)],
        explanation: `Multiply map distance by the scale: ${mapDistance} × ${scale} = ${actual} kilometers.`, parameters: { scale, mapDistance, actual }
      });
    }
    if (difficulty === "Medium") {
      const speed = int(rng, 40, 75);
      const minutes = pick(rng, [30, 45, 90, 120, 150]);
      const distance = speed * minutes / 60;
      return numeric(ctx, {
        recipe: "convert-time-rate", stimulus: `A vehicle travels at a constant rate of ${speed} miles per hour for ${minutes} minutes.`,
        question: "How many miles does it travel?", correct: numberText(distance),
        distractors: [numberText(speed * minutes), numberText(minutes / speed), numberText(speed + minutes / 60)],
        explanation: `${minutes} minutes is ${numberText(minutes / 60)} hours. Distance = rate × time = ${speed} × ${numberText(minutes / 60)} = ${distance}.`, parameters: { speed, minutes, distance }
      });
    }
    if (mode < 3) {
      const metersPerSecond = int(rng, 4, 20);
      const kilometersPerHour = metersPerSecond * 3.6;
      return numeric(ctx, {
        recipe: "compound-unit-conversion", question: `A speed is ${metersPerSecond} meters per second. What is this speed in kilometers per hour?`, correct: numberText(kilometersPerHour),
        distractors: [numberText(metersPerSecond / 3.6), numberText(metersPerSecond * 60), numberText(metersPerSecond * 0.6)],
        explanation: `Multiply by 3,600 seconds per hour and divide by 1,000 meters per kilometer: ${metersPerSecond} × 3.6 = ${kilometersPerHour}.`, parameters: { metersPerSecond, kilometersPerHour }
      });
    }
    if (mode === 5) {
      const rateA = pick(rng, [80, 100, 120, 150]);
      const rateB = pick(rng, [100, 150, 180, 200]);
      const combined = rateA + rateB;
      const hours = pick(rng, [2, 3, 4]);
      const units = combined * hours;
      const minutes = hours * 60;
      return numeric(ctx, {
        recipe: "combined-rate",
        stimulus: `Machine A fills ${rateA} bottles per hour, and machine B fills ${rateB} bottles per hour.`,
        question: `Working at the same time, how many minutes will the two machines take to fill ${units} bottles?`,
        correct: minutes, distractors: [Math.round(units / rateA * 60), Math.round(units / rateB * 60), combined],
        explanation: `Together the machines fill ${combined} bottles per hour. Filling ${units} bottles takes ${units}/${combined} = ${hours} hours, which is ${minutes} minutes.`,
        parameters: { rateA, rateB, units, minutes, hours }
      });
    }
    const density = int(rng, 2, 12);
    const volume = int(rng, 15, 80);
    const mass = density * volume;
    return numeric(ctx, {
      recipe: "derived-unit-density", stimulus: `A material has mass ${mass} grams and volume ${volume} cubic centimeters.`,
      question: "What is its density, in grams per cubic centimeter?", correct: density,
      distractors: [mass * volume, volume / mass, mass - volume],
      explanation: `Density is mass divided by volume: ${mass}/${volume} = ${density} g/cm³.`, parameters: { density, volume, mass }
    });
  }

  function percentages(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 6;
    const tierMode = index % 4;
    if (difficulty === "Easy" && tierMode === 0) {
      const original = int(rng, 4, 20) * 10;
      const percent = pick(rng, [10, 20, 25, 30, 40, 50]);
      const amount = original * percent / 100;
      return numeric(ctx, {
        recipe: "percent-of", question: `What is ${percent}% of ${original}?`, correct: numberText(amount),
        distractors: [numberText(original - amount), numberText(original + amount), numberText(original / percent)],
        explanation: `${percent}% = ${percent / 100}. Multiplying ${original} by ${percent / 100} gives ${amount}.`, parameters: { original, percent, amount }
      });
    }
    if (difficulty === "Easy" && tierMode === 1) {
      const percent = pick(rng, [10, 20, 25, 40, 50, 60, 75]);
      const whole = int(rng, 4, 20) * 10;
      const part = whole * percent / 100;
      return numeric(ctx, {
        recipe: "what-percent", stimulus: `A survey of ${whole} people found that ${part} of them own a library card.`,
        question: "What percent of the people surveyed own a library card?", correct: numberText(percent),
        distractors: [numberText(whole - part), numberText(part), numberText(whole / part)],
        explanation: `Divide the part by the whole and convert: ${part} ÷ ${whole} = ${numberText(part / whole)}, which is ${percent}%.`,
        parameters: { whole, part, percent }
      });
    }
    if (difficulty === "Easy" && tierMode === 2) {
      const percent = pick(rng, [10, 20, 25, 40, 50]);
      const whole = int(rng, 4, 20) * 10;
      const part = whole * percent / 100;
      return numeric(ctx, {
        recipe: "whole-from-part", question: `${numberText(part)} is ${percent}% of what number?`, correct: numberText(whole),
        distractors: [numberText(part * percent / 100), numberText(part + percent), numberText(part * percent)],
        explanation: `If ${percent}% of a number is ${numberText(part)}, then the number is ${numberText(part)} ÷ ${percent / 100} = ${numberText(whole)}.`,
        parameters: { whole, part, percent }
      });
    }
    if (difficulty === "Easy") {
      const original = int(rng, 4, 20) * 10;
      const percent = pick(rng, [10, 20, 25, 50]);
      const increase = original * percent / 100;
      const final = original + increase;
      return numeric(ctx, {
        recipe: "increase-new-value", stimulus: `A ticket that costs $${original} increases in price by ${percent}%.`,
        question: "What is the new price, in dollars?", correct: numberText(final),
        distractors: [numberText(increase), numberText(original - increase), numberText(original + percent)],
        explanation: `The increase is ${percent}% of ${original}, or ${numberText(increase)}. The new price is ${original} + ${numberText(increase)} = ${numberText(final)}, which is also ${original} × ${numberText(1 + percent / 100)}.`,
        parameters: { original, percent, increase, final }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      const original = int(rng, 4, 30) * 10;
      const percent = pick(rng, [10, 15, 20, 25, 30, 40]);
      const discount = original * percent / 100;
      const sale = original - discount;
      return numeric(ctx, {
        recipe: "discount", stimulus: `An item originally costs $${original} and is discounted by ${percent}%.`,
        question: "What is the sale price, in dollars?", correct: numberText(sale),
        distractors: [numberText(discount), numberText(original + discount), numberText(original * (1 - percent))],
        explanation: `The sale-price factor is 1 − ${percent / 100} = ${1 - percent / 100}. Thus the price is ${original}(${1 - percent / 100}) = ${sale}.`, parameters: { original, percent, sale }
      });
    }
    if (difficulty === "Medium") {
      const percent = pick(rng, [20, 25, 50, 100]);
      const step = percent === 20 ? 5 : percent === 25 ? 4 : percent === 50 ? 2 : 1;
      const original = int(rng, 4, 30) * step;
      const final = original * (1 + percent / 100);
      {
        return numeric(ctx, {
          recipe: "reverse-percent", stimulus: `After increasing by ${percent}%, a quantity is ${final}.`, question: "What was the original quantity?", correct: original,
          distractors: [final * percent / 100, final * (1 - percent / 100), final / (percent / 100)],
          explanation: `The final value is ${1 + percent / 100} times the original, so the original is ${final}/${1 + percent / 100} = ${original}.`, parameters: { final, percent, original }
        });
      }
    }
    if (mode < 3) {
      const first = pick(rng, [10, 20, 25, 30]);
      const second = pick(rng, [10, 15, 20, 25]);
      const factor = (1 + first / 100) * (1 - second / 100);
      const net = Math.round((factor - 1) * 10000) / 100;
      return conceptual(ctx, {
        recipe: "successive-percent-change", question: `A value increases by ${first}% and then decreases by ${second}%. What is the overall percent change?`,
        correct: `${Math.abs(net)}% ${net >= 0 ? "increase" : "decrease"}`,
        distractors: [`${Math.abs(first - second)}% ${first >= second ? "increase" : "decrease"}`, `${first + second}% increase`, `${second}% decrease`],
        explanation: `Multiply growth factors: (1 + ${first / 100})(1 − ${second / 100}) = ${numberText(factor)}. Relative to 1, this is a ${Math.abs(net)}% ${net >= 0 ? "increase" : "decrease"}.`, parameters: { first, second, factor, net }
      });
    }
    if (mode === 5) {
      const outerPercent = pick(rng, [20, 25, 50]);
      const innerPercent = pick(rng, [20, 25, 50]);
      const total = int(rng, 2, 9) * 200;
      const inner = total * outerPercent / 100;
      const both = inner * innerPercent / 100;
      return numeric(ctx, {
        recipe: "nested-percent-reverse",
        stimulus: `At a school, ${outerPercent}% of the students take band, and ${innerPercent}% of the students who take band also take chorus. Exactly ${both} students take both.`,
        question: "How many students attend the school?",
        correct: total, distractors: [inner, both * 100 / innerPercent + both, total / 2],
        explanation: `The number taking band is ${both} ÷ ${innerPercent / 100} = ${inner}. The number of students is ${inner} ÷ ${outerPercent / 100} = ${total}.`,
        parameters: { outerPercent, innerPercent, both, inner, total }
      });
    }
    const totalPercent = pick(rng, [30, 40, 50, 60, 75, 80]);
    const subgroupPercent = pick(rng, [20, 25, 30, 40, 50]);
    const joint = totalPercent * subgroupPercent / 100;
    return numeric(ctx, {
      recipe: "percent-of-subgroup", stimulus: `${totalPercent}% of a group has property A. Of those with property A, ${subgroupPercent}% also have property B.`,
      question: "What percentage of the whole group has both properties?", correct: numberText(joint),
      distractors: [totalPercent + subgroupPercent, Math.abs(totalPercent - subgroupPercent), numberText(subgroupPercent / totalPercent * 100)],
      explanation: `Multiply the proportions: ${totalPercent / 100} × ${subgroupPercent / 100} = ${joint / 100}, or ${joint}%.`, parameters: { totalPercent, subgroupPercent, joint }
    });
  }

  // Five one-variable settings, so a list of numbers is not always unlabeled.
  const ONE_VARIABLE_CONTEXTS = [
    { noun: "books each student read last month", unit: "books", caption: "Books read last month" },
    { noun: "daily high temperatures, in degrees", unit: "degrees", caption: "Daily high temperature" },
    { noun: "minutes each member practiced", unit: "minutes", caption: "Minutes practiced" },
    { noun: "packages delivered each day", unit: "packages", caption: "Packages delivered" },
    { noun: "points the team scored each game", unit: "points", caption: "Points scored per game" }
  ];

  function oneVariableData(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 6;
    const tierMode = index % 4;
    const context = pick(rng, ONE_VARIABLE_CONTEXTS);
    if (difficulty === "Easy" && tierMode === 0) {
      const values = Array.from({ length: 5 }, () => int(rng, 5, 20));
      const sum = values.reduce((total, value) => total + value, 0);
      const adjusted = sum % 5;
      values[4] += adjusted ? 5 - adjusted : 0;
      const mean = values.reduce((total, value) => total + value, 0) / 5;
      return numeric(ctx, {
        recipe: "mean", stimulus: `A record lists the ${context.noun}: ${values.join(", ")}.`, question: "What is the mean of these values?", correct: mean,
        distractors: [[...values].sort((a, b) => a - b)[2], Math.max(...values) - Math.min(...values), mean + 1],
        explanation: `The values sum to ${mean * 5}. Divide by 5 to get a mean of ${mean}.`, parameters: { values, mean }
      });
    }
    if (difficulty === "Easy" && tierMode === 1) {
      const median = int(rng, 10, 30);
      const values = [median - int(rng, 4, 8), median - 1, median, median + 2, median + int(rng, 5, 10)].sort((a, b) => a - b);
      return numeric(ctx, {
        recipe: "median", stimulus: `A record lists the ${context.noun}: ${values.join(", ")}.`, question: "What is the median of these values?", correct: median,
        distractors: [values.reduce((a, b) => a + b, 0) / values.length, Math.max(...values) - Math.min(...values), values[1]],
        explanation: `The data are already ordered and contain five values, so the median is the third value, ${median}.`, parameters: { values, median }
      });
    }
    if (difficulty === "Easy" && tierMode === 2) {
      const low = int(rng, 4, 15);
      const spread = int(rng, 6, 24);
      const high = low + spread;
      const values = [low, low + int(rng, 1, 3), low + int(rng, 4, 6), high - int(rng, 1, 3), high];
      return numeric(ctx, {
        recipe: "range", stimulus: `A record lists the ${context.noun}: ${values.join(", ")}.`, question: "What is the range of these values?", correct: spread,
        distractors: [high, low, values.reduce((a, b) => a + b, 0) / values.length],
        explanation: `The range is the largest value minus the smallest: ${high} − ${low} = ${spread}.`, parameters: { values, low, high, spread }
      });
    }
    if (difficulty === "Easy") {
      const target = int(rng, 3, 9);
      const rare = [target + 1, target + 2, target - 1];
      const topFrequency = int(rng, 7, 12);
      const rows = [[target, topFrequency], [rare[0], int(rng, 2, 5)], [rare[1], int(rng, 2, 5)], [rare[2], int(rng, 2, 5)]];
      return numeric(ctx, {
        recipe: "mode-from-frequency-table",
        table: { caption: context.caption, headers: ["Value", "Frequency"], rows },
        question: "Which value occurs most often in the data set?", correct: target,
        distractors: [topFrequency, rare[0], rows.reduce((total, row) => total + row[1], 0)],
        explanation: `The Frequency column counts how many times each value appears. The largest frequency is ${topFrequency}, which belongs to the value ${target}.`,
        parameters: { rows, target, topFrequency }
      });
    }
    if (difficulty === "Medium" && tierMode === 0) {
      const oldCount = int(rng, 4, 9);
      const oldMean = int(rng, 60, 80);
      const meanChange = pick(rng, [-2, -1, 1, 2]);
      const newMean = oldMean + meanChange;
      const newValue = newMean * (oldCount + 1) - oldCount * oldMean;
      return numeric(ctx, {
        recipe: "updated-mean", stimulus: `The mean of ${oldCount} values is ${oldMean}. A value of ${newValue} is added.`,
        question: `What is the new mean?`, correct: numberText(newMean), accepted: [numberText(newMean)],
        distractors: [numberText((oldMean + newValue) / 2), oldMean + newValue, numberText(newMean + 1)],
        explanation: `The original sum is ${oldCount}(${oldMean}) = ${oldCount * oldMean}. Add ${newValue} and divide by ${oldCount + 1}, giving ${numberText(newMean)}.`, parameters: { oldCount, oldMean, meanChange, newValue, newMean }
      });
    }
    if (difficulty === "Medium" && tierMode === 1) {
      const lowMiddle = int(rng, 12, 30);
      const highMiddle = lowMiddle + 2 * int(rng, 1, 4);
      const values = [lowMiddle - int(rng, 5, 9), lowMiddle - int(rng, 1, 4), lowMiddle, highMiddle, highMiddle + int(rng, 1, 4), highMiddle + int(rng, 5, 9)].sort((a, b) => a - b);
      const median = (lowMiddle + highMiddle) / 2;
      return numeric(ctx, {
        recipe: "median-even-count", stimulus: `A record lists the ${context.noun}: ${values.join(", ")}.`,
        question: "What is the median of these values?", correct: numberText(median),
        distractors: [numberText(lowMiddle), numberText(highMiddle), numberText(values.reduce((a, b) => a + b, 0) / values.length)],
        explanation: `Six values leave no single middle value, so average the third and fourth: (${lowMiddle} + ${highMiddle}) ÷ 2 = ${numberText(median)}.`,
        parameters: { values, lowMiddle, highMiddle, median }
      });
    }
    if (difficulty === "Medium" && tierMode === 2) {
      const rows = [[int(rng, 2, 4), int(rng, 2, 5)], [int(rng, 5, 7), int(rng, 2, 5)], [int(rng, 8, 10), int(rng, 2, 5)]];
      const count = rows.reduce((total, row) => total + row[1], 0);
      const total = rows.reduce((sum, row) => sum + row[0] * row[1], 0);
      const mean = total / count;
      return numeric(ctx, {
        recipe: "mean-from-frequency-table",
        table: { caption: context.caption, headers: ["Value", "Frequency"], rows },
        question: "What is the mean of the values in the data set?", correct: numberText(mean),
        distractors: [numberText(rows.reduce((sum, row) => sum + row[0], 0) / rows.length), numberText(total), numberText(count)],
        explanation: `Weight each value by its frequency: the ${count} values total ${total}, so the mean is ${total} ÷ ${count} = ${numberText(mean)}. Averaging only the three listed values ignores how often each occurs.`,
        parameters: { rows, count, total, mean }
      });
    }
    if (difficulty === "Medium") {
      const target = int(rng, 4, 9);
      const rows = [[target - 1, 3], [target, int(rng, 6, 9)], [target + 1, 3], [target + 2, 2]];
      const count = rows.reduce((sum, row) => sum + row[1], 0);
      return numeric(ctx, {
        recipe: "median-from-frequency-table",
        table: { caption: context.caption, headers: ["Value", "Frequency"], rows },
        question: "What is the median of the values in the data set?", correct: target,
        distractors: [rows[1][1], count, target + 1],
        explanation: `The table lists ${count} values in increasing order. Counting up the frequencies, the middle values both fall in the row for ${target}, so the median is ${target}.`,
        parameters: { rows, target, count }
      });
    }
    if (tierMode === 0) {
      const center = int(rng, 20, 80);
      const tight = [center - 2, center - 1, center, center + 1, center + 2];
      const wide = [center - 10, center - 5, center, center + 5, center + 10];
      return conceptual(ctx, {
        recipe: "compare-standard-deviation", stimulus: `Data set A is ${tight.join(", ")}. Data set B is ${wide.join(", ")}.`,
        question: "Which statement is true?", correct: "The sets have the same mean, but set B has the greater standard deviation.",
        distractors: ["The sets have the same mean and the same standard deviation.", "Set A has the greater mean and greater standard deviation.", "Set B has the greater mean, but set A has the greater standard deviation."],
        explanation: `Both sets are symmetric around ${center}, so both means are ${center}. Set B's values are farther from the mean, so B has the larger standard deviation.`, parameters: { center, tight, wide }
      });
    }
    if (tierMode === 1) {
      let first = int(rng, 10, 28);
      const second = int(rng, 10, 28);
      const third = int(rng, 10, 28);
      const fourth = int(rng, 10, 28);
      const fifth = int(rng, 8, 40);
      first += (5 - ((first + second + third + fourth + fifth) % 5)) % 5;
      const mean = (first + second + third + fourth + fifth) / 5;
      return numeric(ctx, {
        recipe: "missing-value-from-mean",
        stimulus: `The mean of five numbers is ${mean}. Four of the numbers are ${first}, ${second}, ${third}, and ${fourth}.`,
        question: "What is the fifth number?",
        correct: fifth, distractors: [mean, first + second + third + fourth, Math.abs(mean - fifth)],
        explanation: `The five numbers total ${mean} × 5 = ${mean * 5}. The four listed numbers total ${first + second + third + fourth}, so the fifth is ${mean * 5} − ${first + second + third + fourth} = ${fifth}.`,
        parameters: { first, second, third, fourth, fifth, mean }
      });
    }
    if (tierMode === 2) {
      const [groupOneCount, groupTwoCount] = pick(rng, [[12, 4], [15, 5], [9, 3], [18, 6], [21, 7]]);
      const step = int(rng, 1, 3);
      const groupOneMean = int(rng, 60, 75);
      const groupTwoMean = groupOneMean + 4 * step;
      const combined = (groupOneCount * groupOneMean + groupTwoCount * groupTwoMean) / (groupOneCount + groupTwoCount);
      return numeric(ctx, {
        recipe: "combined-mean-two-groups",
        stimulus: `One group of ${groupOneCount} scores has a mean of ${groupOneMean}, and a second group of ${groupTwoCount} scores has a mean of ${groupTwoMean}.`,
        question: "What is the mean of all the scores combined?", correct: numberText(combined),
        distractors: [numberText((groupOneMean + groupTwoMean) / 2), numberText(groupOneMean + groupTwoMean), numberText(groupTwoMean - groupOneMean)],
        explanation: `Combine the totals, not the means: ${groupOneCount}(${groupOneMean}) + ${groupTwoCount}(${groupTwoMean}) = ${groupOneCount * groupOneMean + groupTwoCount * groupTwoMean} across ${groupOneCount + groupTwoCount} scores, giving ${numberText(combined)}. Averaging the two means would ignore the different group sizes.`,
        parameters: { groupOneCount, groupTwoCount, groupOneMean, groupTwoMean, step, combined }
      });
    }
    const base = [int(rng, 10, 20), int(rng, 21, 30), int(rng, 31, 40), int(rng, 41, 50)];
    const outlier = int(rng, 100, 160);
    return conceptual(ctx, {
      recipe: "outlier-effect", stimulus: `A data set contains ${base.join(", ")}. The value ${outlier} is added.`,
      question: "How will adding this value affect the mean and median?", correct: "The mean will increase more than the median will increase.",
      distractors: ["The median will increase more than the mean will increase.", "The mean and median will decrease by the same amount.", "Neither the mean nor the median will change."],
      explanation: `${outlier} is a high outlier. The mean uses its full magnitude and is pulled upward strongly, while the median is resistant to an extreme value.`, parameters: { base, outlier }
    });
  }

  // Five paired-data settings, so a line of best fit is not always training
  // hours against a performance score.
  const PAIRED_CONTEXTS = [
    { xName: "hours of training", yName: "performance score", xUnit: "hour of training", yUnit: "points" },
    { xName: "weeks since planting", yName: "plant height", xUnit: "week", yUnit: "centimeters" },
    { xName: "hundreds of dollars spent on advertising", yName: "daily sales", xUnit: "hundred dollars spent", yUnit: "sales" },
    { xName: "minutes of daily reading", yName: "vocabulary score", xUnit: "minute of reading", yUnit: "points" },
    { xName: "years of experience", yName: "weekly output", xUnit: "year of experience", yUnit: "units" }
  ];

  function twoVariableData(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 6;
    const tierMode = index % 4;
    const context = pick(rng, PAIRED_CONTEXTS);
    const m = nonzero(rng, 2, 9);
    const b = int(rng, 5, 30);
    if (difficulty === "Easy" && tierMode === 0) {
      const x = int(rng, 3, 12);
      const predicted = m * x + b;
      return numeric(ctx, {
        recipe: "model-prediction", stimulus: `A line of best fit relating x, ${context.xName}, to y, ${context.yName}, is y = ${linearText(m, "x", b)}.`,
        question: `What y-value does the model predict when x = ${x}?`, correct: predicted,
        distractors: [m + x + b, predicted - b, predicted + m],
        explanation: `Substitute x = ${x}: y = ${m}(${x}) + ${b} = ${predicted}.`, parameters: { m, b, x, predicted }
      });
    }
    if (difficulty === "Easy" && tierMode === 1) {
      const readX = int(rng, 2, 5);
      const points = [1, 2, 3, 4, 5].map((x) => [x, m * x + b + pick(rng, [-2, -1, 0, 1, 2])]);
      const target = points.find((point) => point[0] === readX);
      return numeric(ctx, {
        recipe: "scatterplot-read-value", figure: { kind: "scatter", label: `${context.yName} against ${context.xName}`, points },
        question: `In the scatterplot, what is the y-value of the point whose x-value is ${readX}?`, correct: target[1],
        distractors: [readX, target[1] + m, target[1] - 1],
        explanation: `Find the point directly above x = ${readX} and read its height: y = ${target[1]}.`,
        parameters: { points, readX, value: target[1] }
      });
    }
    if (difficulty === "Easy" && tierMode === 2) {
      return conceptual(ctx, {
        recipe: "intercept-interpretation", stimulus: `A line of best fit relating x, ${context.xName}, to y, ${context.yName}, is y = ${linearText(m, "x", b)}.`,
        question: `What is the best interpretation of ${b} in this model?`,
        correct: `The model predicts ${b} ${context.yUnit} when x is 0`,
        distractors: [
          `The model predicts ${b} more ${context.yUnit} for each additional ${context.xUnit}`,
          `The model predicts ${b} ${context.yUnit} for every value of x`,
          `The largest value the model predicts for y is ${b} ${context.yUnit}`
        ],
        explanation: `Substituting x = 0 leaves y = ${b}, so ${b} is the predicted ${context.yName} at x = 0. The per-unit change is the slope, ${m}.`,
        parameters: { m, b }
      });
    }
    if (difficulty === "Easy") {
      const x = int(rng, 3, 12);
      const targetY = m * x + b;
      return numeric(ctx, {
        recipe: "model-prediction-reverse", stimulus: `A line of best fit relating x, ${context.xName}, to y, ${context.yName}, is y = ${linearText(m, "x", b)}.`,
        question: `For what x-value does the model predict y = ${targetY}?`, correct: x,
        distractors: [targetY - b, targetY, x + m],
        explanation: `Solve ${targetY} = ${m}x + ${b}. Subtracting gives ${m}x = ${targetY - b}, so x = ${x}.`,
        parameters: { m, b, x, targetY }
      });
    }
    if (difficulty === "Medium" && tierMode === 0) {
      return conceptual(ctx, {
        recipe: "slope-interpretation", stimulus: `A line of best fit y = ${linearText(m, "x", b)} relates x, ${context.xName}, to y, ${context.yName}.`,
        question: `What is the best interpretation of ${m}?`, correct: `The predicted ${context.yName} increases by ${m} ${context.yUnit} for each additional ${context.xUnit}`,
        distractors: [
          `The predicted ${context.yName} is ${m} ${context.yUnit} when x is 0`,
          `The predicted x increases by ${m} ${context.xUnit} for each additional point of ${context.yName}`,
          `Every case in the data set has a ${context.yName} of exactly ${m} ${context.yUnit}`
        ],
        explanation: `The slope gives the predicted change in y for a 1-unit increase in x: ${m} ${context.yUnit} per ${context.xUnit}.`,
        parameters: { m, b }
      });
    }
    if (difficulty === "Medium" && tierMode === 1) {
      const x = int(rng, 3, 10);
      const predicted = m * x + b;
      const residual = nonzero(rng, -8, 8);
      const observed = predicted + residual;
      return numeric(ctx, {
        recipe: "residual", stimulus: `For a data point with x = ${x}, the model y = ${linearText(m, "x", b)} predicts y. The observed y-value is ${observed}.`,
        question: "What is the residual (observed minus predicted)?", correct: residual,
        distractors: [-residual, observed, predicted],
        explanation: `The predicted value is ${predicted}. Residual = observed − predicted = ${observed} − ${predicted} = ${residual}.`, parameters: { m, b, x, predicted, observed, residual }
      });
    }
    if (difficulty === "Medium" && tierMode === 2) {
      const low = int(rng, 1, 4);
      const high = low + int(rng, 6, 12);
      const far = high * int(rng, 4, 8);
      return conceptual(ctx, {
        recipe: "extrapolation-caution", stimulus: `A line of best fit was computed from data in which ${context.xName} ranged from ${low} to ${high}.`,
        question: `Why is the model's prediction at x = ${far} unreliable?`,
        correct: `That x-value lies far outside the range the data covered`,
        distractors: [
          `A line of best fit can only be evaluated at the x-values in the data`,
          `The prediction at x = ${far} is larger than any y-value in the data`,
          `A line of best fit is unreliable whenever x is greater than ${high}`
        ],
        explanation: `The relationship was only observed for x between ${low} and ${high}. Extending it to x = ${far} assumes a pattern that was never measured; the model can still be evaluated between the observed values.`,
        parameters: { low, high, far }
      });
    }
    if (difficulty === "Medium") {
      const points = [1, 2, 3, 4, 5].map((x) => [x, m * x + b + pick(rng, [-2, -1, 0, 1, 2])]);
      return conceptual(ctx, {
        recipe: "fit-line-from-scatterplot", figure: { kind: "scatter", label: `${context.yName} against ${context.xName}`, points },
        question: "Which equation could represent the line of best fit for the data shown?", correct: `y = ${linearText(m, "x", b)}`,
        distractors: [`y = ${linearText(-m, "x", b)}`, `y = ${linearText(m, "x", -b)}`, `y = ${linearText(b, "x", m)}`],
        explanation: `The points rise about ${m} units for each 1-unit step in x and sit near y = ${b} when x is 0, so y = ${linearText(m, "x", b)} fits. A negative slope would fall as x increases.`,
        parameters: { m, b, points }
      });
    }
    if (tierMode === 0) {
      const factor = pick(rng, ctx.practiceSet === 2 ? [0.5, 0.75, 0.8, 1.05, 1.3, 1.4, 1.6, 1.75, 2.5] : [1.1, 1.2, 1.25, 1.5, 2]);
      return conceptual(ctx, {
        recipe: "model-selection", stimulus: `In a data set relating ${context.xName} to ${context.yName}, each 1-unit increase in x is associated with multiplying y by approximately ${factor}.`,
        question: "Which type of model is most appropriate?", correct: "An exponential model",
        distractors: ["A linear model", "A constant model", "No model, because y changes"],
        explanation: `A roughly constant multiplicative change for equal x-intervals is the defining pattern of exponential growth or decay.`, parameters: { factor }
      });
    }
    if (tierMode === 1) {
      const initial = pick(rng, [3, 4, 5, 6, 8]);
      const growth = pick(rng, [2, 3]);
      const rows = [0, 1, 2, 3].map((x) => [x, initial * growth ** x]);
      return conceptual(ctx, {
        recipe: "exponential-model-from-table",
        table: { caption: `${context.yName} at each value of x`, headers: ["x", "y"], rows },
        question: "Which function models the values in the table?", correct: `y = ${initial}(${growth})^x`,
        distractors: [`y = ${initial}x + ${growth}`, `y = ${growth}(${initial})^x`, `y = ${initial}(${growth})x`],
        explanation: `At x = 0 the value is ${initial}, so ${initial} is the initial amount. Each step in x multiplies y by ${growth}, which makes ${growth} the base: y = ${initial}(${growth})^x.`,
        parameters: { initial, growth, rows }
      });
    }
    if (tierMode === 2) {
      const slope = pick(rng, [2, 3, 4]);
      const intercept = int(rng, 5, 20);
      const xVal = pick(rng, [8, 10, 12, 15, 20]);
      const predicted = slope * xVal + intercept;
      const gap = pick(rng, [3, 4, 5, 6]);
      const observed = predicted - gap;
      return numeric(ctx, {
        recipe: "prediction-residual-gap",
        stimulus: `The line of best fit for a data set is y = ${slope}x + ${intercept}. For one point in the set, x = ${xVal} and the observed value of y is ${observed}.`,
        question: "By how much does the predicted value exceed the observed value?",
        correct: gap, distractors: [predicted, observed, gap + xVal],
        explanation: `The predicted value is ${slope}(${xVal}) + ${intercept} = ${predicted}. The observed value is ${observed}, so the prediction exceeds it by ${predicted} − ${observed} = ${gap}.`,
        parameters: { slope, intercept, xVal, predicted, observed, gap }
      });
    }
    const sampleX = [1, 2, 3, 4, 5];
    const sampleY = sampleX.map((x) => m * x + b + pick(rng, [-2, -1, 0, 1, 2]));
    return conceptual(ctx, {
      recipe: "association-direction", figure: { kind: "scatter", label: `${context.yName} against ${context.xName}`, points: sampleX.map((x, i) => [x, sampleY[i]]) },
      question: "Which statement best describes the association?", correct: "There is a positive association: y generally increases as x increases.",
      distractors: ["There is a negative association: y generally decreases as x increases.", "There is no association because the points are not identical.", "The association proves that increasing x causes y to increase."],
      explanation: `The y-values generally rise with x, indicating positive association. Association alone does not establish causation.`, parameters: { sampleX, sampleY }
    });
  }

  // Five draw settings and five survey tables, so the easy and medium tiles are
  // not one bag of blue and red tiles with the counts rewritten.
  const DRAW_SETTINGS = [
    { container: "bag", item: "tile", plural: "tiles", target: "blue", other: "red", third: "white" },
    { container: "jar", item: "marble", plural: "marbles", target: "green", other: "yellow", third: "clear" },
    { container: "drawer", item: "pen", plural: "pens", target: "black", other: "silver", third: "purple" },
    { container: "box", item: "card", plural: "cards", target: "starred", other: "unmarked", third: "numbered" },
    { container: "basket", item: "ribbon", plural: "ribbons", target: "wide", other: "narrow", third: "striped" }
  ];

  const SURVEY_TABLES = [
    { caption: "Club membership by grade", rowLabel: "Grade", yes: "Member", no: "Not a member", first: "Junior", second: "Senior", noun: "member" },
    { caption: "Season pass by age group", rowLabel: "Age group", yes: "Has a pass", no: "No pass", first: "Adult", second: "Youth", noun: "pass holder" },
    { caption: "Bicycle ownership by household", rowLabel: "Household", yes: "Owns a bicycle", no: "Owns none", first: "Downtown", second: "Suburban", noun: "bicycle owner" },
    { caption: "Volunteer status by department", rowLabel: "Department", yes: "Volunteers", no: "Does not volunteer", first: "Records", second: "Outreach", noun: "volunteer" },
    { caption: "Language study by campus", rowLabel: "Campus", yes: "Studies a language", no: "Does not", first: "North", second: "River", noun: "language student" }
  ];

  function probability(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 6;
    const tierMode = index % 4;
    if (difficulty === "Easy") {
      const setting = pick(rng, DRAW_SETTINGS);
      const favorable = int(rng, 2, 9);
      let other = int(rng, 3, 12);
      while (other === favorable) other = int(rng, 3, 12);
      const total = favorable + other;
      if (tierMode === 0) {
        const correct = fraction(favorable, total);
        return conceptual(ctx, {
          recipe: "simple-probability", stimulus: `A ${setting.container} contains ${favorable} ${setting.target} ${setting.plural} and ${other} ${setting.other} ${setting.plural}. One ${setting.item} is chosen at random.`,
          question: `What is the probability of choosing a ${setting.target} ${setting.item}?`, correct,
          distractors: [fraction(favorable, total - 1), fraction(favorable, total + 1), fraction(other, total)],
          explanation: `There are ${favorable} favorable outcomes among ${total} equally likely ${setting.plural}, so the probability is ${favorable}/${total} = ${correct}.`,
          parameters: { setting, favorable, other }
        });
      }
      if (tierMode === 1) {
        const correct = fraction(other, total);
        return conceptual(ctx, {
          recipe: "complement-probability", stimulus: `A ${setting.container} contains ${favorable} ${setting.target} ${setting.plural} and ${other} ${setting.other} ${setting.plural}. One ${setting.item} is chosen at random.`,
          question: `What is the probability that the ${setting.item} chosen is not ${setting.target}?`, correct,
          distractors: [fraction(favorable, total), fraction(other, favorable), fraction(other, total + 1)],
          explanation: `Every ${setting.item} that is not ${setting.target} is one of the ${other} ${setting.other} ${setting.plural}, so the probability is ${other}/${total} = ${correct}. Subtracting from 1 gives the same value.`,
          parameters: { setting, favorable, other }
        });
      }
      if (tierMode === 2) {
        const third = int(rng, 4, 14);
        const tableTotal = favorable + other + third;
        const correct = fraction(third, tableTotal);
        return conceptual(ctx, {
          recipe: "probability-from-frequency-table",
          table: { caption: `${setting.plural[0].toUpperCase()}${setting.plural.slice(1)} in the ${setting.container}`, headers: ["Type", "Number"], rows: [[setting.target, favorable], [setting.other, other], [setting.third, third]] },
          question: `One ${setting.item} is chosen at random. What is the probability that it is ${setting.third}?`, correct,
          distractors: [fraction(third, favorable + other), fraction(favorable, tableTotal), fraction(third, tableTotal - third)],
          explanation: `The ${setting.container} holds ${tableTotal} ${setting.plural} in all, and ${third} of them are ${setting.third}, so the probability is ${third}/${tableTotal} = ${correct}.`,
          parameters: { setting, favorable, other, third }
        });
      }
      const third = int(rng, 4, 14);
      const unionTotal = favorable + other + third;
      const correct = fraction(favorable + other, unionTotal);
      return conceptual(ctx, {
        recipe: "union-of-categories", stimulus: `A ${setting.container} contains ${favorable} ${setting.target} ${setting.plural}, ${other} ${setting.other} ${setting.plural}, and ${third} ${setting.third} ${setting.plural}. One ${setting.item} is chosen at random.`,
        question: `What is the probability that the ${setting.item} is ${setting.target} or ${setting.other}?`, correct,
        distractors: [fraction(favorable, unionTotal), fraction(third, unionTotal), fraction(favorable + other, favorable + other + 1)],
        explanation: `The two categories do not overlap, so add them: ${favorable} + ${other} = ${favorable + other} favorable outcomes among ${unionTotal} ${setting.plural}, giving ${correct}.`,
        parameters: { setting, favorable, other, third }
      });
    }
    if (difficulty === "Medium" && tierMode === 0) {
      const survey = pick(rng, SURVEY_TABLES);
      const aYes = int(rng, 12, 30);
      const aNo = int(rng, 5, 15);
      let bYes = int(rng, 10, 25);
      while (bYes === aYes) bYes = int(rng, 10, 25);
      const bNo = int(rng, 4, 15);
      const correct = fraction(bYes, aYes + bYes);
      return conceptual(ctx, {
        recipe: "conditional-table", table: { caption: survey.caption, headers: [survey.rowLabel, survey.yes, survey.no], rows: [[survey.first, aYes, aNo], [survey.second, bYes, bNo]] },
        question: `If a ${survey.noun} is selected at random, what is the probability that the ${survey.noun} is in the ${survey.second} row?`, correct,
        distractors: [fraction(bYes, aYes + aNo + bYes + bNo), fraction(bYes, aYes + bYes - 1), fraction(bYes, aYes + bYes + 1)],
        explanation: `Condition on the ${survey.yes.toLowerCase()} column only. It holds ${aYes + bYes} people, of whom ${bYes} are ${survey.second}, so the probability is ${correct}.`,
        parameters: { survey, aYes, aNo, bYes, bNo }
      });
    }
    if (difficulty === "Medium" && tierMode === 1) {
      const pA = pick(rng, [0.2, 0.3, 0.4, 0.5]);
      const pB = pick(rng, [0.2, 0.25, 0.5]);
      const intersection = pA * pB;
      return numeric(ctx, {
        recipe: "independent-intersection", stimulus: `Events A and B are independent. P(A) = ${pA} and P(B) = ${pB}.`,
        question: "What is P(A and B)?", correct: numberText(intersection), accepted: [numberText(intersection), fraction(Math.round(intersection * 100), 100)],
        distractors: [numberText(pA + pB), numberText(pA - intersection), numberText(1 - intersection)],
        explanation: `For independent events, P(A and B) = P(A)P(B) = ${pA}(${pB}) = ${intersection}.`, parameters: { pA, pB, intersection }
      });
    }
    if (difficulty === "Medium" && tierMode === 2) {
      const survey = pick(rng, SURVEY_TABLES);
      const aYes = int(rng, 12, 30);
      const aNo = int(rng, 5, 15);
      const bYes = int(rng, 10, 25);
      const bNo = int(rng, 4, 15);
      const grandTotal = aYes + aNo + bYes + bNo;
      const correct = fraction(aNo, grandTotal);
      return conceptual(ctx, {
        recipe: "joint-from-table", table: { caption: survey.caption, headers: [survey.rowLabel, survey.yes, survey.no], rows: [[survey.first, aYes, aNo], [survey.second, bYes, bNo]] },
        question: `If one person is selected at random from all of those listed, what is the probability of selecting someone in the ${survey.first} row and the "${survey.no}" column?`, correct,
        distractors: [fraction(aNo, aYes + aNo), fraction(aNo, aNo + bNo), fraction(aYes, grandTotal)],
        explanation: `A joint probability uses the whole table as its denominator: ${aNo} of the ${grandTotal} people are ${survey.first} and in the "${survey.no}" column, so the probability is ${correct}.`,
        parameters: { survey, aYes, aNo, bYes, bNo }
      });
    }
    if (difficulty === "Medium") {
      const setting = pick(rng, DRAW_SETTINGS);
      const favorable = int(rng, 3, 8);
      const other = int(rng, 3, 9);
      const total = favorable + other;
      const correct = fraction(favorable * (favorable - 1), total * (total - 1));
      return conceptual(ctx, {
        recipe: "without-replacement-pair", stimulus: `A ${setting.container} contains ${favorable} ${setting.target} ${setting.plural} and ${other} ${setting.other} ${setting.plural}. Two ${setting.plural} are drawn at random, the first not replaced before the second.`,
        question: `What is the probability that both ${setting.plural} are ${setting.target}?`, correct,
        distractors: [fraction(favorable * favorable, total * total), fraction(favorable, total), fraction(favorable * (favorable - 1), total * total)],
        explanation: `The first draw is ${favorable}/${total}. One ${setting.target} ${setting.item} and one ${setting.item} overall are then gone, so the second is ${favorable - 1}/${total - 1}. Multiplying gives ${correct}.`,
        parameters: { setting, favorable, other }
      });
    }
    if (mode < 3) {
      const pA = pick(rng, [0.3, 0.4, 0.5, 0.6]);
      const pB = pick(rng, [0.2, 0.3, 0.4]);
      const overlap = Math.min(pA, pB) / 2;
      const union = pA + pB - overlap;
      return numeric(ctx, {
        recipe: "addition-rule", stimulus: `For events A and B, P(A) = ${pA}, P(B) = ${pB}, and P(A and B) = ${overlap}.`,
        question: "What is P(A or B)?", correct: numberText(union),
        distractors: [numberText(pA + pB), numberText(overlap), numberText(pA * pB)],
        explanation: `Use P(A or B) = P(A) + P(B) − P(A and B) = ${pA} + ${pB} − ${overlap} = ${union}.`, parameters: { pA, pB, overlap, union }
      });
    }
    if (mode === 5) {
      const yesA = int(rng, 2, 9) * 10;
      const noA = int(rng, 2, 9) * 10;
      const yesB = int(rng, 2, 9) * 10;
      const noB = int(rng, 2, 9) * 10;
      const table = {
        caption: "Survey responses by group",
        headers: ["Group", "Yes", "No", "Total"],
        rows: [["Group A", yesA, noA, yesA + noA], ["Group B", yesB, noB, yesB + noB], ["Total", yesA + yesB, noA + noB, yesA + noA + yesB + noB]]
      };
      return mcq(ctx, {
        recipe: "conditional-two-way-table", table,
        stimulus: "The table summarizes the responses of everyone who took part in a survey.",
        question: "If a respondent is selected at random from Group A, what is the probability that the respondent answered Yes?",
        correct: fraction(yesA, yesA + noA),
        distractors: [fraction(yesA, yesA + yesB), fraction(yesA, yesA + noA + yesB + noB), fraction(noA, yesA + noA)],
        explanation: `Restricting to Group A leaves ${yesA + noA} respondents, of whom ${yesA} answered Yes, so the probability is ${yesA}/${yesA + noA} = ${fraction(yesA, yesA + noA)}.`,
        parameters: { yesA, noA, yesB, noB }
      });
    }
    const probability = pick(rng, [0.12, 0.15, 0.2, 0.25, 0.3]);
    const trials = pick(rng, [100, 200, 400, 500]);
    const expected = probability * trials;
    return numeric(ctx, {
      recipe: "expected-count", stimulus: `An event has probability ${probability} on each of ${trials} trials.`,
      question: "About how many times is the event expected to occur?", correct: expected,
      distractors: [trials / probability, trials - expected, probability * 100],
      explanation: `Expected count is probability times number of trials: ${probability}(${trials}) = ${expected}.`, parameters: { probability, trials, expected }
    });
  }

  // Five survey settings so the easy and medium tiers are not one context with
  // the sample size rewritten.
  const SAMPLE_SETTINGS = [
    { group: "city residents", verb: "support", subject: "a transit proposal" },
    { group: "high school seniors", verb: "prefer", subject: "a later start time" },
    { group: "county farmers", verb: "use", subject: "a drip irrigation system" },
    { group: "museum visitors", verb: "finish", subject: "the audio tour" },
    { group: "clinic patients", verb: "schedule", subject: "an evening appointment" }
  ];

  function sampleInference(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 5;
    const tierMode = index % 4;
    if (difficulty === "Easy") {
      const setting = pick(rng, SAMPLE_SETTINGS);
      const sample = int(rng, 80, 300);
      const percent = pick(rng, [30, 40, 45, 50, 55, 60, 70]);
      if (tierMode === 0) {
        return conceptual(ctx, {
          recipe: "sample-statistic", stimulus: `In a random sample of ${sample} ${setting.group}, ${percent}% ${setting.verb} ${setting.subject}.`,
          question: "Which quantity is a sample statistic?", correct: `The ${percent}% of the sampled ${setting.group} who ${setting.verb} ${setting.subject}`,
          distractors: [
            `The ${percent}% of all ${setting.group} who ${setting.verb} ${setting.subject}`,
            `The count of ${setting.group} in the surrounding population`,
            `The percentage every later sample of ${setting.group} would report`
          ],
          explanation: `A sample statistic describes the group that was actually observed. Applying the same ${percent}% to all ${setting.group} would instead be an estimate of a population parameter.`,
          parameters: { setting, sample, percent }
        });
      }
      if (tierMode === 1) {
        const margin = int(rng, 2, 6);
        return conceptual(ctx, {
          recipe: "margin-meaning", stimulus: `A random sample of ${sample} ${setting.group} gives an estimate of ${percent}%, with a margin of error of ${margin} percentage points.`,
          question: "What does the margin of error indicate?", correct: "How far the true value for the whole group is likely to lie from the reported result",
          distractors: [
            `How many of the sampled ${setting.group} answered the survey question incorrectly`,
            `The share of the ${sample} ${setting.group} that the researcher was unable to reach`,
            `The gap between the largest and smallest percentages any ${setting.group.replace(/s$/, "")} reported`
          ],
          explanation: `The margin of error describes the precision of the estimate: the population percentage is likely to lie within ${margin} percentage points of ${percent}%. It does not measure response errors or nonresponse.`,
          parameters: { setting, sample, percent, margin }
        });
      }
      if (tierMode === 2) {
        const first = pick(rng, [120, 150, 200, 250]);
        const second = first * pick(rng, [3, 4, 5]);
        return conceptual(ctx, {
          recipe: "sample-size-direction", stimulus: `Two random samples of ${setting.group} are drawn from the same population by the same method. Sample A has ${first} people and Sample B has ${second}.`,
          question: "Which sample is expected to give the smaller margin of error, and why?", correct: "Sample B, because a larger random sample estimates the population more precisely",
          distractors: [
            "Sample A, because a smaller group of people can be surveyed completely",
            "Sample B, because a larger random sample removes bias from the estimate",
            "Neither, because the two samples were drawn by the same sampling method"
          ],
          explanation: `Margin of error shrinks as sample size grows, so Sample B's ${second} observations give the more precise estimate. Sample size affects precision, not bias, which is controlled by how the sample is drawn.`,
          parameters: { setting, first, second }
        });
      }
      return conceptual(ctx, {
        recipe: "random-selection-purpose", stimulus: `To estimate the percentage of ${setting.group} who ${setting.verb} ${setting.subject}, a researcher surveys ${sample} ${setting.group} chosen at random from that population.`,
        question: "Why did the researcher choose the sample at random?", correct: "So the surveyed group is likely to resemble the larger one it came from",
        distractors: [
          `So the percentage of surveyed ${setting.group} who ${setting.verb} ${setting.subject} equals the population percentage`,
          `So the ${sample} surveyed ${setting.group} can each be reached a second time`,
          `So every ${setting.group.replace(/s$/, "")} in the population ${setting.verb}s ${setting.subject} at the same rate`
        ],
        explanation: `Random selection makes the sample likely to resemble the population, which is what allows the estimate to be generalized. It does not force the sample percentage to match the population exactly or eliminate the margin of error.`,
        parameters: { setting, sample }
      });
    }
    if (difficulty === "Medium") {
      const setting = pick(rng, SAMPLE_SETTINGS);
      if (tierMode === 0) {
        const estimate = int(rng, 35, 70);
        const margin = int(rng, 2, 6);
        return conceptual(ctx, {
          recipe: "margin-interval", stimulus: `A random-sample estimate of the percentage of ${setting.group} who ${setting.verb} ${setting.subject} is ${estimate}%, with a margin of error of ${margin} percentage points.`,
          question: "Which interval is the corresponding plausible range for the population percentage?", correct: `${estimate - margin}% to ${estimate + margin}%`,
          distractors: [`${estimate}% to ${estimate + margin}%`, `${estimate - 2 * margin}% to ${estimate + 2 * margin}%`, `${margin}% to ${estimate}%`],
          explanation: `Subtract and add the margin of error: ${estimate} − ${margin} = ${estimate - margin} and ${estimate} + ${margin} = ${estimate + margin}.`,
          parameters: { setting, estimate, margin }
        });
      }
      if (tierMode === 1) {
        const center = int(rng, 35, 70);
        const margin = int(rng, 2, 6);
        const low = center - margin;
        const high = center + margin;
        return conceptual(ctx, {
          recipe: "interval-to-estimate", stimulus: `A study of ${setting.group} reports a plausible range of ${low}% to ${high}% for the percentage who ${setting.verb} ${setting.subject}.`,
          question: "What estimate and margin of error produced this range?", correct: `${center}%, with a margin of error of ${margin} percentage points`,
          distractors: [
            `${center}%, with a margin of error of ${high - low} percentage points`,
            `${low}%, with a margin of error of ${high - low} percentage points`,
            `${high}%, with a margin of error of ${margin} percentage points`
          ],
          explanation: `The estimate sits at the center of the range: (${low} + ${high}) ÷ 2 = ${center}. The margin of error is the distance to either endpoint, ${high} − ${center} = ${margin}, not the full width of ${high - low}.`,
          parameters: { setting, center, margin, low, high }
        });
      }
      if (tierMode === 2) {
        const estimate = int(rng, 38, 66);
        const margin = int(rng, 3, 6);
        const inside = estimate + pick(rng, [-1, 0, 1]) * (margin - 1);
        const outside = [estimate + margin + int(rng, 2, 7), estimate - margin - int(rng, 2, 7), estimate + margin + int(rng, 9, 15)];
        return conceptual(ctx, {
          recipe: "plausible-population-value", stimulus: `A random sample of ${setting.group} gives an estimate of ${estimate}% who ${setting.verb} ${setting.subject}, with a margin of error of ${margin} percentage points.`,
          question: "Which value for the population percentage is most plausible according to this result?", correct: `${inside}%`,
          distractors: outside.map((value) => `${value}%`),
          explanation: `The result makes population percentages between ${estimate - margin}% and ${estimate + margin}% plausible. Only ${inside}% falls in that range.`,
          parameters: { setting, estimate, margin, inside, outside }
        });
      }
      const firstEstimate = int(rng, 40, 55);
      const gap = int(rng, 1, 3);
      const secondEstimate = firstEstimate + gap;
      const spread = gap + int(rng, 2, 4);
      return conceptual(ctx, {
        recipe: "overlapping-intervals",
        stimulus: `In two random samples of ${setting.group}, the estimated percentage who ${setting.verb} ${setting.subject} is ${firstEstimate}% in the first group and ${secondEstimate}% in the second. Each estimate has a margin of error of ${spread} percentage points.`,
        question: "Which conclusion is best supported by these results?",
        correct: "The two population percentages could be equal, because the plausible ranges overlap",
        distractors: [
          "The second population percentage is greater, because its sample estimate is greater",
          `The two population percentages differ by exactly ${gap} percentage points`,
          "Neither estimate is usable, because the two plausible ranges overlap"
        ],
        explanation: `The ranges are ${firstEstimate - spread}%–${firstEstimate + spread}% and ${secondEstimate - spread}%–${secondEstimate + spread}%. Because they overlap, the difference of ${gap} percentage points between the samples does not establish a difference between the populations.`,
        parameters: { setting, firstEstimate, secondEstimate, gap, spread }
      });
    }
    if (mode === 2) {
      const setting = pick(rng, SAMPLE_SETTINGS);
      const shrink = pick(rng, [2, 3, 4, 5]);
      return numeric(ctx, {
        recipe: "sample-size-for-margin",
        stimulus: `A survey of ${setting.group} has a margin of error inversely proportional to the square root of its sample size.`,
        question: `To reduce that margin of error to 1/${shrink} of its current value, by what factor must the sample size be multiplied?`,
        correct: shrink * shrink, distractors: [shrink, shrink * 2, shrink + 1],
        explanation: `Margin of error varies with 1/√n, so dividing it by ${shrink} requires √n to grow by a factor of ${shrink}, which means n grows by ${shrink}² = ${shrink * shrink}.`,
        parameters: { setting, shrink }
      });
    }
    if (mode < 3) {
      const factor = pick(rng, [4, 9, 16]);
      const ratio = fraction(1, Math.sqrt(factor));
      const first = pick(rng, [100, 200, 400]);
      const second = first * factor;
      return conceptual(ctx, {
        recipe: "sample-size-margin", stimulus: `Random samples A and B use the same method. A has ${first} observations and B has ${second}.`,
        question: "Approximately what fraction of A's margin of error will B's margin of error be?", correct: ratio,
        distractors: [fraction(1, factor), String(Math.sqrt(factor)), String(factor)],
        explanation: `Margin of error varies approximately with 1/√n. Sample B is ${factor} times as large, so its margin is 1/√${factor} = ${ratio} as large.`, parameters: { factor, first, second }
      });
    }
    if (mode === 4) {
      const center = int(rng, 20, 60);
      const margin = pick(rng, [2, 3, 4, 5]);
      const low = center - margin;
      const high = center + margin;
      return conceptual(ctx, {
        recipe: "interval-interpretation",
        stimulus: `Using a random sample of residents, a study reports a 95% confidence interval of ${low} to ${high} for the mean number of hours residents work each week.`,
        question: "Which statement is the most appropriate conclusion?",
        correct: `It is plausible that the mean for all residents is between ${low} and ${high} hours.`,
        distractors: [`Exactly 95% of the residents surveyed worked between ${low} and ${high} hours.`, `The mean for the residents who were surveyed is below ${low} hours per week.`, `Every random sample of this size would give a mean between ${low} and ${high}.`],
        explanation: `A confidence interval describes plausible values for the population mean. It does not describe the spread of individual responses, the sample's own mean, or the result of every future sample.`,
        parameters: { center, margin, low, high }
      });
    }
    const percent = int(rng, 35, 79);
    const district = pick(rng, ["North", "Central", "Riverside", "Lakeview", "Westfield"]);
    return conceptual(ctx, {
      recipe: "generalize-random-sample", stimulus: `A researcher takes a large random sample from all students enrolled in the ${district} School District and finds that ${percent}% prefer a later start time.`,
      question: "To which group can the result most appropriately be generalized?", correct: "All students enrolled in that school district",
      distractors: [
        "Students enrolled in every school district in the state",
        "The students in the random sample who prefer a later start time",
        `All adults enrolled in any program the ${district} School District runs`
      ],
      explanation: `A well-drawn random sample supports generalization to the population from which it was randomly selected: the district's enrolled students.`, parameters: { percent, district }
    });
  }

  function statisticalClaims(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 6;
    const tierMode = index % 4;
    const treatment = pick(rng, ["study routine", "exercise program", "fertilizer", "sleep schedule", "tutoring format", "irrigation schedule"]);
    const participants = int(rng, 80, 480);
    if (difficulty === "Easy" && tierMode === 0) {
      return conceptual(ctx, {
        recipe: "random-assignment", stimulus: `Researchers randomly assign ${participants} volunteers either to use a new ${treatment} or to continue their usual routine.`,
        question: "What does random assignment primarily allow the researchers to do?", correct: "Support a cause-and-effect conclusion about the treatment",
        distractors: ["Generalize the findings to the wider population of interest", "Remove the need for a comparison group in the analysis", "Ensure the two groups end up with equal average outcomes"],
        explanation: `Random assignment tends to balance preexisting differences between treatment groups, allowing a causal comparison. It does not ensure population representativeness.`, parameters: { treatment, participants }
      });
    }
    if (difficulty === "Easy" && tierMode === 1) {
      const group = pick(rng, ["registered voters", "hospital nurses", "season ticket holders", "licensed drivers", "third-year apprentices"]);
      return conceptual(ctx, {
        recipe: "random-selection-role", stimulus: `A researcher surveys ${participants} ${group} chosen at random from a complete list of all ${group} in the region.`,
        question: "What does selecting the sample at random primarily allow the researcher to do?", correct: `Extend the findings to the region's ${group}`,
        distractors: [
          `Conclude that being surveyed changed how the ${group} responded`,
          `Establish which factor causes the pattern seen among the ${group}`,
          `Guarantee that the sample percentage matches the regional percentage`
        ],
        explanation: `Random selection from the full list makes the sample likely to represent the region's ${group}, which supports generalization. Causal claims require a randomly assigned treatment, which this survey does not have.`,
        parameters: { group, participants }
      });
    }
    if (difficulty === "Easy" && tierMode === 2) {
      return conceptual(ctx, {
        recipe: "control-group-purpose", stimulus: `In a study of a new ${treatment}, one randomly assigned group uses it while a second randomly assigned group continues as before.`,
        question: "Why does the study include the second group?", correct: "To show what would have happened without the new treatment",
        distractors: [
          "To increase the number of participants who receive the new treatment",
          "To let participants pick the condition they would rather be in",
          "To make the study's results apply to the whole population"
        ],
        explanation: `The comparison group establishes a baseline. Without it, any change among the treated participants could be explained by time, practice, or other influences rather than the ${treatment}.`,
        parameters: { treatment, participants }
      });
    }
    if (difficulty === "Easy") {
      const habit = pick(rng, ["cycle to work", "keep a garden", "join a choir", "walk after dinner", "read before bed"]);
      return conceptual(ctx, {
        recipe: "study-type-identification", stimulus: `Researchers record which of ${participants} adults already ${habit} and compare the two groups' reported energy levels. No one is told what to do.`,
        question: "Which best describes this study?", correct: "An observational study, because the researchers did not assign the behavior",
        distractors: [
          "An experiment, because two groups are compared against each other",
          "An experiment, because the researchers chose which measurements to record",
          "An observational study, because the researchers surveyed fewer than 500 adults"
        ],
        explanation: `What makes a study an experiment is the researcher assigning the condition. Here the adults already ${habit} or did not, so the study only observes; comparing groups and choosing measurements happen in both kinds of study.`,
        parameters: { habit, participants }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      const city = pick(rng, ["Bayport", "Lake City", "Riverton", "Oak Falls", "Pine Hill"]);
      const sampleSize = int(rng, 150, 950);
      return conceptual(ctx, {
        recipe: "random-sampling-versus-assignment", stimulus: `A random sample of ${sampleSize} ${city} residents is surveyed about transit. No treatment is imposed.`,
        question: "Which conclusion is best supported?", correct: "The results may be generalized to the city's residents, but they cannot establish causation.",
        distractors: ["The results establish that transit preferences cause the observed commuting behavior.", "The results describe only the residents sampled and cannot extend beyond them.", "The results identify which transit improvement residents would benefit from most."],
        explanation: `Random sampling supports generalization to the sampled population. Without a randomly assigned treatment, the study cannot establish a causal effect.`, parameters: { city, sampleSize }
      });
    }
    if (difficulty === "Medium" && mode === 3) {
      const site = pick(rng, ["a single gym", "one online forum", "a weekend farmers market", "one commuter platform", "a university mailing list"]);
      const responses = int(rng, 120, 900);
      return conceptual(ctx, {
        recipe: "convenience-sample-limit",
        stimulus: `To estimate a citywide opinion, a researcher collects ${responses} responses from volunteers recruited at ${site}.`,
        question: "What is the main limitation of this study?",
        correct: "The volunteers may differ systematically from the city's residents",
        distractors: [
          `Collecting ${responses} responses is too few to describe a city`,
          "The researcher recorded opinions rather than assigning a treatment",
          "The volunteers were not told the purpose of the study in advance"
        ],
        explanation: `People who volunteer at ${site} are not a random sample of the city, so the estimate can be biased no matter how many responses are gathered. Sample size does not repair a sample drawn from the wrong group.`,
        parameters: { site, responses }
      });
    }
    if (difficulty === "Medium") {
      const pair = pick(rng, [
        ["students who sleep more", "earn higher grades", "amount of sleep", "grades"],
        ["adults who exercise more", "report lower stress", "amount of exercise", "stress"],
        ["towns with more parks", "have lower summer temperatures", "number of parks", "summer temperature"],
        ["workers with shorter commutes", "report greater job satisfaction", "commute length", "job satisfaction"]
      ]);
      const observations = int(rng, 120, 980);
      return conceptual(ctx, {
        recipe: "observational-confounding", stimulus: `In an observational study of ${observations} cases, researchers find that ${pair[0]} tend to ${pair[1]}.`,
        question: `Why does this result not by itself establish that ${pair[2]} causes a change in ${pair[3]}?`, correct: `Other variables may be related to both ${pair[2]} and ${pair[3]}.`,
        distractors: [`The study recorded ${pair[3]} after ${pair[2]} rather than before it.`, "The observed cases were not divided evenly between the two categories.", `The measured association between ${pair[2]} and ${pair[3]} was fairly modest.`],
        explanation: `Because ${pair[2]} was observed rather than randomly assigned, confounding variables could help explain the association.`, parameters: { pair, observations }
      });
    }
    if (mode < 3) {
      const options = ctx.practiceSet === 2
        ? [["reading workshops", "reading-assessment scores"], ["garden training", "crop yields"], ["coding lessons", "programming-assessment scores"], ["financial coaching", "savings rates"], ["language classes", "fluency ratings"]]
        : [["tutoring", "end-of-year scores"], ["fitness coaching", "fitness-test scores"], ["music lessons", "performance ratings"], ["meal planning", "nutrition ratings"], ["test-prep classes", "practice-test scores"]];
      const [program, outcome] = pick(rng, options);
      return conceptual(ctx, {
        recipe: "matched-control", stimulus: `To test a ${program} program, researchers let participants choose whether to enroll and then compare ${outcome}.`,
        question: "What is the most serious threat to a causal conclusion?", correct: `Participants who choose to enroll may differ from those who decline in ways that affect ${outcome}.`,
        distractors: [`Researchers compare ${outcome} for participants who enroll without measuring it beforehand.`, `Participants who enroll in the program report ${outcome} more often than those who decline.`, `Researchers let participants choose, so the program enrolled more participants than expected.`],
        explanation: `Self-selection can create systematic preexisting differences between groups. Random assignment would better isolate the program's effect.`, parameters: { program, outcome }
      });
    }
    if (mode === 5) {
      const [factor, result] = pick(rng, [["daily walking", "lower blood pressure"], ["morning study sessions", "higher exam scores"], ["regular shared meals", "stronger reported wellbeing"], ["earlier bedtimes", "faster reaction times"]]);
      return conceptual(ctx, {
        recipe: "observational-limit",
        stimulus: `In a large observational study, adults who reported ${factor} also showed ${result}. Participants chose their own routines, and the sample was drawn at random from the population.`,
        question: "Which conclusion does the study best support?",
        correct: `There is an association between ${factor} and ${result} among adults in this population.`,
        distractors: [`Adults who took up ${factor} in this study were caused to show ${result} by doing so.`, `Some routine other than ${factor} is what produced ${result} in the adults studied.`, `The link between ${factor} and ${result} would appear in any population that was studied.`],
        explanation: `Random sampling supports generalizing an association to the population sampled. Without random assignment the study cannot establish that ${factor} causes ${result}, and it cannot rule that possibility out either.`,
        parameters: { factor, result }
      });
    }
    const intervention = pick(rng, ["vocabulary app", "memory game", "reading strategy", "practice schedule", "note-taking tool"]);
    const outcome = pick(rng, ["vocabulary scores", "recall scores", "reading scores", "quiz scores"]);
    return conceptual(ctx, {
      recipe: "experiment-design", stimulus: `A researcher wants to test whether a new ${intervention} improves ${outcome}.`,
      question: "Which design best supports a causal conclusion?", correct: "Randomly assign participants to the intervention or a comparison method, then compare gains.",
      distractors: ["Compare volunteers who already use the intervention with people who have never tried it.", "Give the intervention to everyone and record their scores at the end of the study.", "Ask participants afterward whether they believe the intervention improved their scores."],
      explanation: `Random assignment and a comparison group isolate the intervention as the systematic difference between groups, making a causal conclusion most defensible.`, parameters: { intervention, outcome }
    });
  }

  function areaVolume(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 6;
    if (difficulty === "Easy") {
      const length = int(rng, 5, 18);
      const width = int(rng, 3, 14);
      const area = length * width;
      if (mode === 1 || mode === 4) {
        const perimeter = 2 * (length + width);
        return numeric(ctx, {
          recipe: "rectangle-perimeter", stimulus: `A rectangle has length ${length} cm and width ${width} cm.`, question: "What is its perimeter, in centimeters?", correct: perimeter,
          distractors: [perimeter + length, perimeter - width, perimeter + 1],
          explanation: `Rectangle perimeter is 2(length + width) = 2(${length} + ${width}) = ${perimeter} cm.`, parameters: { length, width, perimeter }
        });
      }
      if (mode === 2 || mode === 5) {
        const radius = int(rng, 3, 10);
        return conceptual(ctx, {
          recipe: "circle-area", stimulus: `A circle has radius ${radius}.`, question: "What is its area?", correct: `${radius * radius}π`,
          distractors: [`${2 * radius}π`, `${radius}π`, `${4 * radius * radius}π`],
          explanation: `Circle area is πr² = π(${radius})² = ${radius * radius}π.`, parameters: { radius }
        });
      }
      return numeric(ctx, {
        recipe: "rectangle-area", stimulus: `A rectangle has length ${length} cm and width ${width} cm.`, question: "What is its area, in square centimeters?", correct: area,
        distractors: [area + length, area - width, area + 1],
        explanation: `Rectangle area is length × width: ${length}(${width}) = ${area} cm².`, parameters: { length, width, area }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      if (mode === 2) {
        const length = int(rng, 4, 10);
        const width = int(rng, 3, 9);
        const height = int(rng, 2, 8);
        const surfaceArea = 2 * (length * width + length * height + width * height);
        return numeric(ctx, {
          recipe: "rectangular-prism-surface-area", stimulus: `A rectangular prism has length ${length}, width ${width}, and height ${height}.`,
          question: "What is its surface area?", correct: surfaceArea,
          distractors: [length * width * height, length * width + length * height + width * height, 2 * (length + width + height)],
          explanation: `Surface area is 2(lw + lh + wh) = 2(${length * width} + ${length * height} + ${width * height}) = ${surfaceArea}.`, parameters: { length, width, height, surfaceArea }
        });
      }
      const radius = int(rng, 3, 8);
      const height = int(rng, 3, 12);
      const coefficient = radius * radius * height;
      return conceptual(ctx, {
        recipe: "cylinder-volume", stimulus: `A right circular cylinder has radius ${radius} and height ${height}.`,
        question: "What is its volume?", correct: `${coefficient}π`,
        distractors: [`${coefficient - radius}π`, `${coefficient + radius}π`, `${coefficient + radius + 1}π`],
        explanation: `V = πr²h = π(${radius})²(${height}) = ${coefficient}π.`, parameters: { radius, height, coefficient }
      });
    }
    if (difficulty === "Medium") {
      const base = int(rng, 4, 12);
      const height = int(rng, 4, 14);
      const triangle = base * height / 2;
      return numeric(ctx, {
        recipe: "triangle-area", stimulus: `A triangle has base ${base} and perpendicular height ${height}.`, question: "What is its area?", correct: triangle,
        distractors: [base * height, base + height, 2 * (base + height)],
        explanation: `Triangle area is 1/2 bh = 1/2(${base})(${height}) = ${triangle}.`, parameters: { base, height, triangle }
      });
    }
    if (mode < 3) {
      const linearNumerator = pick(rng, [2, 3, 4]);
      const linearDenominator = linearNumerator + int(rng, 1, 3);
      const largeVolume = linearDenominator ** 3 * int(rng, 4, 12);
      const smallVolume = largeVolume * linearNumerator ** 3 / linearDenominator ** 3;
      return numeric(ctx, {
        recipe: "similar-solids", stimulus: `Two solids are similar. Their smaller-to-larger linear scale factor is ${linearNumerator}:${linearDenominator}. The larger volume is ${largeVolume}.`,
        question: "What is the smaller volume?", correct: smallVolume,
        distractors: [largeVolume * linearNumerator / linearDenominator, largeVolume * linearNumerator ** 2 / linearDenominator ** 2, largeVolume - smallVolume],
        explanation: `Volumes scale by the cube of the linear factor: ${largeVolume}(${linearNumerator}/${linearDenominator})³ = ${smallVolume}.`, parameters: { linearNumerator, linearDenominator, largeVolume, smallVolume }
      });
    }
    if (mode === 5) {
      const radius = int(rng, 2, 9);
      const height = int(rng, 2, 12);
      const volume = radius * radius * height;
      return numeric(ctx, {
        recipe: "cylinder-radius-from-volume",
        stimulus: `A right circular cylinder has a volume of ${volume}π cubic centimeters and a height of ${height} centimeters.`,
        question: "What is the radius of the cylinder, in centimeters?",
        correct: radius, distractors: [radius * radius, radius + 1, height],
        explanation: `The volume of a cylinder is πr²h, so ${volume}π = πr²(${height}). Dividing gives r² = ${radius * radius}, and therefore r = ${radius}.`,
        parameters: { radius, height, volume }
      });
    }
    const ratioN = pick(rng, [4, 9, 16, 25]);
    const ratioD = pick(rng, [36, 49, 64, 81]);
    const rootN = Math.sqrt(ratioN);
    const rootD = Math.sqrt(ratioD);
    const linear = rootN / rootD;
    const linearText = fraction(rootN, rootD);
    const areaFactor = ratioN / ratioD;
    return conceptual(ctx, {
      recipe: "surface-area-scale", stimulus: `Two similar figures have smaller-to-larger surface-area ratio ${ratioN}:${ratioD}.`,
      question: "What is their smaller-to-larger linear scale factor?", correct: linearText,
      distractors: [numberText(areaFactor), numberText(ratioD / ratioN), numberText(Math.cbrt(areaFactor))],
      explanation: `Area ratios are squares of linear ratios, so the linear factor is √(${ratioN}/${ratioD}) = ${linearText}.`, parameters: { ratioN, ratioD, linear }
    });
  }

  function linesAnglesTriangles(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 6;
    if (difficulty === "Easy") {
      if (mode === 1 || mode === 4) {
        const angle = int(rng, 35, 145);
        return numeric(ctx, {
          recipe: "vertical-angles", stimulus: `Two lines intersect. One of the angles formed measures ${angle}°.`,
          question: "What is the measure of the vertical angle opposite it?", correct: angle,
          distractors: [180 - angle, 90 - Math.min(angle, 90), 360 - angle],
          explanation: `Vertical angles are congruent, so the opposite angle also measures ${angle}°.`, parameters: { angle }
        });
      }
      if (mode === 2 || mode === 5) {
        const angle = int(rng, 35, 145);
        return numeric(ctx, {
          recipe: "parallel-corresponding-angles", stimulus: `A transversal crosses two parallel lines. One angle measures ${angle}°.`,
          question: "What is the measure of its corresponding angle?", correct: angle,
          distractors: [180 - angle, 90, 360 - angle],
          explanation: `When parallel lines are cut by a transversal, corresponding angles are congruent.`, parameters: { angle }
        });
      }
      const first = int(rng, 30, 80);
      const second = int(rng, 30, 140 - first);
      const third = 180 - first - second;
      return numeric(ctx, {
        recipe: "triangle-angle-sum", stimulus: `A triangle has angle measures ${first}° and ${second}°.`, question: "What is the third angle measure?", correct: third,
        distractors: [180 - first, first + second, 360 - first - second],
        explanation: `Triangle angles sum to 180°, so the third angle is 180 − ${first} − ${second} = ${third}°.`, parameters: { first, second, third }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      const scaleN = int(rng, 2, 6);
      const scaleD = scaleN + int(rng, 1, 4);
      const small = scaleN * int(rng, 2, 7);
      const corresponding = scaleD * (small / scaleN);
      return numeric(ctx, {
        recipe: "similar-triangle-side", stimulus: `Triangles ABC and DEF are similar. Side AB = ${scaleN}, corresponding side DE = ${scaleD}, and side BC = ${small}.`,
        question: "What is the length of corresponding side EF?", correct: corresponding,
        distractors: [small * scaleN / scaleD, small + scaleD - scaleN, small * scaleD],
        explanation: `The scale factor from ABC to DEF is ${scaleD}/${scaleN}. Thus EF = ${small}(${scaleD}/${scaleN}) = ${corresponding}.`, parameters: { scaleN, scaleD, small, corresponding }
      });
    }
    if (difficulty === "Medium") {
      const angle = int(rng, 35, 145);
      return numeric(ctx, {
        recipe: "linear-pair", stimulus: `Two adjacent angles form a straight line. One angle measures ${angle}°.`, question: "What is the measure of the other angle?", correct: 180 - angle,
        distractors: [angle, 90 - angle, 360 - angle],
        explanation: `A linear pair is supplementary, so the other angle is 180 − ${angle} = ${180 - angle}°.`, parameters: { angle }
      });
    }
    if (mode < 3) {
      const x = int(rng, 5, 20);
      const a = int(rng, 2, 5);
      const b = int(rng, 1, 4);
      const first = a * x + b;
      const secondConstant = 180 - first + a * x;
      return numeric(ctx, {
        recipe: "algebraic-supplementary", stimulus: `Two same-side interior angles formed by a transversal of parallel lines measure (${a}x + ${b})° and (${a}x + ${secondConstant})°.`,
        question: "What is x?", correct: x,
        distractors: [180 - x, 2 * x, x + b],
        explanation: `Same-side interior angles are supplementary. Solving (${a}x + ${b}) + (${a}x + ${secondConstant}) = 180 gives x = ${x}.`, parameters: { a, b, secondConstant, x }
      });
    }
    if (mode === 3 || mode === 4) {
      const side1 = int(rng, 4, 14);
      const side2 = int(rng, 5, 16);
      return conceptual(ctx, {
        recipe: "triangle-congruence-sufficiency", stimulus: `Triangles ABC and DEF satisfy AB = DE = ${side1} and BC = EF = ${side2}.`,
        question: "Which additional fact is sufficient to prove the triangles congruent by SAS?", correct: "∠B = ∠E",
        distractors: ["∠A = ∠F", "AC is parallel to DF", "The triangles have equal perimeters"],
        explanation: `SAS requires two corresponding sides and the included angle. The angle between AB and BC is ∠B, corresponding to ∠E between DE and EF.`, parameters: { side1, side2 }
      });
    }
    const interior = int(rng, 35, 80);
    const other = int(rng, 35, 120 - interior);
    const exterior = interior + other;
    return numeric(ctx, {
      recipe: "exterior-angle", stimulus: `Two remote interior angles of a triangle measure ${interior}° and ${other}°.`,
      question: "What is the measure of the exterior angle at the third vertex?", correct: exterior,
      distractors: [180 - exterior, Math.abs(interior - other), 180 - interior],
      explanation: `An exterior angle equals the sum of the two remote interior angles: ${interior} + ${other} = ${exterior}°.`, parameters: { interior, other, exterior }
    });
  }

  function rightTrianglesTrig(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 6;
    const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
    const triple = pick(rng, triples);
    const scale = ctx.practiceSet === 2 ? int(rng, 3, 6) : int(rng, 1, difficulty === "Hard" ? 4 : 2);
    const [a, b, c] = triple.map((value) => value * scale);
    const tierMode = index % 4;
    if (difficulty === "Easy" && tierMode === 0) {
      return numeric(ctx, {
        recipe: "pythagorean-hypotenuse", stimulus: `A right triangle has leg lengths ${a} and ${b}.`, question: "What is the hypotenuse length?", correct: c,
        distractors: [a + b, Math.abs(b - a), a * b],
        explanation: `By the Pythagorean theorem, c = √(${a}² + ${b}²) = ${c}.`, parameters: { a, b, c }
      });
    }
    if (difficulty === "Easy" && tierMode === 1) {
      return numeric(ctx, {
        recipe: "pythagorean-leg", stimulus: `A right triangle has hypotenuse length ${c} and one leg of length ${b}.`, question: "What is the length of the other leg?", correct: a,
        distractors: [c - b, c + b, Math.abs(b - a) || b],
        explanation: `Rearrange the Pythagorean theorem: the missing leg is √(${c}² − ${b}²) = √${c * c - b * b} = ${a}. Subtracting the lengths instead would give ${c - b}.`,
        parameters: { a, b, c }
      });
    }
    if (difficulty === "Easy" && tierMode === 2) {
      const area = a * b / 2;
      return numeric(ctx, {
        recipe: "right-triangle-area", stimulus: `A right triangle has legs of length ${a} and ${b} and hypotenuse ${c}.`, question: "What is the area of the triangle?", correct: area,
        distractors: [a * b, a + b + c, c * Math.min(a, b) / 2],
        explanation: `The two legs are perpendicular, so they serve as base and height: area = (${a})(${b}) ÷ 2 = ${area}. The hypotenuse is not used.`,
        parameters: { a, b, c, area }
      });
    }
    if (difficulty === "Easy") {
      return conceptual(ctx, {
        recipe: "identify-trig-ratio", stimulus: `In a right triangle, acute angle θ has an opposite side of length ${a}, an adjacent side of length ${b}, and a hypotenuse of length ${c}.`,
        question: "What is tan θ?", correct: fraction(a, b),
        distractors: [fraction(a, c), fraction(b, c), fraction(b, a)],
        explanation: `Tangent is opposite over adjacent: ${a}/${b}${`${a}/${b}` === fraction(a, b) ? "" : ` = ${fraction(a, b)}`}. Dividing by the hypotenuse ${c} instead would give the sine or the cosine.`,
        parameters: { a, b, c }
      });
    }
    if (difficulty === "Medium" && tierMode === 0) {
      const kind = pick(rng, ["sin", "cos", "tan"]);
      const ratio = kind === "sin" ? fraction(a, c) : kind === "cos" ? fraction(b, c) : fraction(a, b);
      const definition = kind === "sin" ? "opposite/hypotenuse" : kind === "cos" ? "adjacent/hypotenuse" : "opposite/adjacent";
      const numeratorValue = kind === "cos" ? b : a;
      const denominatorValue = kind === "tan" ? b : c;
      return conceptual(ctx, {
        recipe: "trig-ratio", stimulus: `In a right triangle, relative to acute angle θ, the opposite side is ${a}, the adjacent side is ${b}, and the hypotenuse is ${c}.`,
        question: `What is ${kind} θ?`, correct: ratio,
        distractors: [fraction(a, c), fraction(b, c), fraction(a, b), fraction(c, a)].filter((value) => value !== ratio),
        explanation: `${kind} θ = ${definition} = ${numeratorValue}/${denominatorValue} = ${ratio}.`,
        parameters: { a, b, c, kind }
      });
    }
    if (difficulty === "Medium" && tierMode === 1) {
      const short = ctx.practiceSet === 2 ? int(rng, 11, 20) : int(rng, 2, 10);
      return conceptual(ctx, {
        recipe: "thirty-sixty-ninety", stimulus: `A 30°-60°-90° triangle has shorter leg length ${short}.`,
        question: "What is its hypotenuse length?", correct: String(2 * short),
        distractors: [`${short}√2`, `${short}√3`, String(short * 3)],
        explanation: `In a 30°-60°-90° triangle, the side ratio is 1:√3:2. The hypotenuse is twice the shorter leg: ${2 * short}.`, parameters: { short }
      });
    }
    if (difficulty === "Medium" && tierMode === 2) {
      const leg = ctx.practiceSet === 2 ? int(rng, 11, 20) : int(rng, 2, 10);
      return conceptual(ctx, {
        recipe: "forty-five-forty-five-ninety", stimulus: `An isosceles right triangle has legs of length ${leg}.`,
        question: "What is its hypotenuse length?", correct: `${leg}√2`,
        distractors: [`${leg}√3`, String(2 * leg), `${leg}/√2`],
        explanation: `The two legs are equal, so the side ratio is 1:1:√2 and the hypotenuse is ${leg}√2. Doubling the leg would apply the 30°-60°-90° relationship instead.`,
        parameters: { leg }
      });
    }
    if (difficulty === "Medium") {
      const opposite = a;
      return numeric(ctx, {
        recipe: "side-from-sine", stimulus: `In right triangle ABC, the right angle is at C, sin A = ${fraction(triple[0], triple[2])}, and the hypotenuse AB has length ${c}.`,
        question: "What is the length of side BC, which is opposite angle A?", correct: opposite,
        distractors: [b, c - a, triple[0]],
        explanation: `sin A is the ratio of the opposite side to the hypotenuse, so BC = ${fraction(triple[0], triple[2])} × ${c} = ${opposite}.`,
        parameters: { a, b, c, triple, opposite }
      });
    }
    if (mode === 2) {
      const [legA, legB, hypotenuse] = pick(rng, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]);
      const asked = pick(rng, ["cos", "sin"]);
      return conceptual(ctx, {
        recipe: "cofunction-in-triangle",
        stimulus: `In right triangle ABC, the right angle is at C and sin A = ${fraction(legA, hypotenuse)}.`,
        question: `What is the value of ${asked} B?`, correct: asked === "cos" ? fraction(legA, hypotenuse) : fraction(legB, hypotenuse),
        distractors: [fraction(legA, legB), fraction(legB, legA), fraction(hypotenuse, legA), fraction(asked === "cos" ? legB : legA, hypotenuse)],
        explanation: asked === "cos"
          ? `Angles A and B are complementary, and the side opposite A is the side adjacent to B, so cos B = sin A = ${fraction(legA, hypotenuse)}.`
          : `Angles A and B are complementary, so sin B = cos A. With sin A = ${fraction(legA, hypotenuse)}, the remaining leg gives cos A = ${fraction(legB, hypotenuse)}.`,
        parameters: { legA, legB, hypotenuse, asked }
      });
    }
    if (mode < 3) {
      const angle = pick(rng, ctx.practiceSet === 2 ? [10, 15, 45, 50, 55, 60, 65, 70] : [20, 25, 30, 35, 40]);
      return conceptual(ctx, {
        recipe: "complementary-trig", question: `Which expression is equal to sin ${angle}°?`, correct: `cos ${90 - angle}°`,
        distractors: [`cos ${angle}°`, `sin ${90 - angle}°`, `tan ${90 - angle}°`],
        explanation: `Sine and cosine are cofunctions: sin θ = cos(90° − θ). Thus sin ${angle}° = cos ${90 - angle}°.`, parameters: { angle }
      });
    }
    if (mode === 3 || mode === 4) {
      const entry = pick(rng, ctx.practiceSet === 2 ? [
        { angle: "5π/6", sine: "1/2", cosine: "−√3/2" },
        { angle: "5π/4", sine: "−√2/2", cosine: "−√2/2" },
        { angle: "4π/3", sine: "−√3/2", cosine: "−1/2" },
        { angle: "5π/3", sine: "−√3/2", cosine: "1/2" },
        { angle: "7π/4", sine: "−√2/2", cosine: "√2/2" }
      ] : [
        { angle: "π/6", sine: "1/2", cosine: "√3/2" },
        { angle: "π/4", sine: "√2/2", cosine: "√2/2" },
        { angle: "π/3", sine: "√3/2", cosine: "1/2" },
        { angle: "2π/3", sine: "√3/2", cosine: "−1/2" },
        { angle: "3π/4", sine: "√2/2", cosine: "−√2/2" }
      ]);
      const distractorPool = ["1/2", "√2/2", "√3/2", "−1/2", "−√2/2", "−√3/2", "0", "1"]
        .filter((value) => value !== entry.cosine).slice(0, 3);
      return conceptual(ctx, {
        recipe: "unit-circle-radians", question: `An angle in standard position measures ${entry.angle} radians. What is its cosine?`, correct: entry.cosine,
        distractors: distractorPool,
        explanation: `On the unit circle, cosine is the x-coordinate of the point at the given angle. At ${entry.angle}, that coordinate is ${entry.cosine}.`, parameters: { entry }
      });
    }
    const dx = a;
    const dy = b;
    const x1 = int(rng, -8, 2);
    const y1 = int(rng, -8, 2);
    return numeric(ctx, {
      recipe: "coordinate-distance", question: `What is the distance between (${x1}, ${y1}) and (${x1 + dx}, ${y1 + dy}) in the coordinate plane?`, correct: c,
      distractors: [dx + dy, Math.abs(dx - dy), c * c],
      explanation: `The horizontal and vertical changes are ${dx} and ${dy}. Distance = √(${dx}² + ${dy}²) = ${c}.`, parameters: { x1, y1, dx, dy, c }
    });
  }

  function circles(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 6;
    if (difficulty === "Easy") {
      const radius = int(rng, 3, 12);
      if (mode === 1 || mode === 4) {
        return conceptual(ctx, {
          recipe: "circle-area", stimulus: `A circular region has diameter ${2 * radius}.`, question: "What is the area of the region?", correct: `${radius * radius}π`,
          distractors: [`${2 * radius}π`, `${radius}π`, `${4 * radius * radius}π`],
          explanation: `The radius is half the diameter, so r = ${radius}. Then A = πr² = π(${radius})² = ${radius * radius}π.`, parameters: { radius }
        });
      }
      if (mode === 2 || mode === 5) {
        return numeric(ctx, {
          recipe: "diameter-from-radius", stimulus: `A circle has radius ${radius}.`, question: "What is its diameter?", correct: 2 * radius,
          distractors: [radius, radius * radius, 4 * radius],
          explanation: `The diameter is twice the radius: 2(${radius}) = ${2 * radius}.`, parameters: { radius }
        });
      }
      return conceptual(ctx, {
        recipe: "circumference", stimulus: `A circle has radius ${radius}.`, question: "What is its circumference?", correct: `${2 * radius}π`,
        distractors: [`${radius * radius}π`, `${radius}π`, `${2 * radius + 2}π`],
        explanation: `C = 2πr = 2π(${radius}) = ${2 * radius}π.`, parameters: { radius }
      });
    }
    if (difficulty === "Medium" && mode === 3) {
      const radius = int(rng, 3, 12);
      const h = int(rng, -6, 6);
      const k = int(rng, -6, 6);
      return numeric(ctx, {
        recipe: "radius-from-equation",
        stimulus: `A circle in the xy-plane has equation (x ${signedTerm(-h)})² + (y ${signedTerm(-k)})² = ${radius * radius}.`,
        question: "What is the radius of the circle?", correct: radius,
        distractors: [radius * radius, 2 * radius, Math.abs(h) + Math.abs(k)],
        explanation: `In the form (x − h)² + (y − k)² = r², the right side is r², not r. Here r² = ${radius * radius}, so r = ${radius}.`,
        parameters: { radius, radiusSquared: radius * radius, h, k }
      });
    }
    if (difficulty === "Medium" && mode === 4) {
      const radius = int(rng, 2, 9);
      return conceptual(ctx, {
        recipe: "area-from-circumference", stimulus: `A circle has circumference ${2 * radius}π.`,
        question: "What is the area of the circle?", correct: `${radius * radius}π`,
        distractors: [`${2 * radius}π`, `${4 * radius * radius}π`, `${radius}π`],
        explanation: `Circumference is 2πr, so 2πr = ${2 * radius}π gives r = ${radius}. The area is πr² = ${radius * radius}π.`,
        parameters: { radius }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      const h = nonzero(rng, -6, 6);
      const k = nonzero(rng, -6, 6);
      const radius = int(rng, 2, 9);
      return conceptual(ctx, {
        recipe: "circle-equation", stimulus: `A circle has center (${h}, ${k}) and radius ${radius}.`,
        question: "Which equation represents the circle?", correct: `(x − (${h}))² + (y − (${k}))² = ${radius * radius}`,
        distractors: [`(x + (${h}))² + (y + (${k}))² = ${radius * radius}`, `(x − (${h}))² + (y − (${k}))² = ${radius}`, `(x − (${h}))² + (y − (${k}))² = ${radius * radius + 1}`],
        explanation: `A circle with center (h, k) and radius r has equation (x − h)² + (y − k)² = r². Substitution gives the stated equation.`, parameters: { h, k, radius }
      });
    }
    if (difficulty === "Medium") {
      const radius = int(rng, 3, 12);
      const angle = pick(rng, [30, 45, 60, 90, 120, 180]);
      const coefficientValue = 2 * radius * angle / 360;
      const coefficient = fraction(2 * radius * angle, 360);
      return conceptual(ctx, {
        recipe: "arc-length", stimulus: `A circle has radius ${radius}. A central angle measures ${angle}°.`,
        question: "What is the length of the intercepted minor arc?", correct: `${coefficient}π`,
        distractors: [`${numberText(coefficientValue / 2)}π`, `${numberText(coefficientValue * 2)}π`, `${numberText(coefficientValue + 0.25)}π`],
        explanation: `Arc length is ${angle}/360 of the circumference: (${angle}/360)(2π·${radius}) = ${coefficient}π.`, parameters: { radius, angle }
      });
    }
    if (mode === 0 || mode === 5) {
      const h = int(rng, -5, 5);
      const k = int(rng, -5, 5);
      const [dx, dy] = pick(rng, [[3, 4], [4, 3], [5, 12], [12, 5], [8, 15], [15, 8]]);
      const radiusSquared = dx * dx + dy * dy;
      const radius = Math.sqrt(radiusSquared);
      return numeric(ctx, {
        recipe: "radius-from-point", stimulus: `A circle has center (${h}, ${k}) and passes through (${h + dx}, ${k + dy}).`,
        question: "What is the radius of the circle?", correct: radius,
        distractors: [radiusSquared, dx + dy, Math.abs(dx - dy)],
        explanation: `The radius is the distance from center to the point: √(${dx}² + ${dy}²) = ${radius}.`, parameters: { h, k, dx, dy, radius }
      });
    }
    if (mode === 1 || mode === 4) {
      const h = int(rng, -5, 5);
      const k = int(rng, -5, 5);
      const px = h + 3;
      const py = k + 4;
      return conceptual(ctx, {
        recipe: "tangent-line", stimulus: `A circle has center (${h}, ${k}), and (${px}, ${py}) lies on the circle. Line t is tangent to the circle at (${px}, ${py}).`,
        question: "Which equation represents line t?", correct: `y − (${py}) = −3/4(x − (${px}))`,
        distractors: [`y − (${py}) = 4/3(x − (${px}))`, `y − (${py}) = 3/4(x − (${px}))`, `y − (${k}) = −3/4(x − (${h}))`],
        explanation: `The radius to (${px}, ${py}) has slope 4/3. A tangent is perpendicular, so its slope is −3/4; point-slope form gives the stated equation.`, parameters: { h, k, px, py }
      });
    }
    if (mode === 2) {
      const radius = int(rng, 3, 12);
      const angle = pick(rng, [30, 45, 60, 90, 120]);
      const coefficient = fraction(radius * radius * angle, 360);
      return conceptual(ctx, {
        recipe: "sector-area", stimulus: `A circle has radius ${radius}. A sector has central angle ${angle}°.`,
        question: "What is the area of the sector?", correct: `${coefficient}π`,
        distractors: [`${fraction(2 * radius * angle, 360)}π`, `${fraction(radius * radius * angle, 180)}π`, `${radius * radius}π`],
        explanation: `Sector area is ${angle}/360 of the circle's area: (${angle}/360)π(${radius})² = ${coefficient}π.`, parameters: { radius, angle }
      });
    }
    const central = pick(rng, [80, 100, 120, 140, 160]);
    return numeric(ctx, {
      recipe: "inscribed-angle", stimulus: `An inscribed angle intercepts an arc measuring ${central}°.`,
      question: "What is the measure of the inscribed angle?", correct: central / 2,
      distractors: [central, 360 - central, 180 - central / 2],
      explanation: `An inscribed angle measures half its intercepted arc: ${central}/2 = ${central / 2}°.`, parameters: { central }
    });
  }

  const GENERATORS = {
    "linear-equations-one": linearEquationsOne,
    "linear-functions": linearFunctions,
    "linear-equations-two": linearEquationsTwo,
    "linear-systems": linearSystems,
    "linear-inequalities": linearInequalities,
    "equivalent-expressions": equivalentExpressions,
    "nonlinear-equations": nonlinearEquations,
    "nonlinear-systems": nonlinearSystems,
    "nonlinear-functions": nonlinearFunctions,
    "ratios-rates-units": ratiosRatesUnits,
    percentages,
    "one-variable-data": oneVariableData,
    "two-variable-data": twoVariableData,
    probability,
    "sample-inference": sampleInference,
    "statistical-claims": statisticalClaims,
    "area-volume": areaVolume,
    "lines-angles-triangles": linesAnglesTriangles,
    "right-triangles-trig": rightTrianglesTrig,
    circles
  };

  function buildSATMathQuestions(seed = "baseline-v4", options = {}) {
    const normalizedSeed = String(seed).trim() || "baseline-v4";
    const setId = hash(`${GENERATOR_VERSION}/${normalizedSeed}`).toString(36);
    const practiceSet = Number(options.practiceSet) === 2 ? 2 : 1;
    const variantOffset = practiceSet === 2 ? 25 : 0;
    return SKILLS.flatMap((skill) => {
      const generated = [];
      const signatures = new Set(options.excludedSignatures?.get(skill.name) || []);
      for (let slot = 0; slot < 25; slot += 1) {
        const index = slot + variantOffset;
        const difficulty = DIFFICULTIES[slot];
        let retry = 0;
        let question;
        let signature;
        do {
          const rng = randomFor(`${GENERATOR_VERSION}/${normalizedSeed}/${skill.slug}/${index}/${difficulty}/${retry}`);
          question = GENERATORS[skill.slug]({ seed: normalizedSeed, setId, skill, index, difficulty, practiceSet, rng });
          signature = `${question.stimulus}|${question.question}|${JSON.stringify(question.table || null)}|${JSON.stringify(question.figure || null)}`;
          retry += 1;
        } while (signatures.has(signature) && retry < 250);
        if (signatures.has(signature)) throw new Error(`Unable to generate unique Math content for ${skill.name}, set ${practiceSet}, variant ${index + 1}.`);
        signatures.add(signature);
        question.practiceSet = practiceSet;
        question.meta.practiceSet = practiceSet;
        question.meta.generationAttempt = retry;
        generated.push(question);
      }
      return generated;
    });
  }

  window.SAT_MATH_SKILLS = SKILLS;
  window.buildSATMathQuestions = buildSATMathQuestions;
  window.buildSATMathQuestionSets = function (seed) {
    const first = buildSATMathQuestions(seed, { practiceSet: 1 });
    const excludedSignatures = new Map();
    for (const question of first) {
      if (!excludedSignatures.has(question.skill)) excludedSignatures.set(question.skill, []);
      excludedSignatures.get(question.skill).push(`${question.stimulus}|${question.question}|${JSON.stringify(question.table || null)}|${JSON.stringify(question.figure || null)}`);
    }
    return [...first, ...buildSATMathQuestions(seed, { practiceSet: 2, excludedSignatures })];
  };
  window.applySATMathSet = function (seed) {
    const readingWriting = (window.SAT_QUESTIONS || []).filter((question) => question.section !== "Math");
    window.SAT_QUESTIONS = [...readingWriting, ...window.buildSATMathQuestionSets(seed)];
    return window.SAT_QUESTIONS;
  };
})();
