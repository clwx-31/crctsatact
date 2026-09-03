(function () {
  "use strict";

  const DIFFICULTIES = [
    ...Array(8).fill("Easy"),
    ...Array(9).fill("Medium"),
    ...Array(8).fill("Hard")
  ];

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
      .replace(/− \((-?\d+(?:\.\d+)?)\)/g, (_, number) => Number(number) < 0 ? `+ ${Math.abs(Number(number))}` : `− ${number}`)
      .replace(/\+ \((-?\d+(?:\.\d+)?)\)/g, (_, number) => Number(number) < 0 ? `− ${Math.abs(Number(number))}` : `+ ${number}`)
      .replace(/\(−(\d+(?:\.\d+)?)\)/g, "(−$1)");
  }

  function signedTerm(value, variable = "") {
    const magnitude = Math.abs(value);
    const coefficient = variable && magnitude === 1 ? "" : magnitude;
    return `${value < 0 ? "−" : "+"} ${coefficient}${variable}`;
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
    const m = nonzero(rng, -6, 7);
    const px = nonzero(rng, -5, 6);
    const py = int(rng, -5, 6);
    const intercept = py - m * px;
    const targetSlope = mode < 3 ? String(m) : fraction(-1, m);
    const relationship = mode < 3 ? "parallel" : "perpendicular";
    return conceptual(ctx, {
      recipe: `${relationship}-line`, stimulus: `Line ℓ has slope ${m}. Line n passes through (${px}, ${py}) and is ${relationship} to ℓ.`,
      question: "Which equation represents line n?", correct: `y − (${py}) = ${targetSlope}(x − (${px}))`,
      distractors: [`y − (${py}) = ${fraction(1, m)}(x − (${px + 1}))`, `y − (${py + 1}) = ${targetSlope}(x − (${px}))`, `y − (${py}) = ${targetSlope}(x + (${px}))`],
      explanation: `A ${relationship} line has slope ${targetSlope}. Point-slope form through (${px}, ${py}) is y − (${py}) = ${targetSlope}(x − (${px})).`, parameters: { m, px, py, targetSlope }
    });
  }

  function linearSystems(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 5;
    if (difficulty === "Easy") {
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
    if (difficulty === "Easy") {
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
    if (difficulty === "Medium" && mode < 3) {
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
    if (difficulty === "Easy") {
      const root = int(rng, 2, 12);
      const square = root * root;
      if (mode % 2 === 0) {
        return conceptual(ctx, {
          recipe: "difference-of-squares", question: `Which values of x satisfy x² − ${square} = 0?`, correct: `x = −${root} and x = ${root}`,
          distractors: [`x = ${root} only`, `x = ${square} only`, `x = −${square} and x = ${square}`],
          explanation: `x² = ${square}, so x can be either square root: x = ±${root}.`, parameters: { root }
        });
      }
      const shift = int(rng, 1, 10);
      const x = square - shift;
      return numeric(ctx, {
        recipe: "radical-basic", question: `If √(x + ${shift}) = ${root}, what is x?`, correct: x,
        distractors: [root - shift, square + shift, root + shift],
        explanation: `Square both sides to get x + ${shift} = ${square}; therefore, x = ${x}.`, parameters: { root, shift, x }
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
    if (difficulty === "Easy") {
      const x = pick(rng, [-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9]);
      const y = x * x;
      return conceptual(ctx, {
        recipe: "verify-solution", question: `Which point is a solution to both y = x² and y = ${linearText(x, "x", 0)}?`, correct: `(${x}, ${y})`,
        distractors: [`(${y}, ${x})`, `(${-x}, ${y})`, `(${x}, ${-y})`],
        explanation: `At x = ${x}, both equations give y = ${x}² = ${y}.`, parameters: { x, y }
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
        recipe: "quadratic-vertex", stimulus: `The function h(t) = ${a}(t − (${h}))² + ${k} models an object's height.`,
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
        recipe: "quadratic-useful-form", question: `Which form of f(x) = ${a}(x − (${h}))² ${signedTerm(k)} most directly displays the vertex of its graph?`,
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
    if (difficulty === "Easy") {
      const unitRate = int(rng, 3, 18);
      const quantity = int(rng, 4, 15);
      const total = unitRate * quantity;
      return numeric(ctx, {
        recipe: "unit-rate", stimulus: `${quantity} identical items cost $${total}.`, question: "What is the cost, in dollars, per item?", correct: unitRate,
        distractors: [total - quantity, quantity / total, total + quantity],
        explanation: `Divide total cost by item count: ${total}/${quantity} = ${unitRate} dollars per item.`, parameters: { unitRate, quantity, total }
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
    if (difficulty === "Easy") {
      const original = int(rng, 4, 20) * 10;
      const percent = pick(rng, [10, 20, 25, 30, 40, 50]);
      const amount = original * percent / 100;
      return numeric(ctx, {
        recipe: "percent-of", question: `What is ${percent}% of ${original}?`, correct: numberText(amount),
        distractors: [numberText(original - amount), numberText(original + amount), numberText(original / percent)],
        explanation: `${percent}% = ${percent / 100}. Multiplying ${original} by ${percent / 100} gives ${amount}.`, parameters: { original, percent, amount }
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
      const final = int(rng, 6, 25) * 10;
      const percent = pick(rng, [20, 25, 50, 100]);
      const original = final / (1 + percent / 100);
      if (Number.isInteger(original)) {
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

  function oneVariableData(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 6;
    if (difficulty === "Easy") {
      const values = Array.from({ length: 5 }, () => int(rng, 5, 20));
      const sum = values.reduce((total, value) => total + value, 0);
      const adjusted = sum % 5;
      values[4] += adjusted ? 5 - adjusted : 0;
      const mean = values.reduce((total, value) => total + value, 0) / 5;
      return numeric(ctx, {
        recipe: "mean", question: `What is the mean of ${values.join(", ")}?`, correct: mean,
        distractors: [values.sort((a, b) => a - b)[2], Math.max(...values) - Math.min(...values), mean + 1],
        explanation: `The values sum to ${mean * 5}. Divide by 5 to get a mean of ${mean}.`, parameters: { values, mean }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
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
    if (difficulty === "Medium") {
      const median = int(rng, 10, 30);
      const values = [median - int(rng, 4, 8), median - 1, median, median + 2, median + int(rng, 5, 10)].sort((a, b) => a - b);
      return numeric(ctx, {
        recipe: "median", question: `What is the median of ${values.join(", ")}?`, correct: median,
        distractors: [values.reduce((a, b) => a + b, 0) / values.length, Math.max(...values) - Math.min(...values), values[1]],
        explanation: `The data are ordered and contain five values, so the median is the third value, ${median}.`, parameters: { values, median }
      });
    }
    if (mode < 3) {
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
    const base = [int(rng, 10, 20), int(rng, 21, 30), int(rng, 31, 40), int(rng, 41, 50)];
    const outlier = int(rng, 100, 160);
    return conceptual(ctx, {
      recipe: "outlier-effect", stimulus: `A data set contains ${base.join(", ")}. The value ${outlier} is added.`,
      question: "How will adding this value affect the mean and median?", correct: "The mean will increase more than the median will increase.",
      distractors: ["The median will increase more than the mean will increase.", "The mean and median will decrease by the same amount.", "Neither the mean nor the median will change."],
      explanation: `${outlier} is a high outlier. The mean uses its full magnitude and is pulled upward strongly, while the median is resistant to an extreme value.`, parameters: { base, outlier }
    });
  }

  function twoVariableData(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 6;
    const m = nonzero(rng, 2, 9);
    const b = int(rng, 5, 30);
    if (difficulty === "Easy") {
      const x = int(rng, 3, 12);
      const predicted = m * x + b;
      return numeric(ctx, {
        recipe: "model-prediction", stimulus: `A line of best fit for paired data is y = ${linearText(m, "x", b)}.`,
        question: `What y-value does the model predict when x = ${x}?`, correct: predicted,
        distractors: [m + x + b, predicted - b, predicted + m],
        explanation: `Substitute x = ${x}: y = ${m}(${x}) + ${b} = ${predicted}.`, parameters: { m, b, x, predicted }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      return conceptual(ctx, {
        recipe: "slope-interpretation", stimulus: `A line of best fit y = ${linearText(m, "x", b)} relates x hours of training to a performance score y.`,
        question: `What is the best interpretation of ${m}?`, correct: `The predicted score increases by ${m} points for each additional hour of training.`,
        distractors: [`The predicted score is ${m} when training time is zero.`, `The predicted training time increases by ${m} hours for each score point.`, `Every participant's score is exactly ${m} points.`],
        explanation: `The slope gives predicted change in y for a 1-unit increase in x: ${m} score points per training hour.`, parameters: { m, b }
      });
    }
    if (difficulty === "Medium") {
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
    if (mode < 3) {
      const factor = pick(rng, ctx.practiceSet === 2 ? [0.5, 0.75, 0.8, 1.05, 1.3, 1.4, 1.6, 1.75, 2.5] : [1.1, 1.2, 1.25, 1.5, 2]);
      return conceptual(ctx, {
        recipe: "model-selection", stimulus: `In a data set, each 1-unit increase in x is associated with multiplying y by approximately ${factor}.`,
        question: "Which type of model is most appropriate?", correct: "An exponential model",
        distractors: ["A linear model", "A constant model", "No model, because y changes"],
        explanation: `A roughly constant multiplicative change for equal x-intervals is the defining pattern of exponential growth or decay.`, parameters: { factor }
      });
    }
    const sampleX = [1, 2, 3, 4, 5];
    const sampleY = sampleX.map((x) => m * x + b + pick(rng, [-2, -1, 0, 1, 2]));
    return conceptual(ctx, {
      recipe: "association-direction", figure: { kind: "scatter", label: "Scatterplot of paired observations", points: sampleX.map((x, i) => [x, sampleY[i]]) },
      question: "Which statement best describes the association?", correct: "There is a positive association: y generally increases as x increases.",
      distractors: ["There is a negative association: y generally decreases as x increases.", "There is no association because the points are not identical.", "The association proves that increasing x causes y to increase."],
      explanation: `The y-values generally rise with x, indicating positive association. Association alone does not establish causation.`, parameters: { sampleX, sampleY }
    });
  }

  function probability(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 6;
    if (difficulty === "Easy") {
      const favorable = int(rng, 2, 9);
      let other = int(rng, 3, 12);
      while (other === favorable) other = int(rng, 3, 12);
      const total = favorable + other;
      const correct = fraction(favorable, total);
      return conceptual(ctx, {
        recipe: "simple-probability", stimulus: `A bag contains ${favorable} blue tiles and ${other} red tiles. One tile is chosen at random.`,
        question: "What is the probability of choosing a blue tile?", correct,
        distractors: [fraction(favorable, total - 1), fraction(favorable, total + 1), fraction(favorable, total + 2)],
        explanation: `There are ${favorable} favorable outcomes among ${total} equally likely tiles, so the probability is ${favorable}/${total} = ${correct}.`, parameters: { favorable, other }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      const aYes = int(rng, 12, 30);
      const aNo = int(rng, 5, 15);
      let bYes = int(rng, 10, 25);
      while (bYes === aYes) bYes = int(rng, 10, 25);
      const bNo = int(rng, 4, 15);
      const correct = fraction(bYes, aYes + bYes);
      return conceptual(ctx, {
        recipe: "conditional-table", table: { caption: "Membership by grade", headers: ["Grade", "Member", "Not a member"], rows: [["Junior", aYes, aNo], ["Senior", bYes, bNo]] },
        question: "If a member is selected at random, what is the probability that the member is a senior?", correct,
        distractors: [fraction(bYes, aYes + aNo + bYes + bNo), fraction(bYes, aYes + bYes - 1), fraction(bYes, aYes + bYes + 1)],
        explanation: `Condition on members only. There are ${aYes + bYes} members, of whom ${bYes} are seniors, so the probability is ${correct}.`, parameters: { aYes, aNo, bYes, bNo }
      });
    }
    if (difficulty === "Medium") {
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

  function sampleInference(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 5;
    if (difficulty === "Easy") {
      const sample = int(rng, 80, 300);
      const percent = pick(rng, [30, 40, 45, 50, 55, 60, 70]);
      return conceptual(ctx, {
        recipe: "sample-statistic", stimulus: `In a random sample of ${sample} city residents, ${percent}% support a proposal.`,
        question: "Which quantity is a sample statistic?", correct: `${percent}% of the sampled residents support the proposal.`,
        distractors: [`${percent}% of all city residents support the proposal.`, `The city has ${sample} residents.`, "Every future sample will have the same percentage."],
        explanation: `A sample statistic describes the observed sample. Using it to describe all residents would be an estimate of a population parameter.`, parameters: { sample, percent }
      });
    }
    if (difficulty === "Medium") {
      const estimate = int(rng, 35, 70);
      const margin = int(rng, 2, 6);
      return conceptual(ctx, {
        recipe: "margin-interval", stimulus: `A random-sample estimate is ${estimate}% with a margin of error of ${margin} percentage points.`,
        question: "Which interval is the corresponding plausible range for the population percentage?", correct: `${estimate - margin}% to ${estimate + margin}%`,
        distractors: [`${estimate}% to ${estimate + margin}%`, `${estimate - 2 * margin}% to ${estimate + 2 * margin}%`, `${margin}% to ${estimate}%`],
        explanation: `Subtract and add the margin of error: ${estimate} − ${margin} = ${estimate - margin} and ${estimate} + ${margin} = ${estimate + margin}.`, parameters: { estimate, margin }
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
    const percent = int(rng, 35, 79);
    const district = pick(rng, ["North", "Central", "Riverside", "Lakeview", "Westfield"]);
    return conceptual(ctx, {
      recipe: "generalize-random-sample", stimulus: `A researcher takes a large random sample from all students enrolled in the ${district} School District and finds that ${percent}% prefer a later start time.`,
      question: "To which group can the result most appropriately be generalized?", correct: "All students enrolled in that school district",
      distractors: ["All students in the country", "Only the students who answered yes", "All adults who live in the district"],
      explanation: `A well-drawn random sample supports generalization to the population from which it was randomly selected: the district's enrolled students.`, parameters: { percent, district }
    });
  }

  function statisticalClaims(ctx) {
    const { rng, difficulty, index } = ctx;
    const mode = index % 6;
    if (difficulty === "Easy") {
      const treatment = pick(rng, ["study routine", "exercise program", "fertilizer", "sleep schedule"]);
      const participants = int(rng, 80, 480);
      return conceptual(ctx, {
        recipe: "random-assignment", stimulus: `Researchers randomly assign ${participants} volunteers either to use a new ${treatment} or to continue their usual routine.`,
        question: "What does random assignment primarily allow the researchers to do?", correct: "Support a cause-and-effect conclusion about the treatment",
        distractors: ["Generalize automatically to every person", "Guarantee that every participant improves", "Eliminate all measurement error"],
        explanation: `Random assignment tends to balance preexisting differences between treatment groups, allowing a causal comparison. It does not ensure population representativeness.`, parameters: { treatment, participants }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      const city = pick(rng, ["Bayport", "Lake City", "Riverton", "Oak Falls", "Pine Hill"]);
      const sampleSize = int(rng, 150, 950);
      return conceptual(ctx, {
        recipe: "random-sampling-versus-assignment", stimulus: `A random sample of ${sampleSize} ${city} residents is surveyed about transit. No treatment is imposed.`,
        question: "Which conclusion is best supported?", correct: "The results may be generalized to the city's residents, but they cannot establish causation.",
        distractors: ["The results establish that transit preferences cause commuting behavior.", "The results apply only to the sampled residents.", "The results prove every city resident has the majority preference."],
        explanation: `Random sampling supports generalization to the sampled population. Without a randomly assigned treatment, the study cannot establish a causal effect.`, parameters: { city, sampleSize }
      });
    }
    if (difficulty === "Medium") {
      const pair = pick(rng, [
        ["students who sleep more", "earn higher grades", "sleep", "grades"],
        ["adults who exercise more", "report lower stress", "exercise", "stress"],
        ["towns with more parks", "have lower summer temperatures", "parks", "temperature"],
        ["workers with shorter commutes", "report greater job satisfaction", "commute length", "job satisfaction"]
      ]);
      const observations = int(rng, 120, 980);
      return conceptual(ctx, {
        recipe: "observational-confounding", stimulus: `In an observational study of ${observations} cases, researchers find that ${pair[0]} tend to ${pair[1]}.`,
        question: `Why does this result not by itself establish that ${pair[2]} causes a change in ${pair[3]}?`, correct: `Other variables may be related to both ${pair[2]} and ${pair[3]}.`,
        distractors: ["Associations can never be measured.", "The response cannot be recorded as data.", "An observational study must have exactly two groups."],
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
        question: "What is the most serious threat to a causal conclusion?", correct: "Participants who choose the program may differ initially from those who do not.",
        distractors: ["The response variable is numerical.", "The study contains more than one participant.", "A comparison group is never useful."],
        explanation: `Self-selection can create systematic preexisting differences between groups. Random assignment would better isolate the program's effect.`, parameters: { program, outcome }
      });
    }
    const intervention = pick(rng, ["vocabulary app", "memory game", "reading strategy", "practice schedule", "note-taking tool"]);
    const outcome = pick(rng, ["vocabulary scores", "recall scores", "reading scores", "quiz scores"]);
    return conceptual(ctx, {
      recipe: "experiment-design", stimulus: `A researcher wants to test whether a new ${intervention} improves ${outcome}.`,
      question: "Which design best supports a causal conclusion?", correct: "Randomly assign participants to use the intervention or a comparison method, then compare score changes.",
      distractors: ["Ask participants whether they think they improved.", "Compare volunteers who already use the intervention with people who do not.", "Give the intervention to everyone and record only their final scores."],
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
    if (difficulty === "Easy") {
      return numeric(ctx, {
        recipe: "pythagorean-hypotenuse", stimulus: `A right triangle has leg lengths ${a} and ${b}.`, question: "What is the hypotenuse length?", correct: c,
        distractors: [a + b, Math.abs(b - a), a * b],
        explanation: `By the Pythagorean theorem, c = √(${a}² + ${b}²) = ${c}.`, parameters: { a, b, c }
      });
    }
    if (difficulty === "Medium" && mode < 3) {
      const ratio = fraction(a, c);
      return conceptual(ctx, {
        recipe: "trig-ratio", stimulus: `In a right triangle, relative to acute angle θ, the opposite side is ${a} and the hypotenuse is ${c}.`,
        question: "What is sin θ?", correct: ratio,
        distractors: [fraction(b, c), fraction(a, b), fraction(c, a)],
        explanation: `sin θ = opposite/hypotenuse = ${a}/${c} = ${ratio}.`, parameters: { a, b, c }
      });
    }
    if (difficulty === "Medium") {
      const short = ctx.practiceSet === 2 ? int(rng, 11, 20) : int(rng, 2, 10);
      return conceptual(ctx, {
        recipe: "thirty-sixty-ninety", stimulus: `A 30°-60°-90° triangle has shorter leg length ${short}.`,
        question: "What is its hypotenuse length?", correct: String(2 * short),
        distractors: [`${short}√2`, `${short}√3`, String(short * 3)],
        explanation: `In a 30°-60°-90° triangle, the side ratio is 1:√3:2. The hypotenuse is twice the shorter leg: ${2 * short}.`, parameters: { short }
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

  function buildSATMathQuestions(seed = "baseline-v1", options = {}) {
    const normalizedSeed = String(seed).trim() || "baseline-v1";
    const setId = hash(normalizedSeed).toString(36);
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
          const rng = randomFor(`${normalizedSeed}/${skill.slug}/${index}/${difficulty}/${retry}`);
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
