(() => {
  "use strict";

  const STORAGE_KEY = "form-sat-practice-v1";
  const MATH_SEED_KEY = "form-sat-math-seed-v1";
  const MATH_VARIANT_KEY = "form-sat-math-variant-v1";
  const RW_SEED_KEY = "form-sat-rw-seed-v1";
  const RW_VARIANT_KEY = "form-sat-rw-variant-v1";
  const app = document.querySelector("#app");
  const homeButton = document.querySelector("#home-button");
  const letters = ["A", "B", "C", "D"];

  let mathSeed = localStorage.getItem(MATH_SEED_KEY) || "baseline-v1";
  let rwSeed = localStorage.getItem(RW_SEED_KEY) || "baseline-v1";
  if (typeof window.applySATMathSet === "function") window.applySATMathSet(mathSeed);
  if (typeof window.applySATRWSet === "function") window.applySATRWSet(rwSeed);
  let state = loadState();
  let view = { name: "dashboard", section: null, skill: null, difficulty: null, index: 0 };

  function loadState() {
    const fallback = { responses: {}, bookmarks: {} };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved && saved.responses && saved.bookmarks ? saved : fallback;
    } catch {
      return fallback;
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function sectionQuestions(section, skill = null, difficulty = null) {
    return window.SAT_QUESTIONS.filter((question) => question.section === section
      && (!skill || question.skill === skill)
      && (!difficulty || question.difficulty === difficulty));
  }

  function answered(question) {
    return Boolean(state.responses[question.id]?.checked);
  }

  function responseStats(questions = window.SAT_QUESTIONS) {
    const completed = questions.filter(answered);
    const correct = completed.filter((question) => state.responses[question.id].correct);
    return {
      completed: completed.length,
      correct: correct.length,
      accuracy: completed.length ? Math.round((correct.length / completed.length) * 100) : 0
    };
  }

  function startSection(section, skill = null, difficulty = null) {
    const questions = sectionQuestions(section, skill, difficulty);
    const firstOpen = questions.findIndex((question) => !answered(question));
    view = { name: "practice", section, skill, difficulty, index: firstOpen === -1 ? 0 : firstOpen };
    render();
  }

  function goHome() {
    view = { name: "dashboard", section: null, skill: null, difficulty: null, index: 0 };
    render();
  }

  function render() {
    if (view.name === "practice") {
      renderPractice();
    } else {
      renderDashboard();
    }
    app.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderDashboard() {
    const overall = responseStats();
    const rw = sectionQuestions("Reading and Writing");
    const math = sectionQuestions("Math");
    const rwStats = responseStats(rw);
    const mathStats = responseStats(math);
    const totalQuestions = window.SAT_QUESTIONS.length;

    app.innerHTML = `
      <div class="dashboard">
        <section class="hero" aria-labelledby="page-title">
          <div>
            <p class="eyebrow">Focused practice / current digital format</p>
            <h1 id="page-title">Practice precisely.</h1>
          </div>
          <p class="hero-copy">${totalQuestions} original questions shaped around the current SAT blueprint. Drill one exact skill at a time, see the reasoning, and generate fresh variants without losing prior progress.</p>
        </section>

        <section class="metrics" aria-label="Practice progress">
          <div class="metric"><span class="metric-value">${overall.completed}<span class="faint">/${totalQuestions}</span></span><span class="metric-label">Completed</span></div>
          <div class="metric"><span class="metric-value">${overall.completed ? `${overall.accuracy}%` : "—"}</span><span class="metric-label">Accuracy</span></div>
          <div class="metric"><span class="metric-value">${rwStats.completed}<span class="faint">/${rw.length}</span></span><span class="metric-label">Reading + Writing</span></div>
          <div class="metric"><span class="metric-value">${mathStats.completed}<span class="faint">/${math.length}</span></span><span class="metric-label">Math</span></div>
        </section>

        <div class="section-heading">
          <h2>Choose a section</h2>
          <p>Questions progress from easy to hard.</p>
        </div>

        <section class="section-grid" aria-label="SAT sections">
          ${sectionCard("01", "Reading and Writing", "Reading + Writing", rwStats, `4 domains · 11 skills · ${rw.length} questions`, rw.length)}
          ${sectionCard("02", "Math", "Math", mathStats, `4 domains · 20 skills · ${math.length} questions`, math.length)}
        </section>

        ${renderRWLibrary()}
        ${renderMathLibrary()}

        <section class="standards" aria-labelledby="standards-title">
          <h2 id="standards-title">Built to the blueprint</h2>
          <div class="standards-list">
            <div class="standard"><span class="standard-number">01 / FORMAT</span><p>Short passages, one Reading and Writing question per text, and both Math response formats.</p></div>
            <div class="standard"><span class="standard-number">02 / COVERAGE</span><p>Every targeted Math and Reading and Writing skill has 25 questions progressing through easy, medium, and hard variants.</p></div>
            <div class="standard"><span class="standard-number">03 / REVIEW</span><p>Every item includes a direct rationale designed to expose the tested idea—not just name the key.</p></div>
          </div>
        </section>
      </div>`;

    document.querySelectorAll("[data-section]").forEach((button) => {
      button.addEventListener("click", () => startSection(button.dataset.section));
    });
    document.querySelectorAll("[data-math-skill]").forEach((button) => {
      button.addEventListener("click", () => startSection("Math", button.dataset.mathSkill));
    });
    document.querySelectorAll("[data-rw-skill]").forEach((button) => {
      button.addEventListener("click", () => startSection("Reading and Writing", button.dataset.rwSkill));
    });
    document.querySelector("#todays-math-set")?.addEventListener("click", () => {
      const today = new Date();
      const date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
      applyMathSeed(`daily-${date}`);
    });
    document.querySelector("#new-math-variant")?.addEventListener("click", () => {
      const next = Number(localStorage.getItem(MATH_VARIANT_KEY) || 0) + 1;
      localStorage.setItem(MATH_VARIANT_KEY, String(next));
      applyMathSeed(`variant-${next}`);
    });
    document.querySelector("#todays-rw-set")?.addEventListener("click", () => {
      const today = new Date();
      const date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
      applyRWSeed(`daily-${date}`);
    });
    document.querySelector("#new-rw-variant")?.addEventListener("click", () => {
      const next = Number(localStorage.getItem(RW_VARIANT_KEY) || 0) + 1;
      localStorage.setItem(RW_VARIANT_KEY, String(next));
      applyRWSeed(`variant-${next}`);
    });
  }

  function sectionCard(index, section, label, stats, detail, total) {
    const action = stats.completed === total ? "Review section" : stats.completed ? "Continue practice" : "Start practice";
    return `
      <button class="section-card" type="button" data-section="${section}">
        <span class="section-card-top"><span class="section-index">${index}</span><span class="section-count">${stats.completed}/${total} complete</span></span>
        <h3>${label}</h3>
        <span class="section-card-footer"><span>${detail}</span><span><span class="sr-only">${action}</span><span class="arrow" aria-hidden="true">↗</span></span></span>
      </button>`;
  }

  function renderMathLibrary() {
    if (!Array.isArray(window.SAT_MATH_SKILLS)) return "";
    const domains = [...new Set(window.SAT_MATH_SKILLS.map((skill) => skill.domain))];
    return `
      <section class="skill-library" aria-labelledby="math-library-title">
        <div class="skill-library-header">
          <div><p class="eyebrow">Targeted Math practice</p><h2 id="math-library-title">Choose an exact skill.</h2></div>
          <div class="set-controls">
            <span class="set-label">Current set: ${escapeHtml(mathSeed)}</span>
            <button class="secondary-button compact-button" id="todays-math-set" type="button">Today's set</button>
            <button class="secondary-button compact-button" id="new-math-variant" type="button">New variant</button>
          </div>
        </div>
        <p class="skill-library-intro">Each skill contains 25 reproducible questions: 8 easy, 9 medium, and 8 hard. A new set changes the numbers and contexts while preserving the tested patterns.</p>
        <div class="domain-list">
          ${domains.map((domain) => `
            <section class="domain-group">
              <h3>${domain}</h3>
              <div class="skill-list">
                ${window.SAT_MATH_SKILLS.filter((skill) => skill.domain === domain).map((skill) => {
                  const questions = sectionQuestions("Math", skill.name);
                  const stats = responseStats(questions);
                  return `<button class="skill-row" type="button" data-math-skill="${escapeHtml(skill.name)}">
                    <span><strong>${escapeHtml(skill.name)}</strong><small>${escapeHtml(skill.description)}</small></span>
                    <span class="skill-progress">${stats.completed}/25 <span aria-hidden="true">↗</span></span>
                  </button>`;
                }).join("")}
              </div>
            </section>`).join("")}
        </div>
      </section>`;
  }

  function renderRWLibrary() {
    if (!Array.isArray(window.SAT_RW_SKILLS)) return "";
    const domains = [...new Set(window.SAT_RW_SKILLS.map((skill) => skill.domain))];
    return `
      <section class="skill-library" aria-labelledby="rw-library-title">
        <div class="skill-library-header">
          <div><p class="eyebrow">Targeted Reading and Writing practice</p><h2 id="rw-library-title">Choose an exact skill.</h2></div>
          <div class="set-controls">
            <span class="set-label">Current set: ${escapeHtml(rwSeed)}</span>
            <button class="secondary-button compact-button" id="todays-rw-set" type="button">Today's set</button>
            <button class="secondary-button compact-button" id="new-rw-variant" type="button">New variant</button>
          </div>
        </div>
        <p class="skill-library-intro">Each skill contains 25 original questions: 8 easy, 9 medium, and 8 hard. Passages follow the digital SAT's one-question-per-text format.</p>
        <div class="domain-list">
          ${domains.map((domain) => `
            <section class="domain-group">
              <h3>${domain}</h3>
              <div class="skill-list">
                ${window.SAT_RW_SKILLS.filter((skill) => skill.domain === domain).map((skill) => {
                  const questions = sectionQuestions("Reading and Writing", skill.name);
                  const stats = responseStats(questions);
                  return `<button class="skill-row" type="button" data-rw-skill="${escapeHtml(skill.name)}">
                    <span><strong>${escapeHtml(skill.name)}</strong><small>${escapeHtml(skill.description)}</small></span>
                    <span class="skill-progress">${stats.completed}/25 <span aria-hidden="true">↗</span></span>
                  </button>`;
                }).join("")}
              </div>
            </section>`).join("")}
        </div>
      </section>`;
  }

  function applyMathSeed(seed) {
    mathSeed = seed;
    localStorage.setItem(MATH_SEED_KEY, seed);
    window.applySATMathSet(seed);
    goHome();
  }

  function applyRWSeed(seed) {
    rwSeed = seed;
    localStorage.setItem(RW_SEED_KEY, seed);
    window.applySATRWSet(seed);
    goHome();
  }

  function renderPractice() {
    const questions = sectionQuestions(view.section, view.skill, view.difficulty);
    const question = questions[view.index];
    const stats = responseStats(questions);
    const response = state.responses[question.id] || {};
    const isLast = view.index === questions.length - 1;

    app.innerHTML = `
      <div class="practice-shell">
        <div class="practice-toolbar">
          <div class="toolbar-title">${view.skill ? escapeHtml(view.skill) : view.section}</div>
          <div class="progress-wrap">
            <div class="progress-meta"><span class="progress-label">Section progress</span><span>${stats.completed} / ${questions.length}</span></div>
            <div class="progress-track"><div class="progress-bar" style="width:${(stats.completed / questions.length) * 100}%"></div></div>
          </div>
          <button class="text-button" id="exit-practice" type="button">Exit practice</button>
        </div>

        <div class="practice-layout">
          <article class="question-card">
            <header class="question-header">
              <span class="question-number">Question ${view.index + 1} of ${questions.length}</span>
              <button class="bookmark-button" id="bookmark" type="button" aria-label="Bookmark question" aria-pressed="${Boolean(state.bookmarks[question.id])}">◇</button>
            </header>
            <div class="question-body">
              <div class="tags">
                <span class="tag">${question.domain}</span>
                <span class="tag">${question.skill}</span>
                <span class="tag">${question.difficulty}</span>
                ${question.type === "spr" ? '<span class="tag">Student response</span>' : ""}
              </div>
              ${question.stimulus ? `<div class="stimulus">${escapeHtml(question.stimulus)}</div>` : ""}
              ${question.figure ? renderFigure(question.figure) : ""}
              ${question.table ? renderTable(question.table) : ""}
              <h1 class="question-prompt">${escapeHtml(question.question)}</h1>
              ${question.type === "spr" ? renderStudentResponse(question, response) : renderChoices(question, response)}
              ${response.checked ? renderFeedback(question, response) : ""}
              <div class="question-actions">
                <button class="secondary-button" id="previous-question" type="button" ${view.index === 0 ? "disabled" : ""}>Previous</button>
                ${response.checked
                  ? `<button class="primary-button" id="next-question" type="button">${isLast ? "Finish section" : "Next question"}</button>`
                  : '<button class="primary-button" id="check-answer" type="button" disabled>Check answer</button>'}
              </div>
            </div>
          </article>
          ${renderNavigator(questions)}
        </div>
      </div>`;

    wirePracticeEvents(questions, question, response, isLast);
  }

  function renderChoices(question, response) {
    return `
      <fieldset class="choices">
        <legend class="sr-only">Answer choices</legend>
        ${question.choices.map((choice, index) => {
          const chosen = String(response.value) === String(index);
          const correct = response.checked && index === question.answer;
          const incorrect = response.checked && chosen && index !== question.answer;
          return `<label class="choice ${correct ? "is-correct" : ""} ${incorrect ? "is-incorrect" : ""}">
            <input type="radio" name="answer" value="${index}" ${chosen ? "checked" : ""} ${response.checked ? "disabled" : ""}>
            <span class="choice-letter">${letters[index]}</span>
            <span>${escapeHtml(choice)}</span>
          </label>`;
        }).join("")}
      </fieldset>`;
  }

  function renderStudentResponse(question, response) {
    const status = response.checked ? (response.correct ? "is-correct" : "is-incorrect") : "";
    return `
      <div class="spr-wrap">
        <label for="student-response">Enter your answer</label>
        <input class="spr-input ${status}" id="student-response" inputmode="decimal" autocomplete="off" value="${escapeHtml(response.value || "")}" ${response.checked ? "disabled" : ""}>
        <p class="input-note">Enter an integer, decimal, or fraction. Do not enter symbols such as %, $, or π.</p>
      </div>`;
  }

  function renderTable(table) {
    return `
      <table class="data-table">
        ${table.caption ? `<caption>${escapeHtml(table.caption)}</caption>` : ""}
        <thead><tr>${table.headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("")}</tr></thead>
        <tbody>${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>`;
  }

  function renderFigure(figure) {
    if (figure.kind !== "scatter" || !Array.isArray(figure.points) || !figure.points.length) return "";
    const xs = figure.points.map((point) => Number(point[0]));
    const ys = figure.points.map((point) => Number(point[1]));
    const minX = Math.min(0, ...xs);
    const maxX = Math.max(...xs) || 1;
    const minY = Math.min(0, ...ys);
    const maxY = Math.max(...ys) || 1;
    const plotX = (x) => 42 + ((x - minX) / (maxX - minX || 1)) * 322;
    const plotY = (y) => 220 - ((y - minY) / (maxY - minY || 1)) * 182;
    return `<figure class="question-figure">
      <svg viewBox="0 0 400 260" role="img" aria-label="${escapeHtml(figure.label || "Scatterplot")}">
        <line x1="42" y1="220" x2="372" y2="220" class="axis-line" />
        <line x1="42" y1="228" x2="42" y2="32" class="axis-line" />
        <text x="374" y="238" class="axis-label">x</text>
        <text x="26" y="28" class="axis-label">y</text>
        ${figure.points.map(([x, y]) => `<circle cx="${plotX(Number(x)).toFixed(2)}" cy="${plotY(Number(y)).toFixed(2)}" r="5" class="data-point"><title>x = ${escapeHtml(x)}, y = ${escapeHtml(y)}</title></circle>`).join("")}
      </svg>
      <figcaption>${escapeHtml(figure.label || "Scatterplot")}</figcaption>
    </figure>`;
  }

  function renderFeedback(question, response) {
    const answerText = question.type === "spr" ? question.answerDisplay : `${letters[question.answer]}. ${question.choices[question.answer]}`;
    return `
      <section class="feedback ${response.correct ? "correct" : "incorrect"}" aria-live="polite">
        <p class="feedback-title">${response.correct ? "Correct." : `Not quite. The answer is ${escapeHtml(answerText)}.`}</p>
        <p>${escapeHtml(question.explanation)}</p>
      </section>`;
  }

  function renderNavigator(questions) {
    return `
      <aside class="navigator" aria-label="Question navigator">
        <div class="navigator-label"><span>Questions</span><span>${responseStats(questions).completed}/${questions.length}</span></div>
        <div class="question-grid">
          ${questions.map((question, index) => {
            const response = state.responses[question.id];
            const status = response?.checked ? (response.correct ? "correct" : "incorrect") : "";
            const current = index === view.index ? "current" : "";
            const bookmarked = state.bookmarks[question.id] ? "bookmarked" : "";
            return `<button class="question-jump ${status} ${current} ${bookmarked}" type="button" data-index="${index}" aria-label="Question ${index + 1}${status ? `, ${status}` : ""}">${index + 1}</button>`;
          }).join("")}
        </div>
        <div class="navigator-key">
          <span class="key-row"><span class="key-dot correct"></span>Correct</span>
          <span class="key-row"><span class="key-dot incorrect"></span>Needs review</span>
          <span class="key-row"><span class="key-dot"></span>Unanswered</span>
        </div>
      </aside>`;
  }

  function wirePracticeEvents(questions, question, response, isLast) {
    document.querySelector("#exit-practice").addEventListener("click", goHome);
    document.querySelector("#bookmark").addEventListener("click", () => {
      if (state.bookmarks[question.id]) {
        delete state.bookmarks[question.id];
      } else {
        state.bookmarks[question.id] = true;
      }
      saveState();
      renderPractice();
    });

    document.querySelectorAll(".question-jump").forEach((button) => {
      button.addEventListener("click", () => {
        view.index = Number(button.dataset.index);
        renderPractice();
      });
    });

    const previous = document.querySelector("#previous-question");
    previous?.addEventListener("click", () => {
      if (view.index > 0) {
        view.index -= 1;
        renderPractice();
      }
    });

    if (!response.checked) {
      const check = document.querySelector("#check-answer");
      if (question.type === "spr") {
        const input = document.querySelector("#student-response");
        const update = () => {
          check.disabled = input.value.trim() === "";
          state.responses[question.id] = { value: input.value };
          saveState();
        };
        input.addEventListener("input", update);
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter" && !check.disabled) check.click();
        });
        check.disabled = input.value.trim() === "";
      } else {
        document.querySelectorAll('input[name="answer"]').forEach((input) => {
          input.addEventListener("change", () => {
            check.disabled = false;
            state.responses[question.id] = { value: input.value };
            saveState();
          });
        });
        check.disabled = response.value === undefined;
      }

      check.addEventListener("click", () => checkAnswer(question));
    } else {
      document.querySelector("#next-question").addEventListener("click", () => {
        if (isLast) {
          renderCompletion(questions);
        } else {
          view.index += 1;
          renderPractice();
        }
      });
    }
  }

  function checkAnswer(question) {
    const current = state.responses[question.id];
    if (!current || current.value === undefined || String(current.value).trim() === "") return;

    let correct;
    if (question.type === "spr") {
      correct = question.accepted.some((answer) => normalizeResponse(answer) === normalizeResponse(current.value));
    } else {
      correct = Number(current.value) === question.answer;
    }

    state.responses[question.id] = { ...current, checked: true, correct };
    saveState();
    renderPractice();
  }

  function normalizeResponse(value) {
    const compact = String(value).trim().replaceAll(" ", "").replace(/^\+/, "");
    if (/^-?\d+\/\d+$/.test(compact)) {
      const [numerator, denominator] = compact.split("/").map(Number);
      return denominator === 0 ? compact : String(numerator / denominator);
    }
    const number = Number(compact);
    return Number.isFinite(number) ? String(number) : compact.toLowerCase();
  }

  function renderCompletion(questions) {
    const stats = responseStats(questions);
    app.innerHTML = `
      <div class="practice-shell">
        <section class="complete-card">
          <div>
            <p class="eyebrow">Section review</p>
            <h1>${stats.correct} / ${stats.completed}</h1>
            <p>You completed ${stats.completed} of ${questions.length} questions with ${stats.accuracy}% accuracy. Use the navigator to revisit missed or bookmarked questions.</p>
            <div class="complete-actions">
              <button class="primary-button" id="review-section" type="button">Review questions</button>
              <button class="secondary-button" id="completion-home" type="button">Back to dashboard</button>
            </div>
          </div>
        </section>
      </div>`;
    document.querySelector("#review-section").addEventListener("click", () => {
      const missed = questions.findIndex((question) => state.responses[question.id]?.checked && !state.responses[question.id].correct);
      view.index = missed === -1 ? 0 : missed;
      renderPractice();
    });
    document.querySelector("#completion-home").addEventListener("click", goHome);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  homeButton.addEventListener("click", goHome);

  if (!Array.isArray(window.SAT_QUESTIONS)) {
    app.innerHTML = '<p class="dashboard">The question bank could not be loaded.</p>';
    return;
  }

  render();
})();
