(function () {
  "use strict";

  const DIFFICULTIES = [
    ...Array(8).fill("Easy"),
    ...Array(9).fill("Medium"),
    ...Array(8).fill("Hard")
  ];
  const GENERATOR_VERSION = "authenticity-v2";

  const SKILLS = [
    { slug: "central-ideas-details", domain: "Information and Ideas", name: "Central Ideas and Details", description: "Identify a text's central idea or accurately interpret a key detail." },
    { slug: "command-evidence-textual", domain: "Information and Ideas", name: "Command of Evidence: Textual", description: "Select the fact, detail, or example that best supports a claim." },
    { slug: "command-evidence-quantitative", domain: "Information and Ideas", name: "Command of Evidence: Quantitative", description: "Use data in a table or graph to support or weaken a claim." },
    { slug: "inferences", domain: "Information and Ideas", name: "Inferences", description: "Draw the conclusion most strongly supported by stated and implied information." },
    { slug: "words-context", domain: "Craft and Structure", name: "Words in Context", description: "Determine or supply the most logical and precise high-utility word or phrase." },
    { slug: "text-structure-purpose", domain: "Craft and Structure", name: "Text Structure and Purpose", description: "Analyze a text's organization, purpose, or the function of a sentence." },
    { slug: "cross-text", domain: "Craft and Structure", name: "Cross-Text Connections", description: "Compare claims, reasoning, or perspectives in two related texts." },
    { slug: "rhetorical-synthesis", domain: "Expression of Ideas", name: "Rhetorical Synthesis", description: "Use relevant notes to accomplish a specified rhetorical goal." },
    { slug: "transitions", domain: "Expression of Ideas", name: "Transitions", description: "Choose the transition that most precisely signals the relationship between ideas." },
    { slug: "boundaries", domain: "Standard English Conventions", name: "Boundaries", description: "Use punctuation and sentence boundaries to form conventionally complete sentences." },
    { slug: "form-structure-sense", domain: "Standard English Conventions", name: "Form, Structure, and Sense", description: "Apply agreement, tense, modifier, pronoun, and sentence-structure conventions." }
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

  function shuffledChoices(rng, correct, distractors) {
    const correctText = String(correct);
    const unique = [];
    for (const candidate of distractors.map(String)) {
      if (candidate !== correctText && !unique.includes(candidate)) unique.push(candidate);
    }
    const fallbacks = [
      "The text does not provide enough information to reach this conclusion.",
      "The claim is unrelated to the information in the text.",
      "The opposite of this claim is supported."
    ];
    for (const fallback of fallbacks) {
      if (unique.length >= 3) break;
      if (fallback !== correctText && !unique.includes(fallback)) unique.push(fallback);
    }
    const choices = [correctText, ...unique.slice(0, 3)];
    for (let index = choices.length - 1; index > 0; index -= 1) {
      const target = int(rng, 0, index);
      [choices[index], choices[target]] = [choices[target], choices[index]];
    }
    return { choices, answer: choices.indexOf(correctText) };
  }

  function item(ctx, details) {
    const choiceData = shuffledChoices(ctx.rng, details.correct, details.distractors);
    const result = {
      id: `rw-${ctx.skill.slug}-${ctx.setId}-${String(ctx.index + 1).padStart(2, "0")}`,
      section: "Reading and Writing",
      domain: ctx.skill.domain,
      skill: ctx.skill.name,
      difficulty: ctx.difficulty,
      type: "mcq",
      stimulus: details.stimulus,
      question: details.question,
      choices: choiceData.choices,
      answer: choiceData.answer,
      explanation: details.explanation,
      meta: {
        recipe: `${ctx.skill.slug}/${details.recipe}`,
        generationVersion: GENERATOR_VERSION,
        seed: ctx.seed,
        variant: ctx.index + 1,
        parameters: details.parameters || {}
      }
    };
    if (details.table) result.table = details.table;
    return result;
  }

  // Each case is authored at one difficulty and used once. Set 1 takes the first
  // cases in a tier, set 2 the next, so no question repeats and no decorative
  // digit is needed to tell two questions apart.
  const TIER_STARTS = { Easy: 0, Medium: 8, Hard: 17 };
  const TIER_SIZES = { Easy: 8, Medium: 9, Hard: 8 };

  function tieredCase(ctx, cases) {
    const recipeOf = (entry) => entry.recipe || entry.relation || "default";
    const pool = cases
      .filter((entry) => entry.difficulty === ctx.difficulty)
      .sort((left, right) => (recipeOf(left) < recipeOf(right) ? -1 : recipeOf(left) > recipeOf(right) ? 1 : 0));
    // Deal alternately from a recipe-ordered pool so both practice sets drill
    // the same recipes while sharing no question.
    const lane = pool.filter((entry, position) => position % 2 === (ctx.practiceSet === 2 ? 1 : 0));
    const position = (ctx.index % 25) - TIER_STARTS[ctx.difficulty];
    if (position < 0 || position >= lane.length) {
      throw new Error(`${ctx.skill.name}: no ${ctx.difficulty} case at position ${position}; that lane holds ${lane.length}.`);
    }
    return lane[position];
  }

  const TOPICS = [
    { researcher: "urban ecologist Mara Chen", surname: "Chen", subject: "tree canopies", result: "Blocks with denser tree canopies had lower afternoon surface temperatures than nearby blocks with little shade.", detail: "blocks with denser tree canopies had lower afternoon surface temperatures", main: "Chen's observations associate denser tree cover with cooler neighborhood surfaces." },
    { researcher: "marine biologist Luis Ortega", surname: "Ortega", subject: "oyster reefs", result: "Marsh edges behind restored oyster reefs lost less sediment during storms than unprotected edges did.", detail: "marsh edges behind restored oyster reefs lost less sediment during storms", main: "Ortega's comparison suggests that restored oyster reefs can reduce storm-related shoreline erosion." },
    { researcher: "historian Amina Bell", surname: "Bell", subject: "ship captains' logs", result: "Logs from several ships recorded unusual coastal fog during the same summers.", detail: "logs from several ships recorded unusual coastal fog during the same summers", main: "Bell found that routine maritime records can preserve evidence of past coastal weather." },
    { researcher: "materials scientist Priya Nair", surname: "Nair", subject: "a plant-based coating", result: "Coated fruit lost moisture more slowly than otherwise identical uncoated fruit.", detail: "coated fruit lost moisture more slowly than uncoated fruit", main: "Nair's experiment indicates that a plant-based coating may slow moisture loss in fruit." },
    { researcher: "linguist Noah Okafor", surname: "Okafor", subject: "bilingual speakers", result: "Recordings showed that the same speakers shifted pronunciation patterns when addressing different audiences.", detail: "the same speakers shifted pronunciation patterns for different audiences", main: "Okafor's recordings show that bilingual speakers can adjust their speech to social context." },
    { researcher: "astronomer Elena Park", surname: "Park", subject: "repeated dips in starlight", result: "The dips occurred at regular intervals consistent with an object orbiting the star.", detail: "the dips occurred at regular intervals", main: "Park interpreted regular dips in starlight as evidence consistent with an orbiting object." },
    { researcher: "archaeologist Daniel Ruiz", surname: "Ruiz", subject: "charred seeds at a settlement", result: "The seeds came from crop varieties harvested in several different growing seasons.", detail: "the seeds represented several different growing seasons", main: "Ruiz's analysis suggests that people cultivated crops at the settlement over multiple years." },
    { researcher: "behavioral scientist Imani Cole", surname: "Cole", subject: "brief outdoor walks", result: "Participants scored higher on an attention task after outdoor walks than after equally long indoor walks.", detail: "participants scored higher after outdoor walks than after indoor walks", main: "Cole's comparison links brief outdoor walks with improved performance on an attention task." },
    { researcher: "engineer Sofia Malik", surname: "Malik", subject: "porous pavement", result: "Test plots paved with the material absorbed more rainwater than conventional pavement plots did.", detail: "porous pavement test plots absorbed more rainwater", main: "Malik's tests suggest that porous pavement can increase rainwater infiltration." },
    { researcher: "musicologist Theo Grant", surname: "Grant", subject: "handwritten revisions in a score", result: "Later revisions altered the rhythm of a passage while leaving its principal melody intact.", detail: "later revisions changed the rhythm but preserved the principal melody", main: "Grant found that the revisions refined a passage's rhythm without replacing its main melody." }
  ];

  const LITERARY_CASES = [
    { text: "Mara had already locked the bakery when she noticed that one tray of rolls sat crooked in the window. She told herself that no customer would see it before morning. Still, she unlocked the door, straightened the tray, and checked the display twice before leaving again.", main: "Mara cares enough about the bakery's appearance to correct a small problem after closing.", detailQuestion: "What does Mara do after first locking the bakery?", detail: "She returns inside to straighten a tray in the window.", distractors: ["She decides to replace all the rolls before morning.", "She waits outside for a customer to notice the display.", "She leaves the crooked tray for someone else to fix."] },
    { text: "All afternoon, Eli rehearsed the apology he meant to give his brother. Yet when they met at the gate, Eli spoke at length about the weather and the loose hinge, attending to everything except the words he had practiced.", main: "Although Eli intends to apologize, he avoids doing so when he meets his brother.", detailQuestion: "What subjects does Eli discuss at the gate?", detail: "He talks about the weather and a loose hinge.", distractors: ["He explains why he had practiced an apology.", "He discusses a message from his brother.", "He says nothing before leaving the gate."] },
    { text: "Nia's violin case was scarred from years of travel, and its handle had been repaired more than once. At the shop, she ignored the gleaming new cases and asked the clerk for another strip of leather to reinforce the old handle.", main: "Nia prefers to preserve her familiar violin case instead of replacing it.", detailQuestion: "What does Nia ask the clerk to provide?", detail: "She asks for leather to reinforce the old case's handle.", distractors: ["She asks for a new violin to fit the case.", "She asks for a gleaming case with an unmarked handle.", "She asks the clerk to remove an earlier repair."] },
    { text: "When the first drops struck the pavement, everyone in the market hurried toward the awnings. Tomas remained beside his table, calmly covering each carved bird with cloth. Only after the last figure was protected did he lift the table and follow the others.", main: "Tomas protects his carvings methodically before seeking shelter from the rain.", detailQuestion: "What does Tomas cover with cloth?", detail: "He covers the carved birds displayed on his table.", distractors: ["He covers the market's awnings.", "He covers the pavement around his table.", "He covers the figures only after entering a shelter."] },
    { text: "The map showed a road continuing beyond the hill, but Sora found only a narrow footpath nearly hidden by grass. She folded the map without complaint and began marking the path's turns in the margin as she walked.", main: "Sora adapts when the map proves inaccurate and records what she observes.", detailQuestion: "How does Sora respond to finding a footpath instead of a road?", detail: "She notes the footpath's turns on the map.", distractors: ["She abandons the trip and complains about the map.", "She searches for a road on the opposite side of the hill.", "She removes the map's original markings."] },
    { text: "Mr. Ibarra claimed that the clock in the hall was five minutes slow, though he had never compared it with another clock. Each evening, he nevertheless adjusted his watch to match it, saying that a familiar error was easier to manage than an uncertain correction.", main: "Mr. Ibarra knowingly relies on a possibly inaccurate clock because its error feels predictable.", detailQuestion: "Why does Mr. Ibarra continue to use the hall clock?", detail: "He considers its familiar error easier to manage than an uncertain correction.", distractors: ["He has confirmed that the hall clock is completely accurate.", "He is unable to adjust the time on his watch.", "He wants the clock's error to become less predictable."] },
    { text: "Leena had expected the committee to reject her garden plan, so its approval left her briefly speechless. By evening, however, her desk was covered with seed catalogs, sketches, and lists of neighbors who might lend tools.", main: "Leena quickly turns her surprise at the plan's approval into practical preparation.", detailQuestion: "What covers Leena's desk by evening?", detail: "Seed catalogs, sketches, and lists of potential tool lenders cover it.", distractors: ["Letters explaining why the plan was rejected cover it.", "Tools borrowed from several neighbors cover it.", "Minutes from the committee's next meeting cover it."] },
    { text: "The other runners watched the storm clouds and shortened their warm-ups. Dev studied the same clouds, then added a second knot to each shoelace and continued his usual routine. He could not control the weather, he reasoned, but he could avoid giving it one more advantage.", main: "Dev responds to uncertain weather by carefully controlling what he can.", detailQuestion: "What change does Dev make before continuing his routine?", detail: "He ties a second knot in each shoelace.", distractors: ["He shortens his warm-up to match the other runners.", "He changes into a different pair of shoes.", "He waits for the storm clouds to disappear."] },
    { text: "For weeks, the empty frame above the mantel bothered Jo. When her painting was finally finished, she leaned it against the wall beneath the frame and left it there. The blank space, she realized, had begun to seem less like an absence than a promise.", main: "Jo comes to value the empty frame for representing future possibility.", detailQuestion: "Where does Jo place her completed painting?", detail: "She leans it against the wall beneath the empty frame.", distractors: ["She hangs it in the frame above the mantel.", "She stores it where the empty frame cannot be seen.", "She gives it away before deciding where to display it."] },
    { text: "Ari recognized the melody drifting from the apartment upstairs, but its rhythm was slower than he remembered. He paused on the stairs until the final note faded, then hummed the older version as he continued upward, listening for where the two versions agreed.", main: "Hearing an altered melody prompts Ari to compare it with the version he remembers.", detailQuestion: "What does Ari do after the final note fades?", detail: "He hums the older version while continuing up the stairs.", distractors: ["He asks the musician to stop playing the melody.", "He writes down the new version before moving.", "He returns downstairs because he does not recognize the tune."] }
  ];

  function centralIdeasDetails(ctx) {
    if (ctx.index % 5 === 4) {
      const literary = LITERARY_CASES[Math.floor(ctx.index / 5)];
      if (ctx.index % 3 === 0) {
        return item(ctx, {
          recipe: "key-detail", stimulus: literary.text, question: literary.detailQuestion, correct: literary.detail,
          distractors: literary.distractors,
          explanation: "The correct choice restates the action or reason given in the passage. Each distractor changes its object, timing, or purpose.", parameters: { literary }
        });
      }
      return item(ctx, {
        recipe: "central-idea", stimulus: literary.text, question: "Which choice best states the main idea of the text?", correct: literary.main,
        distractors: [literary.distractors[0], literary.distractors[1], literary.detail],
        explanation: "The correct choice captures both the character's situation and response. The other choices contradict the passage or focus on a detail without expressing its central point.", parameters: { literary }
      });
    }
    const topic = pick(ctx.rng, TOPICS);
    const duration = ctx.index + 4;
    const methodDetail = ctx.difficulty === "Easy"
      ? "The observations were made under the same procedure throughout the study."
      : `To reduce the chance that a short-lived condition would determine the result, the team repeated its measurements throughout the ${duration}-week period.`;
    const hardQualification = ctx.difficulty === "Hard" ? ` Even so, because the evidence concerns a limited set of observations, ${topic.surname} does not claim that the pattern must occur in every setting.` : "";
    const stimulus = `${topic.researcher[0].toUpperCase()}${topic.researcher.slice(1)} conducted a ${duration}-week study of ${topic.subject}. ${methodDetail} ${topic.result}${hardQualification}`;
    if (ctx.index % 3 === 0) {
      return item(ctx, {
        recipe: "key-detail", stimulus, question: `According to the text, what did ${topic.surname} find?`,
        correct: `${topic.detail[0].toUpperCase()}${topic.detail.slice(1)}.`,
        distractors: [`The study established that the pattern was caused entirely by the measurement procedure.`, `The study found the same outcome only during the first observation period.`, `The results showed that the pattern must occur in every possible setting.`],
        explanation: `The correct choice restates the reported result without contradicting or overstating it.`, parameters: { topic, duration }
      });
    }
    return item(ctx, {
      recipe: "central-idea", stimulus, question: "Which choice best states the main idea of the text?",
      correct: topic.main,
      distractors: [`${topic.surname}'s repeated measurements explain why the observed pattern disappeared by the end of the study.`, `${topic.surname}'s study shows that the reported result applies in settings the team did not examine.`, `The study's main finding is that repeating a measurement guarantees that outside conditions cannot affect the result.`],
      explanation: `The correct choice accurately summarizes the study and its result. The distractors contradict the result, overstate its reach, or focus on an incidental detail.`, parameters: { topic, duration }
    });
  }

  function commandEvidenceTextual(ctx) {
    const caseData = pick(ctx.rng, [
      {
        subject: "a desert shrub", claim: "the shrub adjusts its growth to conserve water during dry periods",
        correct: "During the driest months, new leaves were smaller and had fewer exposed pores than leaves produced after rain.",
        distractors: ["The shrub grows in soil containing several mineral types.", "The researchers photographed flowers at noon.", "Nearby rocks were warmer than shaded rocks."],
        hardDistractors: ["Plants in both wet and dry months produced leaves of the same size.", "The oldest roots extended deeper than the researchers expected.", "Plants receiving extra water produced more flowers than plants receiving none."]
      },
      {
        subject: "a public library program", claim: "the program increased access for residents unable to visit the library building",
        correct: "After mobile pickup sites opened, checkouts rose most in neighborhoods farthest from the main branch.",
        distractors: ["The main library was built in the 1970s.", "Several librarians preferred printed catalogs.", "The program's logo used three colors."],
        hardDistractors: ["Visitors to the main branch reported liking its renovated reading room.", "Overall checkouts had already begun rising before the pickup sites opened.", "Residents near the main branch used the library's website more often than they used to."]
      },
      {
        subject: "an early ceramic workshop", claim: "artisans at the workshop exchanged techniques with distant communities",
        correct: "Vessels made locally combine a regional clay with a firing pattern previously documented only hundreds of kilometers away.",
        distractors: ["Most vessels were found in fragments.", "The workshop stood near a river.", "Some vessels had plain surfaces."],
        hardDistractors: ["Imported vessels were found nearby, but none was made at the workshop.", "The workshop's earliest vessels use only techniques common in the local region.", "Several distant workshops used different clay and unrelated firing methods."]
      },
      {
        subject: "a bird population", claim: "the birds alter their songs in response to urban noise",
        correct: "Recordings of the same birds show higher minimum song frequencies beside busy roads than in quiet parks.",
        distractors: ["The birds build nests in several kinds of trees.", "Traffic was counted on weekdays.", "The species has colorful wing feathers."],
        hardDistractors: ["Different bird species were recorded in the city and in the quietest park.", "Roadside recordings contained traffic noise across many frequencies.", "The birds sang more often in spring than they did in winter at every site."]
      },
      {
        subject: "a new battery material", claim: "the material remains effective after repeated use",
        correct: "Cells containing the material retained 94 percent of their initial capacity after 1,000 charge cycles.",
        distractors: ["The material is gray before assembly.", "The laboratory purchased new measuring equipment.", "Each cell was labeled with a code."],
        hardDistractors: ["New cells containing the material had a high initial capacity before any cycling.", "Cells were measured after 10 cycles, but their later performance was not tested.", "A different material retained its capacity over many cycles."]
      }
    ]);
    const qualifier = ctx.difficulty === "Easy" ? "directly" : ctx.difficulty === "Medium" ? "most directly" : "most strongly";
    const method = ctx.difficulty === "Easy"
      ? "The investigation compared observations made under two relevant conditions."
      : "The researcher is looking for a result that bears on the proposed relationship, rather than merely describing the same general subject.";
    return item(ctx, {
      recipe: "support-claim", stimulus: `After reviewing evidence from a ${ctx.index + 3}-month investigation, a researcher claims that ${caseData.claim}. ${method}`,
      question: `Which finding, if true, would ${qualifier} support the researcher's claim?`, correct: caseData.correct,
      distractors: ctx.difficulty === "Easy" ? caseData.distractors : caseData.hardDistractors,
      explanation: `The correct finding provides evidence about the exact relationship in the claim. The other findings may concern ${caseData.subject}, but they do not support that relationship.`, parameters: { caseData }
    });
  }

  function commandEvidenceQuantitative(ctx) {
    const names = pick(ctx.rng, [
      ["Material A", "Material B", "Material C"],
      ["Site North", "Site Central", "Site South"],
      ["Method K", "Method L", "Method M"],
      ["Species R", "Species S", "Species T"]
    ]);
    const first = int(ctx.rng, 35, 60);
    const second = first + int(ctx.rng, 6, 15);
    const third = second + int(ctx.rng, 5, 15);
    const values = [first, second, third];
    const unit = pick(ctx.rng, ["survival rate (%)", "mean score", "retention (%)", "observed count"]);
    const table = { caption: `${unit[0].toUpperCase()}${unit.slice(1)} by group`, headers: ["Group", unit], rows: names.map((name, index) => [name, values[index]]) };
    const context = `A research team applied the same measurement procedure to three groups and recorded the results in the table. The team then compared the groups rather than treating any single value in isolation.`;
    if (ctx.index % 2 === 0) {
      return item(ctx, {
        recipe: "support-comparison", stimulus: `${context} A researcher claims that ${names[2]} had a higher value than either of the other groups.`, table,
        question: "Which choice most effectively uses data from the table to support the claim?",
        correct: `${names[2]}'s ${unit} was ${third}, compared with ${second} for ${names[1]} and ${first} for ${names[0]}.`,
        distractors: [`${names[2]}'s ${unit} was ${third}, which was ${third - second} higher than ${names[1]}'s; the table therefore gives no basis for comparing ${names[2]} with ${names[0]}.`, `${names[1]}'s ${unit} was ${second}, compared with ${first} for ${names[0]}, so ${names[1]} had the highest value shown.`, `${names[0]}'s ${unit} was ${first}, which was ${third - first} lower than ${names[2]}'s, but ${names[1]}'s value was not reported.`],
        explanation: `The correct choice accurately cites all three values and directly establishes that ${third} is the greatest.`, parameters: { names, values, unit }
      });
    }
    const difference = third - first;
    return item(ctx, {
      recipe: "quantify-difference", stimulus: `${context} A student claims that the outcome for ${names[2]} exceeded the outcome for ${names[0]}.`, table,
      question: "Which choice most effectively uses data from the table to support the student's claim?",
      correct: `${names[2]}'s value was ${third}, which was ${difference} greater than ${names[0]}'s value of ${first}.`,
      distractors: [`${names[0]}'s value was ${first}, which was ${difference} greater than ${names[2]}'s value of ${third}.`, `${names[2]}'s value was ${third}, which was ${third - second} greater than ${names[0]}'s value of ${first}.`, `${names[1]}'s value was ${second}, which was ${second - first} greater than ${names[0]}'s; therefore, ${names[2]} and ${names[0]} differed by ${second - first}.`],
      explanation: `${third} − ${first} = ${difference}, so the correct choice reports both values and their difference accurately.`, parameters: { names, values, unit }
    });
  }

  function inferences(ctx) {
    const caseData = pick(ctx.rng, [
      {
        text: "A museum moved several light-sensitive textiles into cases fitted with new filters. Over the next year, color measurements changed less for those textiles than for similar textiles kept under the previous lighting system.",
        correct: "The new filters likely reduced a source of color fading.",
        distractors: ["The new filters completely prevented the textiles from changing color.", "The previous lighting system caused the textiles to fade at a constant rate.", "The cases fitted with filters exposed the textiles to more light than the old cases did."]
      },
      {
        text: "Seedlings of one grass species grew equally well in two soil types when watered often. When watering was reduced, however, seedlings in the sandier soil grew substantially less.",
        correct: "Soil type affected the seedlings' growth more under limited water than under frequent watering.",
        distractors: ["The seedlings grew better in sandier soil whenever water was plentiful.", "Reducing the water affected seedlings in both soil types to exactly the same degree.", "Soil type, rather than water availability, determined seedling growth under both watering conditions."]
      },
      {
        text: "A novelist's early drafts describe a secondary character only briefly. In each later draft, scenes involving that character become longer, and the published version gives the character a decisive role in the ending.",
        correct: "The novelist increased the character's importance while revising the work.",
        distractors: ["The novelist preserved the character's role without substantial revision.", "The novelist shortened the character's scenes while strengthening the character's role in the ending.", "The character became more important only after the published version was completed."]
      },
      {
        text: "Two groups solved the same puzzles. One group received immediate information after each attempt; the other received all information at the end. The first group improved more rapidly during the session, but both groups performed similarly on a test one week later.",
        correct: "Immediate information aided short-term improvement but did not produce a clear long-term advantage in this study.",
        distractors: ["Delayed information produced faster improvement during the session than immediate information did.", "Immediate information produced an advantage that became larger one week later.", "The timing of information had no relationship to performance at any point in the study."]
      },
      {
        text: "After a city added protected bicycle lanes, bicycle counts rose on streets with the new lanes and on several nearby streets without them. Counts remained nearly unchanged in a distant comparison district.",
        correct: "The lane project may have influenced cycling beyond the streets where lanes were installed.",
        distractors: ["The lane project affected bicycle counts only on streets where lanes were installed.", "Bicycle counts rose equally in the project area and the distant comparison district.", "The project caused every resident of nearby streets to replace other transportation with cycling."]
      }
    ]);
    const stem = ctx.difficulty === "Hard" ? "Which conclusion is best supported by the text?" : "Which choice is most strongly supported by the text?";
    const analysisYear = ctx.practiceSet === 2 ? 1970 + (ctx.index - 25) : 1995 + ctx.index;
    const observationDetail = ctx.difficulty === "Easy"
      ? `A ${analysisYear} analysis considered the sequence of evidence described below.`
      : `A ${analysisYear} analysis considered the sequence and relative outcomes in the evidence below without assuming that the pattern must occur in every setting.`;
    return item(ctx, {
      recipe: "supported-inference", stimulus: `${observationDetail} ${caseData.text} The evidence supports a limited conclusion about the reported pattern.`, question: stem, correct: caseData.correct,
      distractors: caseData.distractors,
      explanation: `The correct choice follows from the comparison or change described in the text without claiming more than the evidence supports.`, parameters: { caseData }
    });
  }

  const WORD_CASES = [
    { text: "The committee's first estimate was tentative because several measurements were missing. After the complete data set became available, the researchers were able to ______ the estimate.", correct: "refine", distractors: ["discard", "conceal", "imitate"], reason: "improve its precision" },
    { text: "The two accounts seem contradictory at first, but a close reading shows that they are largely ______: each describes a different stage of the same process.", correct: "compatible", distractors: ["arbitrary", "identical", "unintelligible"], reason: "able to coexist without conflict" },
    { text: "Rather than ______ the earlier theory, the new evidence limits the conditions under which that theory applies.", correct: "repudiating", distractors: ["illustrating", "memorizing", "predicting"], reason: "rejecting" },
    { text: "The artist's use of repeated geometric forms is not merely decorative; the forms ______ the work's theme of recurrence.", correct: "reinforce", distractors: ["obscure", "precede", "quantify"], reason: "strengthen" },
    { text: "Because the surviving records are incomplete, any account of the expedition must remain ______ rather than definitive.", correct: "provisional", distractors: ["exhaustive", "irrelevant", "immutable"], reason: "subject to revision" },
    { text: "The researcher was careful not to ______ correlation with causation when discussing the observational results.", correct: "conflate", distractors: ["contrast", "measure", "document"], reason: "treat as the same" },
    { text: "The new observations do not resolve the debate, but they do ______ the range of explanations that remain plausible.", correct: "constrain", distractors: ["expand", "ignore", "randomize"], reason: "limit" },
    { text: "Although the material appears rigid, it is sufficiently ______ to bend slightly without cracking.", correct: "pliable", distractors: ["opaque", "uniform", "brittle"], reason: "flexible" },
    { text: "The speaker's humor helps ______ the criticism, making the argument less confrontational without weakening it.", correct: "temper", distractors: ["intensify", "repeat", "invalidate"], reason: "moderate" },
    { text: "The fossils are ______ across several rock layers rather than concentrated in a single layer.", correct: "dispersed", distractors: ["verified", "translated", "reversed"], reason: "spread out" },
    { text: "Because the two methods rely on different assumptions, their estimates may ______ even when applied to the same data.", correct: "diverge", distractors: ["stabilize", "coincide", "vanish"], reason: "differ" },
    { text: "The critic does not dismiss the novel's unusual structure; instead, she argues that the structure is ______ to the novel's meaning.", correct: "integral", distractors: ["incidental", "hostile", "subsequent"], reason: "essential" },
    { text: "Repeated observations ______ the initial finding, increasing the research team's confidence in it.", correct: "corroborated", distractors: ["precluded", "distorted", "anticipated"], reason: "confirmed with additional evidence" },
    { text: "The new classification is deliberately ______, grouping objects by only a few broad features.", correct: "coarse", distractors: ["exhaustive", "imperceptible", "ornamental"], reason: "broad rather than finely detailed" },
    { text: "The evidence is too limited to ______ which of the two explanations is more likely.", correct: "determine", distractors: ["celebrate", "conceal", "reproduce"], reason: "establish" },
    { text: "The policy's effects were not uniform; they ______ considerably from one region to another.", correct: "varied", distractors: ["ceased", "converged", "originated"], reason: "differed" },
    { text: "The author presents the anecdote to ______ an abstract point with a concrete example.", correct: "illustrate", distractors: ["repudiate", "postpone", "obscure"], reason: "clarify by example" },
    { text: "The instrument can detect changes so ______ that older devices would have missed them.", correct: "subtle", distractors: ["obvious", "irrelevant", "uniform"], reason: "small or difficult to perceive" },
    { text: "The revised model is more ______ than its predecessor because it applies under a wider range of conditions.", correct: "robust", distractors: ["fragile", "tentative", "decorative"], reason: "reliably effective" },
    { text: "The historian treats the diary as valuable but ______ evidence, since its author witnessed only part of the event.", correct: "partial", distractors: ["conclusive", "fabricated", "irrelevant"], reason: "incomplete" },
    { text: "Although the species was once common, recent surveys indicate that it is now relatively ______ in the region.", correct: "scarce", distractors: ["abundant", "adaptable", "conspicuous"], reason: "uncommon" },
    { text: "The second experiment was designed to ______ a weakness in the first experiment's procedure.", correct: "address", distractors: ["preserve", "conceal", "duplicate"], reason: "deal with" },
    { text: "The poem's final image is intentionally ______, allowing readers to interpret it in more than one way.", correct: "ambiguous", distractors: ["literal", "redundant", "conventional"], reason: "open to multiple meanings" },
    { text: "Rather than offering a comprehensive history, the article provides a ______ account focused on one decade.", correct: "selective", distractors: ["random", "unbiased", "continuous"], reason: "deliberately limited" },
    { text: "The discovery may ______ researchers to reconsider how the settlement developed.", correct: "prompt", distractors: ["prevent", "permit", "force"], reason: "cause or encourage" },
    { text: "Planting vegetation along the exposed bank could ______ erosion during seasonal floods.", correct: "mitigate", distractors: ["intensify", "document", "predict"], reason: "reduce the severity of" },
    { text: "The editor attempted to ______ the two apparently conflicting dates by consulting the original records.", correct: "reconcile", distractors: ["conceal", "duplicate", "separate"], reason: "bring into agreement" },
    { text: "Because one measurement was ______ and did not resemble any of the others, the team checked the instrument.", correct: "anomalous", distractors: ["representative", "expected", "conclusive"], reason: "deviating from the expected pattern" },
    { text: "The newly discovered receipts may ______ the historian's claim about when the workshop opened.", correct: "substantiate", distractors: ["contradict", "obscure", "replace"], reason: "support with evidence" },
    { text: "The survey indicates that the practice is ______ throughout the region rather than limited to a few towns.", correct: "pervasive", distractors: ["temporary", "isolated", "invisible"], reason: "widespread" },
    { text: "A diagram was added to ______ the sequence of steps described in the dense technical paragraph.", correct: "elucidate", distractors: ["complicate", "dismiss", "shorten"], reason: "make clear" },
    { text: "Although the building's exterior is unusual, its interior follows a more ______ arrangement of rooms.", correct: "conventional", distractors: ["experimental", "random", "imperceptible"], reason: "traditional or generally accepted" },
    { text: "Results from the larger trial ______ the preliminary evidence reported by the smaller study.", correct: "bolster", distractors: ["undermine", "ignore", "precede"], reason: "strengthen" },
    { text: "The revised procedure produced a ______ change in accuracy, so the researchers retained the original method.", correct: "negligible", distractors: ["substantial", "unpredictable", "beneficial"], reason: "too small to be important" },
    { text: "The archive uses low-intensity lighting to ______ fragile pigments in the displayed manuscripts.", correct: "preserve", distractors: ["imitate", "measure", "replace"], reason: "protect from damage or loss" },
    { text: "After estimating the available time and cost, the engineers concluded that the proposed modification was ______.", correct: "feasible", distractors: ["arbitrary", "obsolete", "decorative"], reason: "practical and possible to carry out" },
    { text: "From the repeated marks in the margin, scholars can ______ that the reader returned to the passage several times.", correct: "infer", distractors: ["guarantee", "conceal", "prescribe"], reason: "reach a conclusion from evidence" },
    { text: "The conservator kept ______ records of every material used during the restoration.", correct: "meticulous", distractors: ["casual", "incomplete", "speculative"], reason: "extremely careful and precise" },
    { text: "The increase in water temperature was ______; readings returned to their earlier level within an hour.", correct: "transient", distractors: ["permanent", "cumulative", "unprecedented"], reason: "lasting only a short time" },
    { text: "The committee must ______ its limited funds among several equally urgent projects.", correct: "allocate", distractors: ["withhold", "multiply", "disguise"], reason: "distribute for particular purposes" },
    { text: "Dense cloud cover can ______ the instrument's ability to detect faint objects.", correct: "inhibit", distractors: ["enhance", "measure", "demonstrate"], reason: "hinder or restrain" },
    { text: "The review emphasizes the most ______ difference between the two proposals: their projected cost.", correct: "salient", distractors: ["hidden", "irrelevant", "temporary"], reason: "most noticeable or important" },
    { text: "A second laboratory was asked to ______ the experiment using the same materials and procedure.", correct: "replicate", distractors: ["revise", "summarize", "cancel"], reason: "repeat under the same conditions" },
    { text: "The rainfall recorded that month was ______ in the station's eighty-year history.", correct: "unprecedented", distractors: ["typical", "gradual", "uncertain"], reason: "never previously known or experienced" },
    { text: "The final report must ______ findings from interviews, field observations, and archival documents.", correct: "synthesize", distractors: ["separate", "discard", "rank"], reason: "combine into a coherent whole" },
    { text: "The revised container can ______ heat longer than the earlier design can.", correct: "retain", distractors: ["generate", "measure", "release"], reason: "continue to hold" },
    { text: "Given the study's small sample, the reviewer remained ______ of its broad conclusion.", correct: "skeptical", distractors: ["certain", "unaware", "supportive"], reason: "doubtful" },
    { text: "The introduction clearly ______ the period and geographic area covered by the study.", correct: "delineates", distractors: ["expands", "conceals", "abandons"], reason: "defines the boundaries of" },
    { text: "Because several records have not been located, the identification remains ______.", correct: "tentative", distractors: ["definitive", "irrelevant", "permanent"], reason: "not yet certain" },
    { text: "The searchable index will ______ comparisons among documents held in different collections.", correct: "facilitate", distractors: ["prevent", "replace", "complicate"], reason: "make easier" }
  ];

  function wordsContext(ctx) {
    const entry = WORD_CASES[ctx.index % WORD_CASES.length];
    const lead = [
      "In an academic discussion of how evidence can alter an initial interpretation, a writer makes the following observation:",
      "A researcher summarizing a broader analysis offers the following assessment:",
      "While explaining the significance of a recent finding, an author makes the following point:",
      "A scholarly review considers how the available information should be interpreted:"
    ][ctx.index % 4];
    if (ctx.index % 5 === 0) {
      const definitionDistractors = {
        refine: ["delay a decision about", "copy the outward form of", "reject as unusable"],
        conflate: ["contrast sharply", "record separately", "make less certain"],
        diverge: ["become more stable", "receive further confirmation", "disappear completely"],
        varied: ["ended", "became identical", "began"],
        scarce: ["highly noticeable", "able to adapt", "widely distributed"],
        mitigate: ["make more severe", "record in detail", "cause to begin"],
        elucidate: ["make more complicated", "reject completely", "repeat exactly"],
        feasible: ["chosen without reason", "no longer useful", "purely decorative"],
        inhibit: ["make more effective", "calculate precisely", "provide evidence of"],
        retain: ["produce for the first time", "calculate the amount of", "allow to escape"]
      };
      return item(ctx, {
        recipe: "meaning-in-context", stimulus: `${lead} ${entry.text.replace("______", `“${entry.correct}”`)}`,
        question: `As used in the text, what does “${entry.correct}” most nearly mean?`, correct: entry.reason,
        distractors: definitionDistractors[entry.correct],
        explanation: `In this context, “${entry.correct}” means ${entry.reason}. That meaning makes the sentence's logic coherent.`, parameters: { entry }
      });
    }
    return item(ctx, {
      recipe: "logical-precise-word", stimulus: `${lead} ${entry.text}`,
      question: "Which choice completes the text with the most logical and precise word?", correct: entry.correct,
      distractors: entry.distractors,
      explanation: `“${entry.correct}” means ${entry.reason}, which precisely fits the relationship established in the sentence.`, parameters: { entry }
    });
  }

  function textStructurePurpose(ctx) {
    const mode = ctx.index % 5;
    const year = ctx.practiceSet === 2 ? 1975 + (ctx.index - 25) : 2000 + ctx.index;
    const caseData = pick(ctx.rng, [
      { subject: "restored wetland", benefit: "reduced flooding in initial simulations", limitation: "the simulations modeled only one type of storm" },
      { subject: "translation method", benefit: "preserved technical terms more accurately than the comparison method did", limitation: "the test included documents from only one field" },
      { subject: "solar-cell coating", benefit: "reduced measured energy loss", limitation: "the trial lasted only six weeks" },
      { subject: "searchable archive of letters", benefit: "expanded access for researchers unable to visit in person", limitation: "many handwritten pages have not yet been transcribed" },
      { subject: "community garden program", benefit: "increased participation in its first season", limitation: "the participants came from only one neighborhood" }
    ]);
    const { subject, benefit, limitation } = caseData;
    if (mode < 3) {
      const stimulus = `A ${year} evaluation found that a new ${subject} ${benefit}. However, ${limitation}. Researchers therefore describe the result as promising but preliminary.`;
      return item(ctx, {
        recipe: "sentence-function", stimulus, question: "Which choice best describes the function of the second sentence in the text as a whole?",
        correct: "It identifies a limitation that qualifies the encouraging result in the first sentence.",
        distractors: ["It describes the procedure that produced the encouraging result in the first sentence.", "It offers a second example that broadens the first sentence's result to another setting.", "It rejects the first sentence's result by identifying evidence that the result did not occur."],
        explanation: `Introduced by “However,” the second sentence limits the scope or strength of the positive first-sentence result.`, parameters: { caseData, year }
      });
    }
    const stimulus = `Researchers once assumed that a ${subject} would have little practical value. A ${year} evaluation found that it ${benefit}. The tests do not settle every question because ${limitation}, but they challenge the earlier assumption.`;
    return item(ctx, {
      recipe: "overall-purpose", stimulus, question: "Which choice best describes the overall purpose of the text?",
      correct: "To describe evidence that challenges an earlier view while acknowledging a limitation of that evidence",
      distractors: ["To explain why an earlier view remains more convincing than the evidence presented against it", "To compare two procedures and recommend the one that produced the more encouraging result", "To argue that the limitation identified by researchers prevents the evidence from having any value"],
      explanation: `The text contrasts an earlier assumption with new evidence and then qualifies that evidence; the correct choice captures all three moves.`, parameters: { caseData, year }
    });
  }

  // Real cross-text items vary the relation between the texts. These pairs
  // cover disputed conclusions, alternative explanations, challenged methods,
  // limited scope, and extension. Every choice names the topic, so a reader
  // cannot find the key by looking for the choice that echoes the passage.
  const CROSS_TEXT_PAIRS = [
    { difficulty: "Easy", relation: "limit-scope",
      text1: "Planting street trees is the cheapest way for a city to cut summer heat. Blocks with full canopy in our survey ran up to five degrees cooler than bare blocks nearby.",
      text2: "Street trees do cool the blocks that have them, and our measurements agree closely with those figures. But a sapling casts little shade for its first fifteen years. A city that plants now is buying relief for the 2040s, not for this summer.",
      agreement: { correct: "Mature street trees measurably lower summer temperatures on the blocks where they grow.", distractors: ["Street trees begin lowering summer temperatures on a block within a few years of being planted there.", "Cities should stop planting street trees because the cooling arrives too slowly to matter.", "The cooling effect of street trees has been measured only on blocks that were already cool."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's claim that planting trees is the cheapest way to cut summer heat?", correct: "By noting that the cooling Text 1 measured belongs to mature canopy, so the benefit arrives long after the expense.", distractors: ["By arguing that the temperature differences Text 1 reports are too small to detect reliably.", "By agreeing that the cooling benefit arrives immediately but questioning whether cities can afford to plant at scale.", "By pointing out that the bare blocks in Text 1's survey were warmer for reasons unrelated to trees."] } },

    { difficulty: "Easy", relation: "alternative-explanation",
      text1: "Recordings made beside highways show that city sparrows sing at a higher pitch than country sparrows. The birds appear to be adjusting their songs to carry over low-frequency traffic noise.",
      text2: "The pitch difference in those recordings is real and easy to replicate. Whether it is an adjustment is another matter. City sparrows are on average smaller, and smaller birds sing higher regardless of what they are competing with.",
      agreement: { correct: "City sparrows sing at a higher pitch than sparrows recorded in the countryside.", distractors: ["City sparrows actively raise the pitch of their songs in order to carry over low-frequency traffic noise.", "The pitch difference between city and country sparrows disappears once body size is measured.", "Recordings made beside highways are too noisy to measure sparrow pitch reliably."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's explanation of the pitch difference?", correct: "By proposing that a difference in body size could produce the same pattern without any adjustment to noise.", distractors: ["By denying that city and country sparrows differ in pitch at all.", "By agreeing that traffic noise drives the pitch difference but doubting that the roadside recordings are accurate.", "By arguing that traffic noise is too variable to affect birdsong in any consistent way."] } },

    { difficulty: "Easy", relation: "extend",
      text1: "Surface trawls recover only a small fraction of the plastic estimated to enter the ocean each year. The rest of it is unaccounted for.",
      text2: "The missing fraction is not so much missing as sinking. Cores taken from deep-sea sediment contain microplastic at concentrations that rise sharply after 1970, which is roughly where the surface budget's shortfall begins.",
      agreement: { correct: "Far less plastic is found floating at the ocean surface than enters the ocean annually.", distractors: ["Most of the plastic entering the ocean each year remains at the surface, where standard trawls can recover it.", "The amount of plastic entering the ocean each year has been substantially overestimated.", "Deep-sea sediment cores show no measurable change in microplastic since 1970."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's statement that the remaining plastic is unaccounted for?", correct: "By identifying deep-sea sediment as a destination that accounts for much of the shortfall.", distractors: ["By arguing that the apparent shortfall is an artifact of the depth at which surface trawls sample the water.", "By agreeing that the missing plastic has not yet been located anywhere.", "By suggesting that less plastic enters the ocean each year than Text 1 assumes."] } },

    { difficulty: "Easy", relation: "challenge-method",
      text1: "Restaurants that respond to negative online reviews recover their ratings faster than restaurants that ignore them. Managers should reply.",
      text2: "The restaurants that reply are also the ones with staff to spare, renovated dining rooms, and money for new menus. Any of those could lift a rating on its own. The study compares repliers with non-repliers, not replies with silence.",
      agreement: { correct: "Restaurants that reply to negative reviews tend to see their ratings recover more quickly.", distractors: ["Replying to a negative review is itself the direct cause of the faster rating recovery that repliers show.", "Restaurants that ignore negative reviews improve their ratings just as quickly.", "Online restaurant ratings are too unreliable to show any pattern of recovery."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's recommendation that managers reply?", correct: "By observing that repliers differ from non-repliers in ways that could explain the recovery by themselves.", distractors: ["By agreeing that replying causes the recovery but questioning whether most managers have the time to do it.", "By denying that restaurant ratings recover at all after a negative review.", "By recommending that managers reply only to reviews that are factually inaccurate."] } },

    { difficulty: "Easy", relation: "limit-scope",
      text1: "Companies that moved to a four-day week reported no drop in output and a sharp fall in staff turnover.",
      text2: "Those results come almost entirely from firms whose work is project-based and measured in finished tasks. In hospitals and warehouses, where output is measured in hours covered, the same schedule has produced staffing gaps rather than savings.",
      agreement: { correct: "Some organizations have maintained their output after adopting a four-day week.", distractors: ["A four-day week maintains output in every kind of workplace, including those where output is measured in hours.", "A four-day week reduces output in project-based firms.", "Staff turnover is unaffected by the length of the working week."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's report of unchanged output?", correct: "By accepting the finding for project-based firms while denying that it carries over to hour-based work.", distractors: ["By arguing that output did fall in the project-based firms Text 1 studied but that the decline went unrecorded.", "By agreeing that the schedule works everywhere but costs more than Text 1 allows.", "By claiming that turnover, not output, is the only measure worth reporting."] } },

    { difficulty: "Easy", relation: "alternative-explanation",
      text1: "Tree rings show three consecutive cold, wet summers before the famine of 1315. The weather destroyed the harvest.",
      text2: "The rings are accurate, but grain prices in the same region began climbing four years before the first cold summer. Whatever set the shortage in motion was already at work when the weather turned.",
      agreement: { correct: "The summers immediately preceding the 1315 famine were unusually cold and wet.", distractors: ["The famine of 1315 was caused entirely by the three cold, wet summers that the tree rings record.", "Tree-ring records from the period are too damaged to indicate past weather.", "Grain prices in the region remained stable until the harvest failed."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's conclusion about the cause of the famine?", correct: "By pointing to a price rise that predates the weather and so cannot be explained by it.", distractors: ["By disputing the tree-ring evidence for cold, wet summers.", "By agreeing that the weather was the sole cause of the famine but dating the cold summers several years earlier.", "By arguing that grain prices are a poor indicator of the food supply."] } },

    { difficulty: "Easy", relation: "dispute-conclusion",
      text1: "Students who take lecture notes by hand score higher on conceptual questions than students who type. Writing slowly forces them to summarize rather than transcribe.",
      text2: "The score gap holds up. But when typists are simply told not to transcribe verbatim, the gap closes. What matters is how the notes are taken, not what they are taken with.",
      agreement: { correct: "Students who write lecture notes by hand have outperformed typists on conceptual questions.", distractors: ["The advantage on conceptual questions comes from the physical act of handwriting rather than from any strategy.", "Typists and handwriters score identically on conceptual questions in every condition.", "Verbatim transcription improves student performance on conceptual questions."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's explanation of the score gap?", correct: "By noting that instructing typists to summarize removes the gap, which locates the cause in strategy rather than medium.", distractors: ["By denying that handwriters have ever outscored typists on such questions.", "By agreeing that the writing medium is what matters but adding that typing speed varies too much to compare.", "By arguing that conceptual questions are not a fair test of lecture notes."] } },

    { difficulty: "Easy", relation: "extend",
      text1: "Corals transplanted from a naturally warm lagoon survived a bleaching event that killed most of the reef around them.",
      text2: "That result is now understood well enough to act on. The transplanted colonies carried heat-tolerant symbiotic algae, and those algae can be introduced to nursery-raised corals before they are ever placed on a reef.",
      agreement: { correct: "Corals originating in a warm lagoon withstood a bleaching event better than the surrounding reef.", distractors: ["Transplanted corals survive bleaching because of the depth at which they are placed rather than the algae they carry.", "No coral on the reef survived the bleaching event described in either text.", "Heat tolerance in corals cannot be transferred between colonies."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's finding about the transplanted corals?", correct: "By treating it as the basis for a technique that could give nursery corals the same tolerance.", distractors: ["By questioning whether the corals transplanted from the warm lagoon were genuinely more heat tolerant at all.", "By arguing that the surrounding reef died for reasons unrelated to heat.", "By concluding that transplantation is the only way to protect a reef."] } },

    { difficulty: "Medium", relation: "dispute-conclusion",
      text1: "Children raised in bilingual homes are better at ignoring distractions. Managing two languages appears to train general attention control.",
      text2: "The advantage shows up reliably in laboratory tasks and almost never in classrooms. A skill that appears only where it is tested most closely may be a feature of the test rather than of the child.",
      agreement: { correct: "Bilingual children have outperformed monolingual children on laboratory measures of attention.", distractors: ["Bilingual children show the same measurable attention advantage in ordinary classrooms that they show in laboratories.", "Managing two languages has no measurable effect on any attention task.", "Laboratory attention tasks are the most accurate available measure of classroom behavior."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's claim that bilingualism trains attention control?", correct: "By observing that an effect confined to laboratory tasks may reflect the measurement rather than a general skill.", distractors: ["By denying that bilingual children differ from monolingual children on any laboratory task.", "By agreeing that bilingualism improves attention control but attributing the improvement to schooling instead.", "By arguing that classrooms are too noisy for attention to be assessed at all."] } },

    { difficulty: "Medium", relation: "challenge-method",
      text1: "Isotopes in the skeletons show that this community ate mostly marine protein. The settlement's economy must have been built on fishing.",
      text2: "The sampled skeletons all came from the cemetery nearest the shore. Two inland cemeteries from the same period have never been excavated, and there is no reason to assume they would look the same.",
      agreement: { correct: "The skeletons that have been analyzed indicate a diet high in marine protein.", distractors: ["The whole community, including the households buried inland, depended on fishing for its livelihood.", "Isotope analysis cannot distinguish marine protein from terrestrial protein.", "The inland cemeteries have been shown to contain a different dietary signature."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's conclusion about the settlement's economy?", correct: "By arguing that the sample was drawn from one location and may not represent the whole settlement.", distractors: ["By disputing the accuracy of the isotope measurements themselves.", "By agreeing that fishing dominated the settlement's economy but adding that inland farming also contributed.", "By claiming that the inland cemeteries have already disproved the conclusion."] } },

    { difficulty: "Medium", relation: "limit-scope",
      text1: "Small loans to market traders raised household income by nearly a fifth within two years.",
      text2: "The gain concentrates almost entirely among borrowers who already ran a business when the loan arrived. Among first-time borrowers the average change was close to zero, and the spread of outcomes was wide.",
      agreement: { correct: "Small loans have been associated with higher household income for some borrowers.", distractors: ["Small loans raise household income by roughly a fifth for every category of borrower who receives them.", "Small loans reduce household income among traders who already run a business.", "Household income is unaffected by whether a trader has access to credit."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's figure for income gains?", correct: "By accepting the average while arguing that it conceals a group for whom the loans did little.", distractors: ["By disputing that any borrower's household income rose after receiving a loan.", "By agreeing with the reported figure and recommending substantially larger loans for first-time borrowers.", "By arguing that two years is too short an interval for household income to change."] } },

    { difficulty: "Medium", relation: "alternative-explanation",
      text1: "The outer stars of spiral galaxies orbit far faster than the visible mass can explain. Some unseen matter must be supplying the missing gravity.",
      text2: "The rotation curves are not in doubt. But an unseen substance is only one way to close the gap. A modification to the law of gravity at very low accelerations closes it too, and without requiring a new particle.",
      agreement: { correct: "The observed rotation of spiral galaxies cannot be explained by their visible mass alone.", distractors: ["Unseen matter supplying the missing gravity is the only available explanation for the observed rotation curves.", "The measured rotation curves of spiral galaxies are unreliable.", "Modified gravity has been shown to fail at very low accelerations."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's inference that unseen matter exists?", correct: "By noting that the same observations follow from altering gravity, so they do not establish a new substance.", distractors: ["By rejecting the measurements that produced the rotation curves.", "By agreeing that unseen matter must exist but disputing how much of it the rotation curves require.", "By arguing that visible mass alone accounts for the observed rotation."] } },

    { difficulty: "Medium", relation: "alternative-explanation",
      text1: "Fields planted with the cover crop yielded a tenth more grain than fields left bare over winter. The cover crop enriched the soil.",
      text2: "Enrichment is plausible, but the covered fields also lost far less topsoil in the spring rains. A field that keeps its soil will outyield one that does not, whatever is happening to the nitrogen.",
      agreement: { correct: "Fields planted with the cover crop produced higher grain yields than bare fields.", distractors: ["The cover crop's yield advantage comes entirely from the nitrogen it adds rather than from any soil it retains.", "Cover-cropped fields and bare fields produce equivalent grain yields.", "Topsoil loss has no measurable effect on the grain yield of a field."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's explanation of the yield gain?", correct: "By offering erosion control as a mechanism that could produce the gain without any change in fertility.", distractors: ["By denying that the fields planted with the cover crop yielded more grain than the fields left bare.", "By agreeing that added nitrogen explains the gain but doubting its size.", "By arguing that spring rains affect covered and bare fields equally."] } },

    { difficulty: "Medium", relation: "extend",
      text1: "A quarter of vaccine doses shipped to remote clinics are discarded because refrigeration fails somewhere along the route.",
      text2: "Refrigeration is the wrong thing to fix. Freeze-drying the same formulations makes them stable at room temperature for months, which removes the cold chain from the problem rather than repairing it.",
      agreement: { correct: "A substantial share of vaccine doses sent to remote clinics is lost before it can be used.", distractors: ["Vaccine losses at remote clinics are caused mainly by scheduling delays rather than by any failure of refrigeration.", "Freeze-dried vaccines have proved less effective than refrigerated ones.", "Nearly all vaccine doses shipped to remote clinics arrive in usable condition."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's account of the discarded doses?", correct: "By accepting the figure and proposing a formulation change that makes refrigeration unnecessary.", distractors: ["By disputing the share of shipped vaccine doses that Text 1 reports as discarded before use.", "By recommending heavier investment in refrigeration along the same routes.", "By arguing that remote clinics should receive fewer doses to limit the waste."] } },

    { difficulty: "Medium", relation: "challenge-method",
      text1: "Adults who walk ten thousand steps a day have markedly lower rates of heart disease. The target is worth adopting.",
      text2: "People who can walk ten thousand steps a day are people who are well enough to walk ten thousand steps a day. Illness that has not yet been diagnosed lowers step counts long before it appears in any medical record.",
      agreement: { correct: "High daily step counts are associated with lower observed rates of heart disease.", distractors: ["Walking ten thousand steps a day directly prevents heart disease in adults who adopt the target.", "Daily step counts and rates of heart disease are unrelated.", "Undiagnosed illness has no effect on how much a person walks each day."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's recommendation of the ten-thousand-step target?", correct: "By suggesting that existing health may be producing the step counts rather than the reverse.", distractors: ["By disputing the association between daily step counts and heart disease.", "By agreeing that walking prevents heart disease but proposing a substantially lower daily step target.", "By arguing that step counters are too inaccurate to support any target."] } },

    { difficulty: "Medium", relation: "dispute-conclusion",
      text1: "Pigment analysis dates the panel's paint to the 1480s, within the master's lifetime. The attribution to his hand should stand.",
      text2: "The pigments are of the period, which rules out a later forgery. It does not distinguish the master from the dozen assistants who ground the same pigments in the same workshop.",
      agreement: { correct: "The pigments used in the panel are consistent with the 1480s.", distractors: ["The pigment evidence establishes that the master, rather than an assistant, painted the panel himself.", "The panel was painted well after the master's lifetime had ended.", "Workshop assistants used pigments that were distinct from the master's."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's defense of the attribution?", correct: "By granting the dating while denying that it can identify which hand in the workshop was responsible.", distractors: ["By arguing that the pigment analysis has misdated the panel and that it belongs to a later century.", "By agreeing that the master painted the panel but questioning the date.", "By concluding that the panel is a later forgery after all."] } },

    { difficulty: "Medium", relation: "limit-scope",
      text1: "Charging drivers to enter the city center cut traffic there by a fifth and shortened bus journeys.",
      text2: "Inside the charging zone the gains are real. Just outside it, traffic on the ring road rose by a comparable amount as drivers rerouted, and journey times there grew worse than before the scheme began.",
      agreement: { correct: "Traffic within the charging zone declined after the scheme was introduced.", distractors: ["The scheme reduced traffic across the whole metropolitan area, including the roads outside the charging zone.", "Traffic inside the charging zone was unaffected by the scheme.", "Bus journey times inside the zone grew longer after the charge began."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's account of the scheme's effects?", correct: "By accepting the reduction inside the zone while arguing that traffic was displaced rather than removed.", distractors: ["By disputing that traffic inside the charging zone fell at all once rerouting is taken into account.", "By agreeing that the scheme worked everywhere but cost too much to operate.", "By claiming that bus journeys inside the zone did not actually improve."] } },

    { difficulty: "Hard", relation: "limit-scope",
      text1: "People who sleep six hours or less show worse memory consolidation in the laboratory. Short sleep degrades memory.",
      text2: "The laboratory results are sound, and I would not argue with the mechanism. My objection is to the population: habitual short sleepers were excluded from those samples as a confound, and they are precisely the group the conclusion is being applied to.",
      agreement: { correct: "Restricting sleep under laboratory conditions is associated with poorer memory consolidation.", distractors: ["Habitual short sleepers show the same memory consolidation deficits that experimentally restricted sleepers show.", "The mechanism linking sleep and memory consolidation has been disproved.", "Short sleep improves memory consolidation under laboratory conditions."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's conclusion that short sleep degrades memory?", correct: "By accepting the mechanism but noting that the group it is applied to was excluded from the evidence.", distractors: ["By rejecting the laboratory findings on memory consolidation as methodologically unsound throughout.", "By arguing that memory consolidation cannot be measured in a laboratory at all.", "By agreeing fully and extending the conclusion to habitual short sleepers."] } },

    { difficulty: "Hard", relation: "alternative-explanation",
      text1: "Districts that adopted the new reading curriculum saw test scores rise within three years. The curriculum works.",
      text2: "Adoption was not random. Districts chose the curriculum when they had the budget for a coordinator, smaller classes, and new books, and the score gains track the budget more closely than they track the curriculum.",
      agreement: { correct: "Reading scores rose in the districts that adopted the new curriculum.", distractors: ["The new curriculum itself caused the rise in reading scores that the adopting districts recorded.", "Reading scores fell in the districts that adopted the new curriculum.", "District budgets bear no relationship to reading achievement."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's inference that the curriculum works?", correct: "By arguing that districts able to adopt it differed beforehand in ways that predict the same gains.", distractors: ["By disputing that reading test scores rose at all in the districts that adopted the new curriculum.", "By agreeing that the curriculum works but doubting the gains will last.", "By claiming that the curriculum was adopted at random across districts."] } },

    { difficulty: "Hard", relation: "challenge-method",
      text1: "Our survey found sixty percent support for the measure, with a margin of error of three points. Support is clearly above half.",
      text2: "The three-point figure describes sampling error alone. It says nothing about the eight percent who answered, the wording of the question, or the people who hung up. Those sources of error are larger and do not shrink with sample size.",
      agreement: { correct: "The survey's reported margin of error reflects only one source of potential error.", distractors: ["The survey's three-point margin of error accounts for nonresponse and question wording as well as sampling.", "Sixty percent support has been shown to be an underestimate of true support.", "A larger sample would eliminate the survey's nonresponse problem."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's conclusion that support is above half?", correct: "By arguing that errors unmeasured by the stated margin could be large enough to leave the conclusion unsupported.", distractors: ["By claiming that the survey's arithmetic was performed incorrectly.", "By agreeing that support is above half but recommending a larger sample to narrow the stated margin.", "By asserting that support for the measure is certainly below half."] } },

    { difficulty: "Hard", relation: "limit-scope",
      text1: "Resistance genes appear in soil bacteria from sites that have never been treated with antibiotics. Resistance is ancient and not driven by medical use.",
      text2: "The genes are ancient; nobody disputes the sequencing. What is new is their frequency. In treated environments the same genes sit on mobile elements and spread between species, which is the property that makes them a clinical problem.",
      agreement: { correct: "Resistance genes occur in bacteria from environments never exposed to medical antibiotics.", distractors: ["Antibiotic use has no influence on the distribution or the mobility of resistance genes in bacteria.", "Resistance genes originated only after the clinical use of antibiotics began.", "Resistance genes in untreated soil sit on mobile genetic elements."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's claim that resistance is not driven by medical use?", correct: "By distinguishing the age of the genes from their mobility and frequency, which medical use does affect.", distractors: ["By disputing that resistance genes occur in soil from sites never treated with antibiotics at all.", "By agreeing that medical use is irrelevant to clinical resistance.", "By arguing that the sequencing of soil bacteria is unreliable."] } },

    { difficulty: "Hard", relation: "dispute-conclusion",
      text1: "Employment in the county's restaurants did not fall in the year after the wage increase. The increase cost no jobs.",
      text2: "Headcount held, but scheduled hours per worker fell by about six percent over the same year. A payroll can keep every name on it and still buy less labor than it did before.",
      agreement: { correct: "The number of people employed in the county's restaurants did not decline after the increase.", distractors: ["The wage increase had no effect on the total amount of labor that the county's restaurants purchased.", "Restaurant employment in the county fell sharply after the wage increase.", "Scheduled hours per worker rose in the year following the wage increase."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's conclusion that the increase cost no jobs?", correct: "By arguing that headcount is the wrong measure because hours fell while the payroll stayed intact.", distractors: ["By disputing that restaurant headcount remained stable in the year following the wage increase.", "By agreeing that no labor was lost but questioning the level of the wage.", "By claiming that hours per worker are impossible to measure reliably."] } },

    { difficulty: "Hard", relation: "alternative-explanation",
      text1: "Isotopes in the tooth enamel show these individuals grew up hundreds of kilometers away. A population migrated into the valley.",
      text2: "The enamel signature is not in dispute. But it records where a person drank water as a child, and in a society that moved brides between valleys, a cemetery full of non-local women means marriage, not migration.",
      agreement: { correct: "The individuals analyzed spent their childhoods away from the valley where they were buried.", distractors: ["An entire population relocated into the valley during the period that the buried individuals lived.", "Tooth enamel cannot indicate where an individual grew up.", "The individuals analyzed grew up in the valley where they were buried."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's inference that a population migrated?", correct: "By proposing that a marriage practice moving individuals between valleys would leave the same signature.", distractors: ["By rejecting the tooth-enamel isotope evidence that the individuals had non-local childhoods.", "By agreeing that migration occurred but disputing its direction.", "By arguing that childhood water sources vary too much to be informative."] } },

    { difficulty: "Hard", relation: "challenge-method",
      text1: "The model answered ninety percent of the benchmark's questions correctly, approaching expert performance on the subject.",
      text2: "The benchmark was assembled from public examination papers. The model's training data was scraped from the open web in the same years. A high score may measure recall of the answer key rather than command of the subject.",
      agreement: { correct: "The model produced correct answers to most of the benchmark's questions.", distractors: ["The model's benchmark score demonstrates genuine command of the subject rather than recall of published answers.", "The model answered fewer than half of the benchmark questions correctly.", "The benchmark's questions were written specifically for this evaluation."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's description of the score as near-expert performance?", correct: "By noting that the questions may have appeared in training data, which would make the score uninformative about understanding.", distractors: ["By disputing the reported percentage of benchmark questions that the model answered correctly.", "By agreeing the model understands the subject but doubting it matches experts.", "By arguing that public examination papers are too difficult for the model."] } },

    { difficulty: "Hard", relation: "dispute-conclusion",
      text1: "The replanted forest has absorbed carbon at twice the rate projected when the scheme was designed.",
      text2: "For the first fifteen years, yes. Fast-growing species front-load their uptake and then plateau, and the projection was written for a hundred-year average. A doubled rate now is consistent with the projection being right.",
      agreement: { correct: "The replanted forest's recent carbon uptake has exceeded the rate initially projected.", distractors: ["The replanted forest will continue absorbing carbon at twice the projected rate over the scheme's full century.", "The forest has absorbed less carbon than the scheme's designers projected.", "Fast-growing species maintain a constant rate of carbon uptake as they age."] },
      response: { question: "How would the author of Text 2 most likely respond to Text 1's report of a doubled uptake rate?", correct: "By explaining that early uptake in fast-growing stands is expected to level off, leaving the long-run projection intact.", distractors: ["By disputing the measurements showing that the replanted forest doubled its projected uptake rate.", "By agreeing that the original projection was too conservative.", "By arguing that replanted forests absorb no carbon in their early years."] } }
  ];

  const CROSS_TEXT_CASES = CROSS_TEXT_PAIRS.flatMap((pair) => [
    { difficulty: pair.difficulty, recipe: "agreement", pair, form: "agreement" },
    { difficulty: pair.difficulty, recipe: "response", pair, form: "response" }
  ]);

  function crossText(ctx) {
    const entry = tieredCase(ctx, CROSS_TEXT_CASES);
    const { pair } = entry;
    const stimulus = `Text 1\n${pair.text1}\n\nText 2\n${pair.text2}`;
    if (entry.form === "agreement") {
      return item(ctx, {
        recipe: "agreement", stimulus,
        question: "Based on the texts, both authors would most likely agree with which statement?",
        correct: pair.agreement.correct, distractors: pair.agreement.distractors,
        explanation: `Both texts commit to this statement. The other choices are asserted by only one author, are rejected by one of them, or go beyond what either text claims.`,
        parameters: { relation: pair.relation }
      });
    }
    return item(ctx, {
      recipe: "response", stimulus, question: pair.response.question,
      correct: pair.response.correct, distractors: pair.response.distractors,
      explanation: `Text 2 relates to Text 1 by ${pair.relation.replace(/-/g, " ")}. The other choices misstate which part of Text 1 the second author accepts and which part is being challenged.`,
      parameters: { relation: pair.relation }
    });
  }

  function rhetoricalSynthesis(ctx) {
    const data = pick(ctx.rng, [
      { subject: "architect Lina Bo Bardi", work: "designed the Glass House", year: 1951, feature: "used slender supports to lift the main living space above the landscape", category: "architecture" },
      { subject: "chemist Alice Ball", work: "developed an injectable treatment derived from chaulmoogra oil", year: 1915, feature: "made the oil's active compounds water-soluble", category: "science" },
      { subject: "composer Florence Price", work: "had her Symphony No. 1 premiered by the Chicago Symphony Orchestra", year: 1933, feature: "marked the first performance by a major US orchestra of a symphony by a Black woman", category: "music" },
      { subject: "engineer Fazlur Rahman Khan", work: "advanced tubular structural systems", year: 1963, feature: "enabled tall buildings to use less structural material", category: "engineering" },
      { subject: "botanist Ynes Mexia", work: "began major collecting expeditions", year: 1925, feature: "resulted in the collection of thousands of plant specimens across the Americas", category: "botany" }
    ]);
    const [role, ...nameParts] = data.subject.split(" ");
    const name = nameParts.join(" ");
    const roleWithArticle = `${/^[aeiou]/i.test(role) ? "an" : "a"} ${role}`;
    const noteDetail = pick(ctx.rng, ["The student's source is a museum catalog.", "The student's source includes an archival photograph.", "The student is preparing a short presentation.", "The notes will be used in a biographical paragraph.", "The source was published by a university archive."]);
    const notes = `While researching a topic, a student has taken the following notes:\n• ${name} was ${roleWithArticle}.\n• In ${data.year}, ${name.split(" ").slice(-1)[0]} ${data.work}.\n• The work ${data.feature}.\n• ${noteDetail}`;
    const goal = ctx.index % 3 === 0 ? "emphasize the work's significance" : ctx.index % 3 === 1 ? "introduce the work and give its date" : "describe the subject's field and achievement";
    let correct;
    if (ctx.index % 3 === 0) correct = `${name}'s work was significant because it ${data.feature}.`;
    else if (ctx.index % 3 === 1) correct = `In ${data.year}, ${name} ${data.work}.`;
    else correct = `${name}, ${roleWithArticle}, ${data.work}.`;
    const lastName = name.split(" ").slice(-1)[0];
    const distractors = ctx.index % 3 === 0
      ? [`In ${data.year}, ${lastName} ${data.work}.`, `${name} was ${roleWithArticle}, and the student's source includes information about this field.`, `${name}'s work is one example of an achievement completed in ${data.year}.`]
      : ctx.index % 3 === 1
        ? [`${name}'s work was significant because it ${data.feature}.`, `${name} was ${roleWithArticle} who later became known for an important achievement.`, `The source used for the student's research provides information about ${name}.`]
        : [`In ${data.year}, ${name} completed work that later proved significant.`, `${name}'s achievement was significant because it ${data.feature}.`, `${noteDetail.replace(/^The student's /, "The ")}`];
    return item(ctx, {
      recipe: "notes-to-goal", stimulus: notes, question: `The student wants to ${goal}. Which choice most effectively uses relevant information from the notes to accomplish this goal?`,
      correct,
      distractors,
      explanation: `The correct choice selects accurate information from the notes that directly serves the stated goal; the other choices are irrelevant or contradict the notes.`, parameters: { data, goal, noteDetail }
    });
  }

  // `relation` names the precise logical link and drives the explanation;
  // `family` is the coarser recipe label. Every family appears at least twice
  // per difficulty tier so both practice sets drill the same recipes.
  const RELATION_PHRASES = {
    contrast: "sets its statement against the preceding one",
    comparison: "sets a parallel case beside the preceding one",
    result: "states an outcome of the preceding statement",
    inference: "draws a conclusion from the preceding statements",
    example: "gives a specific instance of the preceding statement",
    specification: "narrows the preceding statement to a particular case",
    addition: "adds a further point of the same kind",
    concession: "grants the preceding point and then asserts something despite it",
    sequence: "reports what happened next",
    restatement: "restates the preceding statement in different terms",
    summary: "sums up the preceding statements"
  };
  const RELATION_FAMILIES = {
    contrast: "contrast", comparison: "contrast",
    result: "causal", inference: "causal",
    example: "elaboration", specification: "elaboration",
    restatement: "restatement", summary: "restatement",
    addition: "addition", concession: "concession", sequence: "sequence"
  };

  const TRANSITION_CASES = [
    { difficulty: "Easy", relation: "contrast", before: "In laboratory trials, seedlings of the climbing vine grew steadily toward the brightest light source available to them.", after: "plants of the same species in open forest often bent away from the clearest patches of sky", correct: "However,", distractors: ["Therefore,", "For example,", "Similarly,"] },
    { difficulty: "Easy", relation: "result", before: "The museum photographed its most fragile illuminated manuscripts at very high resolution over three years.", after: "visitors can now study individual pages without ever handling the originals", correct: "As a result,", distractors: ["Nevertheless,", "For instance,", "Meanwhile,"] },
    { difficulty: "Easy", relation: "example", before: "Several desert mammals escape the punishing midday heat by retreating underground for most of the day.", after: "the kangaroo rat remains in a cool sealed burrow until well after sunset", correct: "For example,", distractors: ["However,", "Therefore,", "Instead,"] },
    { difficulty: "Easy", relation: "addition", before: "The new alloy weighs a third less than the structural steel it was designed to replace in bridges.", after: "it resists corrosion far better in the salt water that surrounds coastal spans", correct: "Moreover,", distractors: ["In contrast,", "Nevertheless,", "Specifically,"] },
    { difficulty: "Easy", relation: "concession", before: "The excavation never located the pottery workshop that the team had spent two seasons expecting to find.", after: "it uncovered a tile kiln in nearly complete condition beneath the courtyard", correct: "Even so,", distractors: ["As a result,", "For example,", "In other words,"] },
    { difficulty: "Easy", relation: "sequence", before: "The technicians calibrated each streamflow sensor under controlled conditions in the laboratory first.", after: "they installed the finished units at twelve points along the riverbank", correct: "Next,", distractors: ["Instead,", "Nevertheless,", "For instance,"] },
    { difficulty: "Easy", relation: "contrast", before: "Eighteenth-century maps of the region depict the harbor as a single broad and uninterrupted basin.", after: "survey records compiled in the same decade describe two clearly separate inlets", correct: "However,", distractors: ["Consequently,", "Likewise,", "In particular,"] },
    { difficulty: "Easy", relation: "result", before: "A fungal blight killed nearly every mature American chestnut in the region within about forty years.", after: "oaks and hickories now dominate forests that chestnut canopies once shaded", correct: "Consequently,", distractors: ["Nevertheless,", "For example,", "Beforehand,"] },
    { difficulty: "Easy", relation: "example", before: "Some composers construct an entire symphonic movement out of a single short rhythmic figure.", after: "Beethoven develops one four-note motif throughout the opening movement of his Fifth Symphony", correct: "For instance,", distractors: ["Even so,", "Therefore,", "By comparison,"] },
    { difficulty: "Easy", relation: "addition", before: "The archive's newly published catalog records the date, sender, and recipient of every letter it holds.", after: "it identifies the paper stock and ink used in each individual document", correct: "In addition,", distractors: ["In contrast,", "Therefore,", "Namely,"] },
    { difficulty: "Easy", relation: "sequence", before: "The survey team spent its first week mapping the limestone cave's main chamber in detail.", after: "the members traced the dozen narrow passages branching from its walls", correct: "Then,", distractors: ["Instead,", "Nevertheless,", "That is,"] },
    { difficulty: "Easy", relation: "result", before: "A run of warmer springs has pushed the flowering of the alpine meadow several weeks earlier than usual.", after: "the bees that feed on those flowers now emerge after the bloom has passed", correct: "As a result,", distractors: ["Even so,", "For example,", "Similarly,"] },
    { difficulty: "Easy", relation: "contrast", before: "The novel sold fewer than four hundred copies in the two years after it appeared in 1937.", after: "it is now assigned in most university survey courses covering the period", correct: "However,", distractors: ["Therefore,", "Likewise,", "For example,"] },
    { difficulty: "Easy", relation: "concession", before: "The wax cylinder has warped so badly that the singer's voice can no longer be identified.", after: "it preserves a melody that survives in no other known recording", correct: "Nevertheless,", distractors: ["As a result,", "For example,", "Likewise,"] },
    { difficulty: "Easy", relation: "example", before: "Certain metal alloys return to a shape they were trained to remember whenever they are heated.", after: "a sharply bent nickel-titanium wire straightens itself when dropped into hot water", correct: "For example,", distractors: ["However,", "Consequently,", "Previously,"] },
    { difficulty: "Easy", relation: "addition", before: "The revised cable-stay design reduced the amount of structural steel the bridge project required.", after: "it shortened the construction schedule by nearly a full year", correct: "Furthermore,", distractors: ["In contrast,", "For instance,", "Afterward,"] },

    { difficulty: "Medium", relation: "concession", before: "The survey reached only twelve households, so its findings cannot be generalized to the region.", after: "its detailed interviews documented patterns that much larger studies had overlooked", correct: "Even so,", distractors: ["Therefore,", "Similarly,", "For example,"] },
    { difficulty: "Medium", relation: "result", before: "The lake's main inflow was diverted for irrigation in 1962, and within two decades its surface area had fallen by half.", after: "the newly exposed lakebed became the region's largest source of windblown dust", correct: "In turn,", distractors: ["Nevertheless,", "By comparison,", "Admittedly,"] },
    { difficulty: "Medium", relation: "restatement", before: "The company sold more units every year through the decade while its share of the market steadily declined.", after: "it was growing more slowly than the industry expanding around it", correct: "In other words,", distractors: ["For example,", "Nevertheless,", "Afterward,"] },
    { difficulty: "Medium", relation: "concession", before: "Loggerhead hatchlings are widely thought to navigate by sensing Earth's magnetic field.", after: "turtles raised in tanks where that field was deliberately distorted still oriented themselves correctly", correct: "Nevertheless,", distractors: ["Consequently,", "Likewise,", "That is,"] },
    { difficulty: "Medium", relation: "specification", before: "The early-intervention therapy produced markedly better outcomes in some children than in others.", after: "it yielded the largest gains in those diagnosed before the age of six", correct: "Specifically,", distractors: ["However,", "Therefore,", "Likewise,"] },
    { difficulty: "Medium", relation: "result", before: "Ash from the 1815 eruption of Tambora spread through the upper atmosphere and circled the globe within months.", after: "Europe and North America recorded frost in every month of the following summer", correct: "As a result,", distractors: ["Even so,", "For example,", "Meanwhile,"] },
    { difficulty: "Medium", relation: "concession", before: "Digitization makes fragile manuscripts available to readers anywhere in the world at no cost.", after: "a photograph cannot record the texture, watermarks, and binding that scholars examine", correct: "However,", distractors: ["Therefore,", "For instance,", "Similarly,"] },
    { difficulty: "Medium", relation: "sequence", before: "Kahlo painted the first version of the portrait during a long hospital stay in the winter of 1946.", after: "she returned to the same subject in three progressively larger canvases", correct: "Afterward,", distractors: ["Instead,", "Nonetheless,", "Namely,"] },
    { difficulty: "Medium", relation: "comparison", before: "The northern population of the warbler migrates more than two thousand kilometers every autumn.", after: "the southern population moves only between neighboring mountain valleys", correct: "By comparison,", distractors: ["Consequently,", "Furthermore,", "In short,"] },
    { difficulty: "Medium", relation: "result", before: "The eighteenth-century recipe calls for a soft wheat flour that no commercial mill produces today.", after: "modern bakers can only approximate the texture the author described", correct: "Therefore,", distractors: ["Even so,", "For example,", "Likewise,"] },
    { difficulty: "Medium", relation: "addition", before: "The proposed orbiting telescope would resolve finer detail than any instrument built on the ground.", after: "it would observe at infrared wavelengths that the atmosphere blocks completely", correct: "More important,", distractors: ["In contrast,", "For example,", "Previously,"] },
    { difficulty: "Medium", relation: "concession", before: "Only about six hundred lines of the epic survive, scattered across four damaged papyrus fragments.", after: "those lines preserve enough of the meter to reconstruct the poem's original form", correct: "Still,", distractors: ["Therefore,", "Similarly,", "For instance,"] },
    { difficulty: "Medium", relation: "example", before: "Many pigments used by European painters before 1800 were made from minerals ground by hand.", after: "ultramarine was produced from lapis lazuli carried overland from a single Afghan valley", correct: "For example,", distractors: ["In short,", "However,", "Consequently,"] },
    { difficulty: "Medium", relation: "summary", before: "The replacement alloy is lighter, cheaper, and easier to shape than the material it succeeded.", after: "it improved on the older material in every property the engineers thought to measure", correct: "In short,", distractors: ["Nevertheless,", "For example,", "Meanwhile,"] },
    { difficulty: "Medium", relation: "contrast", before: "Radiocarbon dating of the timber returns an age range that can span several decades.", after: "counting the growth rings in the same beam can fix a felling date to a single year", correct: "By contrast,", distractors: ["Accordingly,", "Likewise,", "For instance,"] },
    { difficulty: "Medium", relation: "result", before: "The corrective lens eliminated the blurring that had distorted the outer edges of every exposure.", after: "astronomers could finally measure the positions of faint stars near the frame's border", correct: "Consequently,", distractors: ["Nonetheless,", "Similarly,", "Namely,"] },
    { difficulty: "Medium", relation: "sequence", before: "The conservators removed four layers of discolored varnish from the panel over eighteen months.", after: "they filled the losses along the lower edge with reversible pigment", correct: "Only then,", distractors: ["Nevertheless,", "In short,", "For instance,"] },
    { difficulty: "Medium", relation: "addition", before: "The estuary restoration returned tidal flow to nine hundred hectares of diked farmland.", after: "it reopened a migratory corridor that juvenile salmon had not used in eighty years", correct: "Beyond that,", distractors: ["By comparison,", "In other words,", "Admittedly,"] },

    { difficulty: "Hard", relation: "restatement", before: "The census recorded only heads of household, so any figure for total population rests on an assumption about average family size.", after: "the number usually cited is an estimate rather than a count", correct: "In other words,", distractors: ["For example,", "Even so,", "Meanwhile,"] },
    { difficulty: "Hard", relation: "result", before: "The instrument's readings drift as the laboratory warms, so the team recalibrated it at the start of every hour.", after: "the published measurements stayed within the tolerance the method requires", correct: "As a result,", distractors: ["Nevertheless,", "In other words,", "For example,"] },
    { difficulty: "Hard", relation: "concession", before: "The tidal model predicts water levels at this harbor to within a few centimeters across the whole year.", after: "it performs poorly in estuaries where seasonal river discharge is large", correct: "Admittedly,", distractors: ["Consequently,", "Similarly,", "In particular,"] },
    { difficulty: "Hard", relation: "result", before: "The glaze was brushed onto the vessel before it entered the kiln for a second firing.", after: "the pigment sank into the softened surface instead of resting on top of it", correct: "As a result,", distractors: ["Beforehand,", "Similarly,", "Nevertheless,"] },
    { difficulty: "Hard", relation: "restatement", before: "Sea level at the site rose faster than the marsh could build up new sediment beneath itself.", after: "the marsh could not keep pace with the water and was gradually submerged", correct: "That is,", distractors: ["By comparison,", "For example,", "Admittedly,"] },
    { difficulty: "Hard", relation: "concession", before: "Both dating techniques place the sediment layer in roughly the same century of deposition.", after: "they disagree sharply about the order in which the individual layers formed", correct: "Nevertheless,", distractors: ["Accordingly,", "In other words,", "For instance,"] },
    { difficulty: "Hard", relation: "example", before: "The alloy fails under repeated moderate loading rather than under a single heavy load.", after: "it survives one blow of eight tons but cracks after ten thousand cycles at one ton", correct: "For example,", distractors: ["In short,", "Nevertheless,", "Therefore,"] },
    { difficulty: "Hard", relation: "concession", before: "Nothing in the composer's surviving correspondence makes any mention of the commission.", after: "the payment to her appears in the court's account book for that year", correct: "Even so,", distractors: ["Accordingly,", "Namely,", "Likewise,"] },
    { difficulty: "Hard", relation: "inference", before: "Every surviving copy of the pamphlet was printed on paper from one mill, and that mill operated for only three years.", after: "the pamphlet must have been printed within a narrow window", correct: "Therefore,", distractors: ["Nonetheless,", "For example,", "By comparison,"] },
    { difficulty: "Hard", relation: "contrast", before: "The drug shortened the illness by roughly a day in otherwise healthy younger adults.", after: "in patients over seventy it reduced the risk of hospitalization by nearly half", correct: "By contrast,", distractors: ["In other words,", "Consequently,", "Admittedly,"] },
    { difficulty: "Hard", relation: "result", before: "Only one of the four anemometers returned usable data during the eighteen hours of the storm.", after: "the team based its published wind estimates on that single record", correct: "Therefore,", distractors: ["Nevertheless,", "Similarly,", "For instance,"] },
    { difficulty: "Hard", relation: "restatement", before: "The technique cannot distinguish a pigment applied in 1500 from the very same pigment applied in 1900.", after: "it dates the material but not the painting", correct: "In other words,", distractors: ["Even so,", "Consequently,", "For example,"] },
    { difficulty: "Hard", relation: "concession", before: "Reintroduced wolves have not measurably reduced the size of the valley's elk population.", after: "the elk now avoid the open riverbanks where the willows are recovering", correct: "Even so,", distractors: ["As a result,", "In short,", "Likewise,"] },
    { difficulty: "Hard", relation: "contrast", before: "Museum attendance rose in each of the five years that followed the building's renovation.", after: "the share of visitors who lived in the surrounding neighborhood fell in every one of those years", correct: "However,", distractors: ["Accordingly,", "Likewise,", "In particular,"] },
    { difficulty: "Hard", relation: "inference", before: "The two manuscripts share the same unusual spelling errors at the same points in the same passages.", after: "one was almost certainly copied directly from the other", correct: "Accordingly,", distractors: ["Nevertheless,", "For example,", "Meanwhile,"] },
    { difficulty: "Hard", relation: "specification", before: "The restoration succeeded in some reaches of the river and failed conspicuously in others.", after: "the gravel beds rebuilt themselves only where the winter flow exceeded the design minimum", correct: "In particular,", distractors: ["Nevertheless,", "By comparison,", "In short,"] }
  ];

  function transitions(ctx) {
    const transition = tieredCase(ctx, TRANSITION_CASES);
    const stimulus = `${transition.before} ______ ${transition.after}.`;
    return item(ctx, {
      recipe: RELATION_FAMILIES[transition.relation], stimulus,
      question: "Which choice completes the text with the most logical transition?", correct: transition.correct,
      distractors: transition.distractors,
      explanation: `The sentence after the blank ${RELATION_PHRASES[transition.relation]}, and “${transition.correct.replace(",", "")}” signals that relationship. The other choices signal a relationship the text does not establish.`,
      parameters: { transition }
    });
  }

  const BOUNDARY_CASES = [
    {
      recipe: "independent-clauses", text: "The first survey ended in May ______ the second survey began in June.", correct: ";", distractors: [",", ":", "no punctuation"],
      reason: "The blank separates two independent clauses, so a semicolon is appropriate."
    },
    {
      recipe: "introductory-phrase", text: "After reviewing the new measurements ______ the team revised its estimate.", correct: ",", distractors: [";", ":", "no punctuation"],
      reason: "A comma follows the introductory dependent phrase."
    },
    {
      recipe: "colon-list", text: "The field kit contained three instruments ______ a thermometer, a scale, and a timer.", correct: ":", distractors: [",", ";", "no punctuation"],
      reason: "A colon introduces a list after a complete independent clause."
    },
    {
      recipe: "nonrestrictive-clause", text: "The eastern sample ______ which was collected after the storm ______ contained more sediment.", correct: ", / ,", distractors: ["; / ;", "no punctuation / no punctuation", ": / ,"],
      reason: "The nonessential which-clause is set off with a pair of commas."
    },
    {
      recipe: "no-subject-verb-comma", text: "The pattern visible in the earliest images ______ suggests that the crack formed gradually.", correct: "no punctuation", distractors: [",", ";", ":"],
      reason: "No punctuation should separate the complete subject from its verb."
    },
    {
      recipe: "semicolon-conjunctive-adverb", text: "The first method was inexpensive ______ however, it was too imprecise for the final analysis.", correct: ";", distractors: [",", ":", "no punctuation"],
      reason: "A semicolon separates the independent clauses before the conjunctive adverb “however.”"
    }
  ];

  const BOUNDARY_MEDIUM_CASES = [
    { recipe: "coordinating-conjunction", text: "The coastal station closed for repairs ______ its instruments continued sending data remotely.", correct: ", but", distractors: ["but", "; but", ","], reason: "A comma and the coordinating conjunction “but” correctly join the two independent clauses." },
    { recipe: "colon-explanation", text: "The team reached one conclusion ______ contamination of the sample.", correct: ":", distractors: [",", ";", "no punctuation"], reason: "A colon introduces the explanatory noun phrase after the complete clause before the blank." },
    { recipe: "appositive", text: "The oldest instrument ______ a brass telescope purchased in 1892 ______ remains functional.", correct: ", / ,", distractors: ["; / ;", ": / ,", "no punctuation / no punctuation"], reason: "The nonessential appositive is set off with a pair of commas." },
    { recipe: "dependent-to-independent", text: "Because the sensor had been recalibrated ______ its later readings were reliable.", correct: ",", distractors: [";", ":", "no punctuation"], reason: "A comma separates the introductory dependent clause from the independent clause that follows." },
    { recipe: "compound-predicate", text: "The archive cataloged and digitized ______ the newly donated letters.", correct: "no punctuation", distractors: [",", ";", ":"], reason: "No punctuation belongs between the compound predicate and its direct object." },
    { recipe: "semicolon-transition", text: "The initial estimate was plausible ______ nevertheless, later measurements contradicted it.", correct: ";", distractors: [",", ":", "no punctuation"], reason: "A semicolon separates the independent clauses before the conjunctive adverb “nevertheless.”" },
    { recipe: "colon-series", text: "The report identifies three threats ______ erosion, flooding, and salt intrusion.", correct: ":", distractors: [",", ";", "no punctuation"], reason: "A colon introduces the series after a complete independent clause." },
    { recipe: "parenthetical", text: "The revised map ______ unlike the earlier version ______ includes seasonal streams.", correct: ", / ,", distractors: ["; / ;", ": / :", "no punctuation / no punctuation"], reason: "The parenthetical contrast is nonessential and must be enclosed by matching commas." }
  ];

  const BOUNDARY_HARD_CASES = [
    { recipe: "semicolon-parenthetical", text: "The method was inexpensive ______ it was, however, too imprecise for the final analysis.", correct: ";", distractors: [",", ":", "no punctuation"], reason: "The blank separates independent clauses, so a semicolon is appropriate; “however” is parenthetical inside the second clause." },
    { recipe: "restrictive-clause", text: "The samples that were collected in June ______ were analyzed first.", correct: "no punctuation", distractors: [",", ";", ":"], reason: "The restrictive that-clause identifies which samples were analyzed, so no comma closes it." },
    { recipe: "nonrestrictive-clause", text: "The June samples ______ which arrived frozen ______ were analyzed first.", correct: ", / ,", distractors: ["; / ;", ": / ,", "no punctuation / no punctuation"], reason: "The nonrestrictive which-clause adds supplementary information and is enclosed by commas." },
    { recipe: "colon-explanation", text: "The analysis yielded an unexpected result ______ equal improvement in the control and treatment groups.", correct: ":", distractors: [",", ";", "no punctuation"], reason: "A colon introduces the explanatory noun phrase after the complete clause." },
    { recipe: "independent-clauses", text: "The first archive contains letters from 1901 ______ the second contains letters from 1902.", correct: ";", distractors: [",", ":", "no punctuation"], reason: "A semicolon correctly joins the closely related independent clauses." },
    { recipe: "introductory-dependent-clause", text: "Although the first estimate seemed precise ______ it rested on incomplete records.", correct: ",", distractors: [";", ":", "no punctuation"], reason: "A comma follows the introductory dependent clause." },
    { recipe: "colon-elaboration", text: "The team performed two measurements ______ one before heating and one after cooling.", correct: ":", distractors: [",", ";", "no punctuation"], reason: "A colon introduces an elaboration after a complete independent clause." },
    { recipe: "interrupting-phrase", text: "The restored panels, along with the original frame ______ are displayed in the east gallery.", correct: ",", distractors: [";", ":", "no punctuation"], reason: "The phrase beginning “along with” is supplementary and must be closed with a comma." }
  ];

  function boundaryPresentation(entry) {
    const parts = entry.text.split("______");
    const variants = [entry.correct, ...entry.distractors];
    if (parts.length === 2) {
      const leftMatch = parts[0].match(/^(.*\s)(\S+)\s*$/);
      const rightMatch = parts[1].match(/^\s*(\S+)([\s\S]*)$/);
      if (!leftMatch || !rightMatch) return { text: entry.text, correct: entry.correct, distractors: entry.distractors };
      const [, before, left] = leftMatch;
      const [, right, after] = rightMatch;
      const complete = (punctuation) => {
        if (punctuation === "no punctuation") return `${left} ${right}`;
        if (/^[A-Za-z]/.test(punctuation)) return `${left} ${punctuation} ${right}`;
        return `${left}${punctuation} ${right}`;
      };
      return { text: `${before}______${after}`, correct: complete(variants[0]), distractors: variants.slice(1).map(complete) };
    }
    if (parts.length === 3) {
      const leftMatch = parts[0].match(/^(.*\s)(\S+)\s*$/);
      const rightMatch = parts[2].match(/^\s*(\S+)([\s\S]*)$/);
      if (!leftMatch || !rightMatch) return { text: entry.text, correct: entry.correct, distractors: entry.distractors };
      const [, before, left] = leftMatch;
      const [, right, after] = rightMatch;
      const middle = parts[1].trim();
      const complete = (pair) => {
        const [first, second] = pair.split(" / ");
        const firstMark = first === "no punctuation" ? "" : first;
        const secondMark = second === "no punctuation" ? "" : second;
        return `${left}${firstMark} ${middle}${secondMark} ${right}`;
      };
      return { text: `${before}______${after}`, correct: complete(variants[0]), distractors: variants.slice(1).map(complete) };
    }
    return { text: entry.text, correct: entry.correct, distractors: entry.distractors };
  }

  function boundaries(ctx) {
    const bank = ctx.difficulty === "Hard" ? BOUNDARY_HARD_CASES : ctx.difficulty === "Medium" ? BOUNDARY_MEDIUM_CASES : BOUNDARY_CASES;
    const entry = bank[ctx.index % bank.length];
    const year = ctx.practiceSet === 2 ? 1976 + (ctx.index - 25) : 2001 + ctx.index;
    const presentation = boundaryPresentation(entry);
    const leadByRecipe = {
      "independent-clauses": `A ${year} project history traces how two consecutive surveys or archival collections were organized.`,
      "introductory-phrase": `A ${year} technical report explains how a team reconsidered an estimate after inspecting additional evidence.`,
      "colon-list": `A field manual revised in ${year} describes the equipment researchers carry when collecting measurements.`,
      "nonrestrictive-clause": `A ${year} laboratory report compares samples collected at different times and under different conditions.`,
      "no-subject-verb-comma": `A ${year} imaging study uses early photographs to reconstruct how damage to an object developed.`,
      "semicolon-conjunctive-adverb": `A ${year} methods paper evaluates whether an inexpensive procedure is precise enough for research.`,
      "coordinating-conjunction": `A ${year} report describes how a coastal station maintained data collection while its building was repaired.`,
      "colon-explanation": `A ${year} investigation considers whether contamination or another factor affected the study's result.`,
      appositive: `A museum catalog published in ${year} discusses several historic scientific instruments that remain in use.`,
      "dependent-to-independent": `A ${year} field report explains why measurements made after a sensor adjustment could be trusted.`,
      "compound-predicate": `A ${year} archive report describes the processing of a large collection of newly donated documents.`,
      "semicolon-transition": `A ${year} analysis compares an initial estimate with the conclusion supported by later measurements.`,
      "colon-series": `A planning report released in ${year} identifies environmental risks to a coastal community.`,
      parenthetical: `A ${year} cartographic study compares an updated map with an earlier version of the same region.`,
      "semicolon-parenthetical": `A ${year} methods review weighs a procedure's low cost against limits on its precision.`,
      "restrictive-clause": `A ${year} laboratory schedule explains the order in which samples from different collection periods were processed.`,
      "introductory-dependent-clause": `A ${year} historical analysis reevaluates an estimate that had been based on incomplete records.`,
      "colon-elaboration": `A ${year} laboratory summary describes measurements taken at two stages of a controlled procedure.`,
      "interrupting-phrase": `A museum guide issued in ${year} identifies the parts of a restored artwork that are currently on view.`
    };
    const lead = leadByRecipe[entry.recipe];
    return item(ctx, {
      recipe: entry.recipe, stimulus: `${lead} ${presentation.text}`, question: "Which choice completes the text so that it conforms to the conventions of Standard English?", correct: presentation.correct,
      distractors: presentation.distractors,
      explanation: entry.reason, parameters: { entry, year }
    });
  }

  const FORM_CASES = [
    { recipe: "subject-verb-agreement", text: "The collection of maps, along with two navigation logs, ______ stored in the climate-controlled room.", correct: "is", distractors: ["are", "were being", "have been"], reason: "The singular head subject “collection” requires the singular verb “is.”" },
    { recipe: "pronoun-agreement", text: "Each of the sculptures retains ______ original label.", correct: "its", distractors: ["their", "it's", "there"], reason: "The singular pronoun “its” agrees with the singular indefinite pronoun “Each”; “it's” means “it is.”" },
    { recipe: "verb-tense", text: "By the time the second expedition began, researchers ______ the first set of samples.", correct: "had analyzed", distractors: ["analyze", "will analyze", "are analyzing"], reason: "Past perfect marks an action completed before another past action." },
    { recipe: "dangling-modifier", text: "Using a high-speed camera, ______.", correct: "the researchers recorded the insect's wing movements", distractors: ["the insect's wing movements were recorded", "the wings appeared as a blur", "a recording of the insect was made"], reason: "The noun immediately after the introductory modifier must be the people using the camera: the researchers." },
    { recipe: "parallel-structure", text: "The internship required students to catalog samples, to update records, and ______.", correct: "to prepare weekly summaries", distractors: ["weekly summaries were prepared", "preparing weekly summaries", "they prepared weekly summaries"], reason: "All three coordinated elements should use the parallel infinitive form “to” plus a verb." },
    { recipe: "logical-comparison", text: "The new telescope's mirror is larger than ______.", correct: "that of the older telescope", distractors: ["the older telescope", "those of the older telescope", "the older telescope is"], reason: "The sentence must compare one mirror with another mirror, represented by the singular pronoun “that.”" },
    { recipe: "possessive", text: "The two ______ migration routes overlap near the coast.", correct: "species'", distractors: ["species", "specie's", "species's"], reason: "The routes belong to two species, so the plural possessive form is “species'.”" },
    { recipe: "verb-finiteness", text: "The researchers used satellite images ______ changes in shoreline position.", correct: "to track", distractors: ["tracked", "tracking", "track"], reason: "The infinitive “to track” conventionally follows “used satellite images” to express purpose." }
  ];

  const FORM_MEDIUM_CASES = [
    { recipe: "subject-verb-agreement", text: "Neither the catalog nor the accompanying index ______ available online.", correct: "is", distractors: ["are", "were", "have been"], reason: "With “neither...nor,” the verb agrees with the nearer singular subject “index,” so “is” is correct." },
    { recipe: "pronoun-case", text: "The curator asked Maya and ______ to inspect the newly acquired print.", correct: "me", distractors: ["I", "myself", "mine"], reason: "The pronoun is an object of “asked,” so the objective form “me” is required." },
    { recipe: "verb-tense", text: "Before the revised map was published, the cartographer ______ three mislabeled rivers.", correct: "had corrected", distractors: ["corrects", "will correct", "is correcting"], reason: "Past perfect marks the correction as completed before the later past action." },
    { recipe: "modifier-placement", text: "The team almost examined ______ with the new microscope.", correct: "every sample", distractors: ["with the new microscope every sample", "every sample was examined", "the new microscope's every sample"], reason: "Placing “every sample” directly after “examined” makes the intended object and modifier relationship clear." },
    { recipe: "parallel-structure", text: "The new procedure is faster to perform, easier to document, and ______ than the old one.", correct: "less expensive to repeat", distractors: ["repeating it costs less", "with less expense", "its repetition is cheaper"], reason: "“Less expensive to repeat” is parallel with the preceding comparative adjective phrases." },
    { recipe: "logical-comparison", text: "The poems in the 1924 collection are shorter than ______.", correct: "those in the 1921 collection", distractors: ["the 1921 collection", "that in the 1921 collection", "the 1921 collection is"], reason: "The plural pronoun “those” correctly compares poems with poems." },
    { recipe: "possessive", text: "The two researchers compared the ______ field notes.", correct: "observers'", distractors: ["observer's", "observers", "observers's"], reason: "The notes belong to multiple observers, so the plural possessive form “observers'” is required." },
    { recipe: "verb-finiteness", text: "The sediment core, collected from the deepest part of the lake, ______ evidence of an earlier drought.", correct: "contains", distractors: ["containing", "to contain", "having contained"], reason: "The sentence needs the finite verb “contains” to complete the clause whose subject is “core.”" }
  ];

  const FORM_HARD_CASES = [
    { recipe: "subject-verb-agreement", text: "Neither the maps displayed near the entrance nor the recently acquired atlas ______ the disputed boundary.", correct: "shows", distractors: ["show", "have shown", "were showing"], reason: "The verb agrees with the nearer singular subject “atlas,” so the singular form “shows” is required." },
    { recipe: "pronoun-case", text: "The scholarship committee selected Ana and ______ as the two finalists.", correct: "him", distractors: ["he", "his", "himself"], reason: "The pronoun functions as an object of “selected,” so the objective form “him” is correct." },
    { recipe: "verb-tense", text: "The researchers reported that, before the sensor failed, it ______ a steady decline in pressure.", correct: "had recorded", distractors: ["records", "will record", "has been recording"], reason: "Past perfect places the recording before the sensor's later past failure." },
    { recipe: "dangling-modifier", text: "After comparing the two manuscripts line by line, ______.", correct: "the editor identified three substantive differences", distractors: ["three substantive differences were apparent", "the earlier manuscript's revisions were clear", "there were three differences for the editor"], reason: "The noun after the introductory modifier must be the person who performed the comparison: the editor." },
    { recipe: "parallel-structure", text: "The expedition's goals were to map the inlet, to document nesting sites, and ______.", correct: "to collect water samples", distractors: ["water samples were collected", "collecting water samples", "the collection of water samples"], reason: "The coordinated goals must all use parallel infinitive phrases." },
    { recipe: "logical-comparison", text: "Unlike those of the coastal population, ______.", correct: "the inland population's calls contain three distinct notes", distractors: ["three distinct notes occur in the inland population", "the inland population has calls", "researchers recorded the inland population"], reason: "The sentence logically compares the calls of one population with the calls of another." },
    { recipe: "possessive", text: "The three ______ nesting territories overlap at the edge of the preserve.", correct: "species'", distractors: ["species", "specie's", "species's"], reason: "The territories belong to multiple species, so the plural possessive form is “species'.”" },
    { recipe: "verb-finiteness", text: "The newly translated letters ______ that the architect revised the plan twice.", correct: "reveal", distractors: ["revealing", "to reveal", "having revealed"], reason: "The plural subject “letters” requires the finite plural verb “reveal.”" }
  ];

  function formStructureSense(ctx) {
    const bank = ctx.difficulty === "Hard" ? FORM_HARD_CASES : ctx.difficulty === "Medium" ? FORM_MEDIUM_CASES : FORM_CASES;
    const entry = bank[ctx.index % bank.length];
    const year = ctx.practiceSet === 2 ? 1970 + (ctx.index - 25) : 1995 + ctx.index;
    const leadByRecipe = {
      "subject-verb-agreement": `A catalog updated in ${year} describes how maps and reference materials are stored or displayed.`,
      "pronoun-agreement": `A ${year} museum inventory records the identifying information and original labels retained by individual objects in the collection.`,
      "pronoun-case": `A ${year} institutional report identifies the people selected to complete a particular task or receive an honor.`,
      "verb-tense": `A project history written in ${year} distinguishes an earlier completed action from a later event.`,
      "dangling-modifier": `A ${year} account describes a specialist using close observation to identify previously unnoticed details.`,
      "modifier-placement": `A ${year} laboratory summary explains the extent to which a research team examined its samples with newly acquired equipment.`,
      "parallel-structure": `A program description issued in ${year} lists several equally important requirements or goals.`,
      "logical-comparison": `A comparative study published in ${year} evaluates corresponding features in two collections or populations.`,
      possessive: `A ${year} field report distinguishes records or territories associated with more than one observer or species.`,
      "verb-finiteness": `A ${year} research summary states what a set of images, samples, or documents makes possible or reveals.`
    };
    const lead = leadByRecipe[entry.recipe];
    return item(ctx, {
      recipe: entry.recipe, stimulus: `${lead} ${entry.text}`, question: "Which choice completes the text so that it conforms to the conventions of Standard English?", correct: entry.correct,
      distractors: entry.distractors,
      explanation: entry.reason, parameters: { entry, year }
    });
  }

  const GENERATORS = {
    "central-ideas-details": centralIdeasDetails,
    "command-evidence-textual": commandEvidenceTextual,
    "command-evidence-quantitative": commandEvidenceQuantitative,
    inferences,
    "words-context": wordsContext,
    "text-structure-purpose": textStructurePurpose,
    "cross-text": crossText,
    "rhetorical-synthesis": rhetoricalSynthesis,
    transitions,
    boundaries,
    "form-structure-sense": formStructureSense
  };

  function buildSATRWQuestions(seed = "baseline-v2", options = {}) {
    const normalizedSeed = String(seed).trim() || "baseline-v2";
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
          signature = `${question.stimulus}|${question.question}|${JSON.stringify(question.table || null)}`;
          retry += 1;
        } while (signatures.has(signature) && retry < 250);
        if (signatures.has(signature)) throw new Error(`Unable to generate unique Reading and Writing content for ${skill.name}, set ${practiceSet}, variant ${index + 1}.`);
        signatures.add(signature);
        question.practiceSet = practiceSet;
        question.meta.practiceSet = practiceSet;
        question.meta.generationAttempt = retry;
        generated.push(question);
      }
      return generated;
    });
  }

  window.SAT_RW_SKILLS = SKILLS;
  window.buildSATRWQuestions = buildSATRWQuestions;
  window.buildSATRWQuestionSets = function (seed) {
    const first = buildSATRWQuestions(seed, { practiceSet: 1 });
    const excludedSignatures = new Map();
    for (const question of first) {
      if (!excludedSignatures.has(question.skill)) excludedSignatures.set(question.skill, []);
      excludedSignatures.get(question.skill).push(`${question.stimulus}|${question.question}|${JSON.stringify(question.table || null)}`);
    }
    return [...first, ...buildSATRWQuestions(seed, { practiceSet: 2, excludedSignatures })];
  };
  window.applySATRWSet = function (seed) {
    const math = (window.SAT_QUESTIONS || []).filter((question) => question.section === "Math");
    window.SAT_QUESTIONS = [...window.buildSATRWQuestionSets(seed), ...math];
    return window.SAT_QUESTIONS;
  };
})();
