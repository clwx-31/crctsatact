(() => {
  "use strict";

  const STORAGE_KEY = "form-sat-practice-v1";
  const MATH_SEED_KEY = "form-sat-math-seed-v1";
  const MATH_VARIANT_KEY = "form-sat-math-variant-v1";
  const RW_SEED_KEY = "form-sat-rw-seed-v1";
  const RW_VARIANT_KEY = "form-sat-rw-variant-v1";
  const MATH_PRACTICE_SET_KEY = "form-sat-math-practice-set-v1";
  const RW_PRACTICE_SET_KEY = "form-sat-rw-practice-set-v1";
  const ACTIVE_TEST_KEY = "form-sat-active-test-v1";
  const TEST_HISTORY_KEY = "form-sat-test-history-v1";
  const TEST_VARIANT_KEY = "form-sat-test-variant-v1";
  const app = document.querySelector("#app");
  const homeButton = document.querySelector("#home-button");
  const topTabs = [...document.querySelectorAll("[data-top-view]")];
  const letters = ["A", "B", "C", "D"];

  let mathSeed = localStorage.getItem(MATH_SEED_KEY) || "baseline-v1";
  let rwSeed = localStorage.getItem(RW_SEED_KEY) || "baseline-v1";
  const practiceSets = {
    Math: Number(localStorage.getItem(MATH_PRACTICE_SET_KEY)) === 2 ? 2 : 1,
    "Reading and Writing": Number(localStorage.getItem(RW_PRACTICE_SET_KEY)) === 2 ? 2 : 1
  };
  if (typeof window.applySATMathSet === "function") window.applySATMathSet(mathSeed);
  if (typeof window.applySATRWSet === "function") window.applySATRWSet(rwSeed);
  let state = loadState();
  let activeTest = loadJson(ACTIVE_TEST_KEY, null);
  let testHistory = loadJson(TEST_HISTORY_KEY, []);
  let lastTestResult = null;
  let timerHandle = null;
  let view = activeTest
    ? { name: "test", section: null, skill: null, difficulty: null, index: activeTest.index || 0 }
    : { name: "dashboard", section: null, skill: null, difficulty: null, index: 0 };

  function loadJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

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

  function sectionQuestions(section, skill = null, difficulty = null, practiceSet = undefined) {
    const selectedSet = practiceSet === null ? null : (practiceSet ?? practiceSets[section]);
    return window.SAT_QUESTIONS.filter((question) => question.section === section
      && (!skill || question.skill === skill)
      && (!difficulty || question.difficulty === difficulty)
      && (!selectedSet || question.practiceSet === selectedSet));
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

  function setPracticeSet(section, practiceSet, shouldRender = true) {
    const normalized = Number(practiceSet) === 2 ? 2 : 1;
    practiceSets[section] = normalized;
    localStorage.setItem(section === "Math" ? MATH_PRACTICE_SET_KEY : RW_PRACTICE_SET_KEY, String(normalized));
    if (shouldRender) render();
  }

  function startSection(section, skill = null, difficulty = null, practiceSet = undefined) {
    const selectedSet = Number(practiceSet ?? practiceSets[section]) === 2 ? 2 : 1;
    setPracticeSet(section, selectedSet, false);
    const questions = sectionQuestions(section, skill, difficulty, selectedSet);
    const firstOpen = questions.findIndex((question) => !answered(question));
    view = { name: "practice", section, skill, difficulty, practiceSet: selectedSet, index: firstOpen === -1 ? 0 : firstOpen };
    render();
  }

  function goHome() {
    clearTestTimer();
    view = { name: "dashboard", section: null, skill: null, difficulty: null, index: 0 };
    render();
  }

  function openMiniTests() {
    clearTestTimer();
    view = { name: "mini-tests", section: null, skill: null, difficulty: null, index: 0 };
    render();
  }

  function syncTopTabs() {
    const current = view.name === "mini-tests" ? "mini-tests" : "dashboard";
    topTabs.forEach((tab) => {
      const active = tab.dataset.topView === current;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-current", active ? "page" : "false");
    });
  }

  function render() {
    clearTestTimer();
    syncTopTabs();
    if (view.name === "practice") renderPractice();
    else if (view.name === "mini-tests") renderMiniTestHub();
    else if (view.name === "test-setup") renderTestSetup();
    else if (view.name === "test") renderTest();
    else if (view.name === "test-results") renderTestResults();
    else renderDashboard();
    app.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderDashboard() {
    const overall = responseStats();
    const rw = sectionQuestions("Reading and Writing", null, null, null);
    const math = sectionQuestions("Math", null, null, null);
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
          <p class="hero-copy">${totalQuestions} original questions across two permanent sets, shaped around the current SAT blueprint. Drill one exact skill at a time, see the reasoning, and generate fresh variants without losing prior progress.</p>
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
          ${sectionCard("01", "Reading and Writing", "Reading + Writing", rwStats, `4 domains · 11 skills · 2 sets · ${rw.length} questions`, rw.length)}
          ${sectionCard("02", "Math", "Math", mathStats, `4 domains · 20 skills · 2 sets · ${math.length} questions`, math.length)}
        </section>

        ${renderTestCenter()}

        ${renderRWLibrary()}
        ${renderMathLibrary()}

        <section class="standards" aria-labelledby="standards-title">
          <h2 id="standards-title">Built to the blueprint</h2>
          <div class="standards-list">
            <div class="standard"><span class="standard-number">01 / FORMAT</span><p>Short passages, one Reading and Writing question per text, and both Math response formats.</p></div>
            <div class="standard"><span class="standard-number">02 / COVERAGE</span><p>Every targeted Math and Reading and Writing skill has two non-overlapping sets of 25 questions, each progressing through easy, medium, and hard variants.</p></div>
            <div class="standard"><span class="standard-number">03 / REVIEW</span><p>Every item includes a direct rationale designed to expose the tested idea—not just name the key.</p></div>
          </div>
        </section>
      </div>`;

    document.querySelectorAll("[data-section]").forEach((button) => {
      button.addEventListener("click", () => startSection(button.dataset.section));
    });
    document.querySelectorAll("[data-math-skill]").forEach((button) => {
      button.addEventListener("click", () => startSection("Math", button.dataset.mathSkill, null, button.dataset.practiceSet));
    });
    document.querySelectorAll("[data-rw-skill]").forEach((button) => {
      button.addEventListener("click", () => startSection("Reading and Writing", button.dataset.rwSkill, null, button.dataset.practiceSet));
    });
    document.querySelectorAll("[data-mini-test]").forEach((button) => {
      button.addEventListener("click", () => openTestSetup("skill", button.dataset.testSection, button.dataset.miniTest, button.dataset.testSet));
    });
    document.querySelectorAll("[data-test-kind]").forEach((button) => {
      button.addEventListener("click", () => openTestSetup(button.dataset.testKind, button.dataset.testSection || null));
    });
    document.querySelector("#resume-test")?.addEventListener("click", () => {
      view = { name: "test", section: null, skill: null, difficulty: null, index: activeTest.index || 0 };
      render();
    });
    wirePracticeSetControls();
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

  function renderTestCenter() {
    const history = testHistory.slice(0, 4);
    return `
      <section class="test-center" aria-labelledby="test-center-title">
        <div class="test-center-header">
          <div><p class="eyebrow">Test mode</p><h2 id="test-center-title">Measure under pressure.</h2></div>
          <p>Answers stay hidden until submission. Each result includes an estimated SAT section score or total score range, skill diagnostics, and full mistake review.</p>
        </div>
        ${activeTest ? `<button class="resume-test" id="resume-test" type="button"><span><strong>Resume ${escapeHtml(activeTest.definition.title)}</strong><small>${escapeHtml(activeTest.modules[activeTest.moduleIndex].label)} · Question ${(activeTest.index || 0) + 1}</small></span><span aria-hidden="true">Continue ↗</span></button>` : ""}
        <div class="test-option-grid">
          <button class="test-option" type="button" data-test-kind="section" data-test-section="Reading and Writing"><span class="test-option-kicker">One module</span><strong>Reading + Writing</strong><small>27 questions · 32 minutes</small></button>
          <button class="test-option" type="button" data-test-kind="section" data-test-section="Math"><span class="test-option-kicker">One module</span><strong>Math</strong><small>22 questions · 35 minutes</small></button>
          <button class="test-option featured" type="button" data-test-kind="full"><span class="test-option-kicker">Full simulation</span><strong>Complete SAT</strong><small>98 questions · 2 hours 14 minutes</small></button>
        </div>
        ${history.length ? `<div class="test-history"><h3>Recent estimates</h3>${history.map((attempt) => `<div class="history-row"><span><strong>${escapeHtml(attempt.title)}</strong><small>${escapeHtml(attempt.completedAt)}</small></span><span class="history-score">${attempt.total ? `${attempt.estimate} <small>${attempt.low}–${attempt.high}</small>` : `${escapeHtml(attempt.section)} ${attempt.estimate} <small>${attempt.low}–${attempt.high}</small>`}</span></div>`).join("")}</div>` : ""}
      </section>`;
  }

  function renderPracticeSetSelector(section, compact = false) {
    const current = practiceSets[section];
    return `<div class="practice-set-selector ${compact ? "compact" : ""}" role="group" aria-label="Choose ${escapeHtml(section)} question set">
      <button type="button" class="practice-set-option ${current === 1 ? "active" : ""}" data-set-control="1" data-set-section="${escapeHtml(section)}" aria-pressed="${current === 1}">Set 1</button>
      <button type="button" class="practice-set-option ${current === 2 ? "active" : ""}" data-set-control="2" data-set-section="${escapeHtml(section)}" aria-pressed="${current === 2}">Set 2</button>
    </div>`;
  }

  function wirePracticeSetControls() {
    document.querySelectorAll("[data-set-control]").forEach((button) => button.addEventListener("click", () => {
      setPracticeSet(button.dataset.setSection, button.dataset.setControl);
    }));
  }

  function renderSkillActions(section, skill) {
    const attribute = section === "Math" ? "data-math-skill" : "data-rw-skill";
    const set1 = responseStats(sectionQuestions(section, skill.name, null, 1));
    const set2 = responseStats(sectionQuestions(section, skill.name, null, 2));
    return `<div class="skill-set-actions">
      <button type="button" class="${practiceSets[section] === 1 ? "current" : ""}" ${attribute}="${escapeHtml(skill.name)}" data-practice-set="1" aria-label="Practice ${escapeHtml(skill.name)}, Set 1"><span>Set 1</span><small>${set1.completed}/25</small></button>
      <button type="button" class="${practiceSets[section] === 2 ? "current" : ""}" ${attribute}="${escapeHtml(skill.name)}" data-practice-set="2" aria-label="Practice ${escapeHtml(skill.name)}, Set 2"><span>Set 2</span><small>${set2.completed}/25</small></button>
      <button class="mini-test-button" type="button" data-mini-test="${escapeHtml(skill.name)}" data-test-section="${escapeHtml(section)}" data-test-set="${practiceSets[section]}" aria-label="Start ${escapeHtml(skill.name)} mini-test using Set ${practiceSets[section]}">10-Q test</button>
    </div>`;
  }

  function renderMathLibrary() {
    if (!Array.isArray(window.SAT_MATH_SKILLS)) return "";
    const domains = [...new Set(window.SAT_MATH_SKILLS.map((skill) => skill.domain))];
    return `
      <section class="skill-library" aria-labelledby="math-library-title">
        <div class="skill-library-header">
          <div><p class="eyebrow">Targeted Math practice</p><h2 id="math-library-title">Choose an exact skill.</h2></div>
          <div class="set-controls">
            <span class="set-label">Question bank: ${escapeHtml(mathSeed)}</span>
            ${renderPracticeSetSelector("Math", true)}
            <button class="secondary-button compact-button" id="todays-math-set" type="button">Today's set</button>
            <button class="secondary-button compact-button" id="new-math-variant" type="button">New variant</button>
          </div>
        </div>
        <p class="skill-library-intro">Each skill contains two non-overlapping 25-question sets. Every set has 8 easy, 9 medium, and 8 hard questions. Choose Set 1 or Set 2 beside any skill.</p>
        <div class="domain-list">
          ${domains.map((domain) => `
            <section class="domain-group">
              <h3>${domain}</h3>
              <div class="skill-list">
                ${window.SAT_MATH_SKILLS.filter((skill) => skill.domain === domain).map((skill) => {
                  return `<div class="skill-row-wrap">
                    <div class="skill-row"><span><strong>${escapeHtml(skill.name)}</strong><small>${escapeHtml(skill.description)}</small></span></div>
                    ${renderSkillActions("Math", skill)}
                  </div>`;
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
            <span class="set-label">Question bank: ${escapeHtml(rwSeed)}</span>
            ${renderPracticeSetSelector("Reading and Writing", true)}
            <button class="secondary-button compact-button" id="todays-rw-set" type="button">Today's set</button>
            <button class="secondary-button compact-button" id="new-rw-variant" type="button">New variant</button>
          </div>
        </div>
        <p class="skill-library-intro">Each skill contains two non-overlapping 25-question sets, and each set has 8 easy, 9 medium, and 8 hard questions. Passages follow the digital SAT's one-question-per-text format.</p>
        <div class="domain-list">
          ${domains.map((domain) => `
            <section class="domain-group">
              <h3>${domain}</h3>
              <div class="skill-list">
                ${window.SAT_RW_SKILLS.filter((skill) => skill.domain === domain).map((skill) => {
                  return `<div class="skill-row-wrap">
                    <div class="skill-row"><span><strong>${escapeHtml(skill.name)}</strong><small>${escapeHtml(skill.description)}</small></span></div>
                    ${renderSkillActions("Reading and Writing", skill)}
                  </div>`;
                }).join("")}
              </div>
            </section>`).join("")}
        </div>
      </section>`;
  }

  function renderMiniTestList(section, skills) {
    return `<section class="mini-test-section">
      <div class="mini-test-section-header">
        <div><p class="eyebrow">${escapeHtml(section)}</p><h2>${skills.length} skill mini-tests</h2></div>
        ${renderPracticeSetSelector(section)}
      </div>
      <div class="mini-test-list">${skills.map((skill) => `<button type="button" class="mini-test-row" data-mini-test="${escapeHtml(skill.name)}" data-test-section="${escapeHtml(section)}" data-test-set="${practiceSets[section]}"><span><strong>${escapeHtml(skill.name)}</strong><small>${escapeHtml(skill.domain)} · Set ${practiceSets[section]}</small></span><span>10 questions ↗</span></button>`).join("")}</div>
    </section>`;
  }

  function renderMiniTestHub() {
    app.innerHTML = `<div class="dashboard mini-test-hub">
      <section class="mini-hub-hero" aria-labelledby="mini-hub-title">
        <div><p class="eyebrow">Mini-test library</p><h1 id="mini-hub-title">Test the pattern.</h1></div>
        <p>Run a combined Math and Reading test or isolate one exact skill. Answers stay hidden until submission, and every result includes an estimated score range and complete mistake coaching.</p>
      </section>
      ${activeTest ? `<button class="resume-test" id="resume-test" type="button"><span><strong>Resume ${escapeHtml(activeTest.definition.title)}</strong><small>${escapeHtml(activeTest.modules[activeTest.moduleIndex].label)} · Question ${(activeTest.index || 0) + 1}</small></span><span aria-hidden="true">Continue ↗</span></button>` : ""}
      <section class="combined-mini-card">
        <div><span class="test-option-kicker">Both sections</span><h2>Combined Math + Reading</h2><p>10 Reading and Writing questions plus 10 Math questions, balanced across all eight official content domains.</p></div>
        <div class="combined-mini-meta"><span>Reading Set ${practiceSets["Reading and Writing"]}</span><span>Math Set ${practiceSets.Math}</span><span>20 questions · 28 minutes</span></div>
        <button class="primary-button" type="button" data-test-kind="mixed">Start combined mini-test</button>
      </section>
      <div class="mini-test-columns">
        ${renderMiniTestList("Reading and Writing", window.SAT_RW_SKILLS)}
        ${renderMiniTestList("Math", window.SAT_MATH_SKILLS)}
      </div>
    </div>`;
    wirePracticeSetControls();
    document.querySelectorAll("[data-mini-test]").forEach((button) => button.addEventListener("click", () => {
      openTestSetup("skill", button.dataset.testSection, button.dataset.miniTest, button.dataset.testSet);
    }));
    document.querySelector("[data-test-kind='mixed']")?.addEventListener("click", () => openTestSetup("mixed"));
    document.querySelector("#resume-test")?.addEventListener("click", () => {
      view = { name: "test", section: null, skill: null, difficulty: null, index: activeTest.index || 0 };
      render();
    });
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

  function openTestSetup(kind, section = null, skill = null, practiceSet = undefined) {
    if (typeof window.buildSATTest !== "function") return;
    if (section && practiceSet !== undefined) setPracticeSet(section, practiceSet, false);
    view = { name: "test-setup", kind, section, skill, difficulty: null, index: 0 };
    render();
  }

  function renderTestSetup() {
    const definition = window.SAT_TEST_DEFINITIONS.testDefinition(view.kind, view.section, view.skill);
    const scoreLabel = definition.kind === "full" || definition.kind === "mixed" ? "estimated 400–1600 total score" : `estimated 200–800 ${definition.section} score`;
    const setSelectors = definition.section
      ? renderPracticeSetSelector(definition.section)
      : `<div class="test-set-pair"><div><span>Reading + Writing bank</span>${renderPracticeSetSelector("Reading and Writing")}</div><div><span>Math bank</span>${renderPracticeSetSelector("Math")}</div></div>`;
    app.innerHTML = `
      <div class="practice-shell">
        <section class="test-setup-card">
          <p class="eyebrow">Ready when you are</p>
          <h1>${escapeHtml(definition.title)}</h1>
          <p class="setup-summary">${escapeHtml(definition.summary)} · ${scoreLabel}</p>
          <div class="test-bank-choice"><span>Question set</span>${setSelectors}</div>
          <div class="setup-details">
            <div><span>Feedback</span><strong>After submission</strong></div>
            <div><span>Question mix</span><strong>Easy, medium, and hard</strong></div>
            <div><span>Scoring</span><strong>Estimate plus uncertainty range</strong></div>
          </div>
          <p class="score-caveat">This is an original, nonadaptive practice test. Its score is an evidence-based estimate—not an official College Board score. Full tests provide a stronger projection than one-skill tests.</p>
          <div class="complete-actions">
            <button class="primary-button" id="start-timed-test" type="button">Start timed</button>
            <button class="secondary-button" id="start-untimed-test" type="button">Start untimed</button>
            <button class="text-button" id="cancel-test" type="button">Cancel</button>
          </div>
        </section>
      </div>`;
    document.querySelector("#start-timed-test").addEventListener("click", () => startTestAttempt(true));
    document.querySelector("#start-untimed-test").addEventListener("click", () => startTestAttempt(false));
    document.querySelector("#cancel-test").addEventListener("click", goHome);
    wirePracticeSetControls();
  }

  function startTestAttempt(timed) {
    const next = Number(localStorage.getItem(TEST_VARIANT_KEY) || 0) + 1;
    localStorage.setItem(TEST_VARIANT_KEY, String(next));
    const seed = `attempt-${next}/${rwSeed}/${mathSeed}`;
    const test = window.buildSATTest({ kind: view.kind, section: view.section, skill: view.skill, seed, practiceSets: { ...practiceSets } });
    activeTest = {
      ...test,
      timed,
      moduleIndex: 0,
      index: 0,
      answers: {},
      completedModules: [],
      remainingSeconds: test.modules[0].durationSeconds,
      deadlineAt: timed ? Date.now() + test.modules[0].durationSeconds * 1000 : null,
      startedAt: new Date().toISOString()
    };
    saveActiveTest();
    view = { name: "test", section: null, skill: null, difficulty: null, index: 0 };
    render();
  }

  function saveActiveTest() {
    if (activeTest) localStorage.setItem(ACTIVE_TEST_KEY, JSON.stringify(activeTest));
    else localStorage.removeItem(ACTIVE_TEST_KEY);
  }

  function clearTestTimer() {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(safe / 60);
    return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
  }

  function runTestTimer() {
    if (!activeTest?.timed) return;
    timerHandle = setInterval(() => {
      activeTest.remainingSeconds = Math.max(0, Math.ceil((activeTest.deadlineAt - Date.now()) / 1000));
      const display = document.querySelector("#test-timer");
      if (display) display.textContent = formatTime(activeTest.remainingSeconds);
      if (activeTest.remainingSeconds % 5 === 0) saveActiveTest();
      if (activeTest.remainingSeconds === 0) finishTestModule(true);
    }, 1000);
  }

  function renderTest() {
    if (!activeTest) return goHome();
    if (activeTest.timed) {
      activeTest.deadlineAt ||= Date.now() + activeTest.remainingSeconds * 1000;
      activeTest.remainingSeconds = Math.max(0, Math.ceil((activeTest.deadlineAt - Date.now()) / 1000));
      if (activeTest.remainingSeconds === 0) {
        app.innerHTML = '<div class="practice-shell"><section class="test-setup-card"><p class="eyebrow">Time</p><h1>Module complete.</h1><p>Submitting your saved answers…</p></section></div>';
        window.setTimeout(() => finishTestModule(true), 0);
        return;
      }
    }
    const module = activeTest.modules[activeTest.moduleIndex];
    const question = module.questions[activeTest.index];
    const value = activeTest.answers[question.id];
    const answeredCount = module.questions.filter((item) => activeTest.answers[item.id] !== undefined && String(activeTest.answers[item.id]).trim() !== "").length;
    const isLast = activeTest.index === module.questions.length - 1;
    const isFinalModule = activeTest.moduleIndex === activeTest.modules.length - 1;

    app.innerHTML = `
      <div class="practice-shell test-shell">
        <div class="practice-toolbar test-toolbar">
          <div class="toolbar-title">${escapeHtml(module.label)}</div>
          <div class="progress-wrap">
            <div class="progress-meta"><span class="progress-label">Module progress</span><span>${answeredCount} / ${module.questions.length}</span></div>
            <div class="progress-track"><div class="progress-bar" style="width:${answeredCount / module.questions.length * 100}%"></div></div>
          </div>
          <div class="test-toolbar-actions">${activeTest.timed ? `<span class="test-timer" id="test-timer" aria-label="Time remaining">${formatTime(activeTest.remainingSeconds)}</span>` : '<span class="untimed-label">Untimed</span>'}<button class="text-button" id="exit-test" type="button">${activeTest.timed ? "Exit · timer runs" : "Save & exit"}</button></div>
        </div>
        <div class="practice-layout">
          <article class="question-card">
            <header class="question-header"><span class="question-number">Question ${activeTest.index + 1} of ${module.questions.length}</span><span class="module-count">Module ${activeTest.moduleIndex + 1} of ${activeTest.modules.length}</span></header>
            <div class="question-body">
              <div class="tags"><span class="tag">${escapeHtml(question.domain)}</span><span class="tag">${escapeHtml(question.skill)}</span><span class="tag">${question.difficulty}</span>${question.type === "spr" ? '<span class="tag">Student response</span>' : ""}</div>
              ${question.stimulus ? `<div class="stimulus">${escapeHtml(question.stimulus)}</div>` : ""}
              ${question.figure ? renderFigure(question.figure) : ""}
              ${question.table ? renderTable(question.table) : ""}
              <h1 class="question-prompt">${escapeHtml(question.question)}</h1>
              ${question.type === "spr" ? renderTestStudentResponse(value) : renderTestChoices(question, value)}
              <div class="question-actions">
                <button class="secondary-button" id="test-previous" type="button" ${activeTest.index === 0 ? "disabled" : ""}>Previous</button>
                <button class="primary-button" id="test-next" type="button">${isLast ? (isFinalModule ? "Submit test" : "Finish module") : "Next"}</button>
              </div>
            </div>
          </article>
          ${renderTestNavigator(module.questions)}
        </div>
      </div>`;

    document.querySelector("#exit-test").addEventListener("click", goHome);
    document.querySelector("#test-previous")?.addEventListener("click", () => {
      activeTest.index -= 1;
      saveActiveTest();
      render();
    });
    document.querySelector("#test-next").addEventListener("click", () => {
      if (isLast) finishTestModule(false);
      else {
        activeTest.index += 1;
        saveActiveTest();
        render();
      }
    });
    document.querySelectorAll("[data-test-index]").forEach((button) => button.addEventListener("click", () => {
      activeTest.index = Number(button.dataset.testIndex);
      saveActiveTest();
      render();
    }));
    if (question.type === "spr") {
      document.querySelector("#test-student-response").addEventListener("input", (event) => {
        activeTest.answers[question.id] = event.target.value;
        saveActiveTest();
      });
    } else {
      document.querySelectorAll('input[name="test-answer"]').forEach((input) => input.addEventListener("change", () => {
        activeTest.answers[question.id] = input.value;
        saveActiveTest();
      }));
    }
    runTestTimer();
  }

  function renderTestChoices(question, value) {
    return `<fieldset class="choices"><legend class="sr-only">Answer choices</legend>${question.choices.map((choice, index) => `<label class="choice"><input type="radio" name="test-answer" value="${index}" ${String(value) === String(index) ? "checked" : ""}><span class="choice-letter">${letters[index]}</span><span>${escapeHtml(choice)}</span></label>`).join("")}</fieldset>`;
  }

  function renderTestStudentResponse(value) {
    return `<div class="spr-wrap"><label for="test-student-response">Enter your answer</label><input class="spr-input" id="test-student-response" inputmode="decimal" autocomplete="off" value="${escapeHtml(value || "")}"><p class="input-note">Enter an integer, decimal, or fraction. Answers are checked after submission.</p></div>`;
  }

  function renderTestNavigator(questions) {
    return `<aside class="navigator" aria-label="Test question navigator"><div class="navigator-label"><span>Questions</span><span>Current module</span></div><div class="question-grid">${questions.map((question, index) => {
      const answeredClass = activeTest.answers[question.id] !== undefined && String(activeTest.answers[question.id]).trim() !== "" ? "answered" : "";
      return `<button class="question-jump ${answeredClass} ${index === activeTest.index ? "current" : ""}" type="button" data-test-index="${index}" aria-label="Question ${index + 1}${answeredClass ? ", answered" : ""}">${index + 1}</button>`;
    }).join("")}</div><div class="navigator-key"><span class="key-row"><span class="key-dot answered"></span>Answered</span><span class="key-row"><span class="key-dot"></span>Unanswered</span></div></aside>`;
  }

  function finishTestModule(forced) {
    if (!activeTest) return;
    clearTestTimer();
    const module = activeTest.modules[activeTest.moduleIndex];
    const unanswered = module.questions.filter((question) => activeTest.answers[question.id] === undefined || String(activeTest.answers[question.id]).trim() === "").length;
    if (!forced && unanswered && !window.confirm(`${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered. Finish this module anyway?`)) {
      runTestTimer();
      return;
    }
    activeTest.completedModules.push(activeTest.moduleIndex);
    if (activeTest.moduleIndex < activeTest.modules.length - 1) {
      activeTest.moduleIndex += 1;
      activeTest.index = 0;
      activeTest.remainingSeconds = activeTest.modules[activeTest.moduleIndex].durationSeconds;
      activeTest.deadlineAt = activeTest.timed ? Date.now() + activeTest.remainingSeconds * 1000 : null;
      saveActiveTest();
      render();
      return;
    }
    completeTest();
  }

  function completeTest() {
    clearTestTimer();
    const finishedTest = activeTest;
    const score = window.scoreSATTest(finishedTest, finishedTest.answers);
    lastTestResult = { test: finishedTest, score };
    const primary = score.total || Object.values(score.sections)[0];
    testHistory.unshift({
      title: finishedTest.definition.title,
      section: finishedTest.definition.section,
      total: Boolean(score.total),
      estimate: primary.estimate,
      low: primary.low,
      high: primary.high,
      completedAt: new Date().toLocaleDateString()
    });
    testHistory = testHistory.slice(0, 10);
    localStorage.setItem(TEST_HISTORY_KEY, JSON.stringify(testHistory));
    activeTest = null;
    saveActiveTest();
    view = { name: "test-results", section: null, skill: null, difficulty: null, index: 0 };
    render();
  }

  function renderTestResults() {
    if (!lastTestResult) return goHome();
    const { test, score } = lastTestResult;
    const missed = score.questionResults.filter((result) => !result.correct);
    const mainScore = score.total || Object.values(score.sections)[0];
    app.innerHTML = `
      <div class="practice-shell results-shell">
        <section class="score-hero">
          <p class="eyebrow">Estimated SAT performance</p>
          <h1>${mainScore.estimate}</h1>
          <p class="score-range">Estimated range: <strong>${mainScore.low}–${mainScore.high}</strong></p>
          <p>${score.total ? "Total score estimate across both sections" : `${escapeHtml(test.definition.section)} section score estimate`} · ${score.questionResults.filter((result) => result.correct).length}/${score.questionResults.length} correct</p>
          <p class="score-caveat">This projection is based on College Board's 2026 Practice Test 11 range conversion, adjusted for this test's length and difficulty mix. It is not an official score because these original items are not IRT-calibrated and this simulation is nonadaptive.</p>
        </section>
        <section class="section-score-grid">${Object.values(score.sections).map((section) => `<div class="section-score"><span>${escapeHtml(section.section)}</span><strong>${section.estimate}</strong><small>${section.low}–${section.high} · ${section.correct}/${section.total} correct</small></div>`).join("")}</section>
        <section class="domain-results"><h2>Domain performance</h2>${Object.entries(score.domainBreakdown).map(([domain, result]) => `<div class="domain-result"><span>${escapeHtml(domain)}</span><strong>${result.correct}/${result.total}</strong><div class="mini-track"><span style="width:${result.correct / result.total * 100}%"></span></div></div>`).join("")}</section>
        <div class="results-actions"><button class="primary-button" id="results-home" type="button">Back to dashboard</button><button class="secondary-button" id="retake-test" type="button">New version</button><a class="text-link" href="${escapeHtml(score.source)}" target="_blank" rel="noreferrer">Scoring source ↗</a></div>
        <section class="mistake-review"><div class="section-heading"><h2>Mistake review</h2><p>${missed.length ? `${missed.length} to review` : "Perfect—no missed questions"}</p></div>${missed.map((result, index) => renderMistakeCard(result, index)).join("")}</section>
      </div>`;
    document.querySelector("#results-home").addEventListener("click", goHome);
    document.querySelector("#retake-test").addEventListener("click", () => openTestSetup(test.definition.kind, test.definition.section, test.definition.skill));
    document.querySelectorAll("[data-result-question]").forEach((button) => button.addEventListener("click", () => {
      const result = score.questionResults.find((entry) => entry.question.id === button.dataset.resultQuestion);
      if (result) startSimilarQuestion(result.question);
    }));
  }

  function renderMistakeCard(result, index) {
    const coaching = window.getSATCoaching(result.question, result.value);
    return `<article class="mistake-card"><header><span>Review ${index + 1}</span><span>${escapeHtml(result.question.skill)}</span></header>${result.question.stimulus ? `<div class="stimulus compact-stimulus">${escapeHtml(result.question.stimulus)}</div>` : ""}${result.question.figure ? renderFigure(result.question.figure) : ""}${result.question.table ? renderTable(result.question.table) : ""}<h3>${escapeHtml(result.question.question)}</h3><div class="answer-comparison"><p><span>Your answer</span>${escapeHtml(coaching.selected)}</p><p><span>Correct answer</span>${escapeHtml(coaching.correct)}</p></div><div class="coaching-grid"><div><span>Why it missed</span><p>${escapeHtml(coaching.diagnosis)}</p></div><div><span>Correct reasoning</span><p>${escapeHtml(coaching.solution)}</p></div><div><span>Pattern to remember</span><p>${escapeHtml(coaching.rule)}</p></div><div><span>Next move</span><p>${escapeHtml(coaching.nextStep)}</p></div></div><button class="secondary-button review-skill-button" type="button" data-result-question="${escapeHtml(result.question.id)}">Practice this pattern</button></article>`;
  }

  function startSimilarQuestion(sourceQuestion) {
    const sourceSet = sourceQuestion.practiceSet || practiceSets[sourceQuestion.section];
    const questions = sectionQuestions(sourceQuestion.section, sourceQuestion.skill, null, sourceSet);
    const target = questions.find((question) => question.id !== sourceQuestion.id && question.meta.recipe === sourceQuestion.meta.recipe && question.difficulty === sourceQuestion.difficulty && !answered(question))
      || questions.find((question) => question.id !== sourceQuestion.id && question.meta.recipe === sourceQuestion.meta.recipe)
      || questions.find((question) => question.id !== sourceQuestion.id && question.difficulty === sourceQuestion.difficulty)
      || questions[0];
    setPracticeSet(sourceQuestion.section, sourceSet, false);
    view = { name: "practice", section: sourceQuestion.section, skill: sourceQuestion.skill, difficulty: null, practiceSet: sourceSet, index: Math.max(0, questions.indexOf(target)) };
    render();
  }

  function renderPractice() {
    const questions = sectionQuestions(view.section, view.skill, view.difficulty, view.practiceSet);
    const question = questions[view.index];
    const stats = responseStats(questions);
    const response = state.responses[question.id] || {};
    const isLast = view.index === questions.length - 1;

    app.innerHTML = `
      <div class="practice-shell">
        <div class="practice-toolbar">
          <div class="toolbar-title">${view.skill ? escapeHtml(view.skill) : view.section}<span>Set ${view.practiceSet}</span></div>
          <div class="progress-wrap">
            <div class="progress-meta"><span class="progress-label">Section progress</span><span>${stats.completed} / ${questions.length}</span></div>
            <div class="progress-track"><div class="progress-bar" style="width:${(stats.completed / questions.length) * 100}%"></div></div>
          </div>
          <div class="practice-toolbar-actions"><div class="practice-set-selector compact" role="group" aria-label="Switch question set"><button type="button" class="practice-set-option ${view.practiceSet === 1 ? "active" : ""}" data-practice-switch="1" aria-pressed="${view.practiceSet === 1}">Set 1</button><button type="button" class="practice-set-option ${view.practiceSet === 2 ? "active" : ""}" data-practice-switch="2" aria-pressed="${view.practiceSet === 2}">Set 2</button></div><button class="text-button" id="exit-practice" type="button">Exit practice</button></div>
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
    const coaching = !response.correct && typeof window.getSATCoaching === "function" ? window.getSATCoaching(question, response.value) : null;
    return `
      <section class="feedback ${response.correct ? "correct" : "incorrect"}" aria-live="polite">
        <p class="feedback-title">${response.correct ? "Correct." : `Not quite. The answer is ${escapeHtml(answerText)}.`}</p>
        ${response.correct ? `<p>${escapeHtml(question.explanation)}</p>` : `<div class="inline-coaching">
          <div><span>Why your answer missed</span><p>${escapeHtml(coaching.diagnosis)}</p></div>
          <div><span>Correct reasoning</span><p>${escapeHtml(coaching.solution)}</p></div>
          <div><span>Pattern to remember</span><p>${escapeHtml(coaching.rule)}</p></div>
          <div><span>Immediate next step</span><p>${escapeHtml(coaching.nextStep)}</p></div>
          <button class="secondary-button coaching-retry" id="retry-similar" type="button">Try a similar question</button>
        </div>`}
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
    document.querySelectorAll("[data-practice-switch]").forEach((button) => button.addEventListener("click", () => {
      startSection(view.section, view.skill, view.difficulty, button.dataset.practiceSwitch);
    }));
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
      document.querySelector("#retry-similar")?.addEventListener("click", () => startSimilarQuestion(question));
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
  topTabs.forEach((tab) => tab.addEventListener("click", () => {
    if (tab.dataset.topView === "mini-tests") openMiniTests();
    else goHome();
  }));

  if (!Array.isArray(window.SAT_QUESTIONS)) {
    app.innerHTML = '<p class="dashboard">The question bank could not be loaded.</p>';
    return;
  }

  render();
})();
