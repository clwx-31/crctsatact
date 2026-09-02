(() => {
  "use strict";

  const STORAGE_KEY = "form-sat-practice-v1";
  const app = document.querySelector("#app");
  const homeButton = document.querySelector("#home-button");
  const letters = ["A", "B", "C", "D"];

  let state = loadState();
  let view = { name: "dashboard", section: null, index: 0 };

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

  function sectionQuestions(section) {
    return window.SAT_QUESTIONS.filter((question) => question.section === section);
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

  function startSection(section) {
    const questions = sectionQuestions(section);
    const firstOpen = questions.findIndex((question) => !answered(question));
    view = { name: "practice", section, index: firstOpen === -1 ? 0 : firstOpen };
    render();
  }

  function goHome() {
    view = { name: "dashboard", section: null, index: 0 };
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

    app.innerHTML = `
      <div class="dashboard">
        <section class="hero" aria-labelledby="page-title">
          <div>
            <p class="eyebrow">Focused practice / current digital format</p>
            <h1 id="page-title">Practice precisely.</h1>
          </div>
          <p class="hero-copy">One hundred original questions shaped around the current SAT blueprint. Work by section, see the reasoning, and keep your weak spots visible.</p>
        </section>

        <section class="metrics" aria-label="Practice progress">
          <div class="metric"><span class="metric-value">${overall.completed}<span class="faint">/100</span></span><span class="metric-label">Completed</span></div>
          <div class="metric"><span class="metric-value">${overall.completed ? `${overall.accuracy}%` : "—"}</span><span class="metric-label">Accuracy</span></div>
          <div class="metric"><span class="metric-value">${rwStats.completed}<span class="faint">/50</span></span><span class="metric-label">Reading + Writing</span></div>
          <div class="metric"><span class="metric-value">${mathStats.completed}<span class="faint">/50</span></span><span class="metric-label">Math</span></div>
        </section>

        <div class="section-heading">
          <h2>Choose a section</h2>
          <p>Questions progress from easy to hard.</p>
        </div>

        <section class="section-grid" aria-label="SAT sections">
          ${sectionCard("01", "Reading and Writing", "Reading + Writing", rwStats, "4 domains · 50 questions")}
          ${sectionCard("02", "Math", "Math", mathStats, "4 domains · 50 questions")}
        </section>

        <section class="standards" aria-labelledby="standards-title">
          <h2 id="standards-title">Built to the blueprint</h2>
          <div class="standards-list">
            <div class="standard"><span class="standard-number">01 / FORMAT</span><p>Short passages, one Reading and Writing question per text, and both Math response formats.</p></div>
            <div class="standard"><span class="standard-number">02 / COVERAGE</span><p>Domain proportions mirror the College Board specifications across both sections.</p></div>
            <div class="standard"><span class="standard-number">03 / REVIEW</span><p>Every item includes a direct rationale designed to expose the tested idea—not just name the key.</p></div>
          </div>
        </section>
      </div>`;

    document.querySelectorAll("[data-section]").forEach((button) => {
      button.addEventListener("click", () => startSection(button.dataset.section));
    });
  }

  function sectionCard(index, section, label, stats, detail) {
    const action = stats.completed === 50 ? "Review section" : stats.completed ? "Continue practice" : "Start practice";
    return `
      <button class="section-card" type="button" data-section="${section}">
        <span class="section-card-top"><span class="section-index">${index}</span><span class="section-count">${stats.completed}/50 complete</span></span>
        <h3>${label}</h3>
        <span class="section-card-footer"><span>${detail}</span><span><span class="sr-only">${action}</span><span class="arrow" aria-hidden="true">↗</span></span></span>
      </button>`;
  }

  function renderPractice() {
    const questions = sectionQuestions(view.section);
    const question = questions[view.index];
    const stats = responseStats(questions);
    const response = state.responses[question.id] || {};
    const isLast = view.index === questions.length - 1;

    app.innerHTML = `
      <div class="practice-shell">
        <div class="practice-toolbar">
          <div class="toolbar-title">${view.section}</div>
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
