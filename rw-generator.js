(function () {
  "use strict";

  const DIFFICULTIES = [
    ...Array(8).fill("Easy"),
    ...Array(9).fill("Medium"),
    ...Array(8).fill("Hard")
  ];

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
        seed: ctx.seed,
        variant: ctx.index + 1,
        parameters: details.parameters || {}
      }
    };
    if (details.table) result.table = details.table;
    return result;
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

  function centralIdeasDetails(ctx) {
    const topic = pick(ctx.rng, TOPICS);
    const duration = ctx.index + 4;
    const hardQualification = ctx.difficulty === "Hard" ? ` Because the evidence concerns a limited set of observations, ${topic.surname} does not claim that the pattern must occur in every setting.` : "";
    const stimulus = `${topic.researcher[0].toUpperCase()}${topic.researcher.slice(1)} conducted a ${duration}-week study of ${topic.subject}. ${topic.result}${hardQualification}`;
    if (ctx.index % 3 === 0) {
      return item(ctx, {
        recipe: "key-detail", stimulus, question: `According to the text, what did ${topic.surname} find?`,
        correct: `${topic.detail[0].toUpperCase()}${topic.detail.slice(1)}.`,
        distractors: [`The study found no difference or recurring pattern.`, `The study examined only a single observation made on one occasion.`, `The results proved that the pattern occurs in every possible setting.`],
        explanation: `The correct choice restates the result reported in the second sentence without contradicting or overstating it.`, parameters: { topic, duration }
      });
    }
    return item(ctx, {
      recipe: "central-idea", stimulus, question: "Which choice best states the main idea of the text?",
      correct: topic.main,
      distractors: [`${topic.surname}'s study found no meaningful pattern in ${topic.subject}.`, `${topic.surname}'s primary purpose was to establish that the result applies in every setting.`, `The text mainly argues that a ${duration}-week study is always more reliable than a shorter study.`],
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
    return item(ctx, {
      recipe: "support-claim", stimulus: `After reviewing evidence from a ${ctx.index + 3}-month investigation, a researcher claims that ${caseData.claim}.`,
      question: `Which finding, if true, would ${qualifier} support the researcher's claim?`, correct: caseData.correct,
      distractors: ctx.difficulty === "Hard" ? caseData.hardDistractors : caseData.distractors,
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
    if (ctx.index % 2 === 0) {
      return item(ctx, {
        recipe: "support-comparison", stimulus: `A researcher claims that ${names[2]} had a higher value than either of the other groups.`, table,
        question: "Which choice most effectively uses data from the table to support the claim?",
        correct: `${names[2]}'s ${unit} was ${third}, compared with ${second} for ${names[1]} and ${first} for ${names[0]}.`,
        distractors: [`${names[0]}'s ${unit} was ${first}, the lowest value shown.`, `${names[1]} and ${names[2]} differed by ${third - second}, but the table gives no data for ${names[0]}.`, `All three groups had the same ${unit}.`],
        explanation: `The correct choice accurately cites all three values and directly establishes that ${third} is the greatest.`, parameters: { names, values, unit }
      });
    }
    const difference = third - first;
    return item(ctx, {
      recipe: "quantify-difference", stimulus: `A student claims that the outcome for ${names[2]} exceeded the outcome for ${names[0]}.`, table,
      question: "Which choice most effectively uses data from the table to support the student's claim?",
      correct: `${names[2]}'s value was ${third}, which was ${difference} greater than ${names[0]}'s value of ${first}.`,
      distractors: [`${names[0]}'s value was ${difference} greater than ${names[2]}'s.`, `${names[1]}'s value was ${second}, which proves the two named groups were equal.`, `${names[2]}'s value was ${third - second} greater than ${names[0]}'s.`],
      explanation: `${third} − ${first} = ${difference}, so the correct choice reports both values and their difference accurately.`, parameters: { names, values, unit }
    });
  }

  function inferences(ctx) {
    const caseData = pick(ctx.rng, [
      {
        text: "A museum moved several light-sensitive textiles into cases fitted with new filters. Over the next year, color measurements changed less for those textiles than for similar textiles kept under the previous lighting system.",
        correct: "The new filters likely reduced a source of color fading.",
        distractors: ["The filtered textiles were made more recently.", "All color change can be prevented permanently.", "The previous lighting system used no electricity."]
      },
      {
        text: "Seedlings of one grass species grew equally well in two soil types when watered often. When watering was reduced, however, seedlings in the sandier soil grew substantially less.",
        correct: "Soil type affected the seedlings' growth more under limited water than under frequent watering.",
        distractors: ["The seedlings cannot grow in sandy soil.", "Frequent watering reduced growth in both soils.", "The two soil types held exactly the same amount of water."]
      },
      {
        text: "A novelist's early drafts describe a secondary character only briefly. In each later draft, scenes involving that character become longer, and the published version gives the character a decisive role in the ending.",
        correct: "The novelist increased the character's importance while revising the work.",
        distractors: ["The novelist removed the character before publication.", "The published ending is identical to the earliest draft.", "The character was based on a documented historical person."]
      },
      {
        text: "Two groups solved the same puzzles. One group received immediate information after each attempt; the other received all information at the end. The first group improved more rapidly during the session, but both groups performed similarly on a test one week later.",
        correct: "Immediate information aided short-term improvement but did not produce a clear long-term advantage in this study.",
        distractors: ["Delayed information prevented all learning.", "Immediate information guaranteed superior performance one week later.", "The groups solved different kinds of puzzles."]
      },
      {
        text: "After a city added protected bicycle lanes, bicycle counts rose on streets with the new lanes and on several nearby streets without them. Counts remained nearly unchanged in a distant comparison district.",
        correct: "The lane project may have influenced cycling beyond the streets where lanes were installed.",
        distractors: ["Cycling decreased on every street without a protected lane.", "The distant district had more protected lanes.", "The project eliminated all other forms of transportation."]
      }
    ]);
    const stem = ctx.difficulty === "Hard" ? "Which conclusion is best supported by the text?" : "Which choice is most strongly supported by the text?";
    return item(ctx, {
      recipe: "supported-inference", stimulus: `In observation set ${ctx.index + 1}, researchers documented the following pattern. ${caseData.text}`, question: stem, correct: caseData.correct,
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
        recipe: "meaning-in-context", stimulus: entry.text.replace("______", `“${entry.correct}”`),
        question: `As used in the text, what does “${entry.correct}” most nearly mean?`, correct: entry.reason,
        distractors: definitionDistractors[entry.correct],
        explanation: `In this context, “${entry.correct}” means ${entry.reason}. That meaning makes the sentence's logic coherent.`, parameters: { entry }
      });
    }
    return item(ctx, {
      recipe: "logical-precise-word", stimulus: entry.text,
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
        distractors: ["It gives an unrelated historical example.", "It repeats the first sentence without adding information.", "It proves that the initial result was fraudulent."],
        explanation: `Introduced by “However,” the second sentence limits the scope or strength of the positive first-sentence result.`, parameters: { caseData, year }
      });
    }
    const stimulus = `Researchers once assumed that a ${subject} would have little practical value. A ${year} evaluation found that it ${benefit}. The tests do not settle every question because ${limitation}, but they challenge the earlier assumption.`;
    return item(ctx, {
      recipe: "overall-purpose", stimulus, question: "Which choice best describes the overall purpose of the text?",
      correct: "To describe evidence that challenges an earlier view while acknowledging a limitation of that evidence",
      distractors: ["To prove that all earlier research was intentionally misleading", "To list instructions for reproducing the tests", "To argue that limitations make experimental evidence useless"],
      explanation: `The text contrasts an earlier assumption with new evidence and then qualifies that evidence; the correct choice captures all three moves.`, parameters: { caseData, year }
    });
  }

  function crossText(ctx) {
    const year = ctx.practiceSet === 2 ? 1975 + (ctx.index - 25) : 2000 + ctx.index;
    const caseData = pick(ctx.rng, [
      { topic: "remote work", benefit: "can widen access to some jobs", concern: "its benefits depend on workers having reliable technology" },
      { topic: "urban tree planting", benefit: "can reduce summer heat on shaded blocks", concern: "young trees require years of maintenance before providing full shade" },
      { topic: "museum digitization", benefit: "can widen access to fragile collections", concern: "digital images cannot preserve every physical feature of an object" },
      { topic: "wildlife corridors", benefit: "can connect previously separated animal populations", concern: "the locations of corridors strongly affect which species can use them" },
      { topic: "automated translation", benefit: "can make routine multilingual communication more efficient", concern: "specialized or culturally specific language may still require human review" }
    ]);
    const { topic, benefit, concern } = caseData;
    const text1 = `Text 1\nAn analysis published in ${year} argues that ${topic} ${benefit}. On this basis, the author recommends expanding the practice.`;
    const text2 = `Text 2\nA response to the ${year} analysis agrees that ${topic} ${benefit}, but emphasizes that ${concern}. The author recommends small trials before broad expansion.`;
    if (ctx.index % 2 === 0) {
      return item(ctx, {
        recipe: "agreement", stimulus: `${text1}\n\n${text2}`, question: "Based on the texts, both authors would most likely agree with which statement?",
        correct: `${topic[0].toUpperCase()}${topic.slice(1)} ${benefit}.`,
        distractors: [`${topic[0].toUpperCase()}${topic.slice(1)} should never be expanded.`, `Small trials have already resolved every uncertainty.`, `Implementation has no effect on outcomes.`],
        explanation: `Both texts explicitly recognize the stated benefit. They differ about how quickly or broadly to act on it.`, parameters: { caseData, year }
      });
    }
    return item(ctx, {
      recipe: "response", stimulus: `${text1}\n\n${text2}`, question: "How would the author of Text 2 most likely respond to Text 1's recommendation?",
      correct: `The recommendation may be justified eventually, but ${concern}, so limited trials should come first.`,
      distractors: ["The recommendation is based on a benefit that does not exist.", "The recommendation is too cautious because expansion should occur without testing.", "The recommendation concerns a completely different topic from Text 2."],
      explanation: `Text 2 accepts the possible benefit but adds a concern and favors trials before broad expansion.`, parameters: { caseData, year }
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
    const noteDetail = pick(ctx.rng, ["The student's source is a museum catalog.", "The student's source includes an archival photograph.", "The student is preparing a short presentation.", "The notes will be used in a biographical paragraph.", "The source was published by a university archive."]);
    const notes = `While researching a topic, a student has taken the following notes:\n• ${data.subject} worked in ${data.category}.\n• In ${data.year}, ${data.subject.split(" ").slice(-1)[0]} ${data.work}.\n• The work ${data.feature}.\n• ${noteDetail}`;
    const goal = ctx.index % 3 === 0 ? "emphasize the work's significance" : ctx.index % 3 === 1 ? "introduce the work and give its date" : "describe the subject's field and achievement";
    let correct;
    if (ctx.index % 3 === 0) correct = `${data.subject}'s work was significant because it ${data.feature}.`;
    else if (ctx.index % 3 === 1) correct = `In ${data.year}, ${data.subject} ${data.work}.`;
    else correct = `${data.subject}, a figure in ${data.category}, ${data.work}.`;
    return item(ctx, {
      recipe: "notes-to-goal", stimulus: notes, question: `The student wants to ${goal}. Which choice most effectively uses relevant information from the notes to accomplish this goal?`,
      correct,
      distractors: [`${data.year} was an important year, and ${data.category} is a broad field.`, `${data.subject} worked in ${data.category}; the notes do not identify any achievement.`, `${data.subject} ${data.work}, but the date and significance are unknown.`],
      explanation: `The correct choice selects accurate information from the notes that directly serves the stated goal; the other choices are irrelevant or contradict the notes.`, parameters: { data, goal, noteDetail }
    });
  }

  const TRANSITION_CASES = [
    { relation: "contrast", setup: "A replication study published in {year} compared two trials.", first: "The first trial produced a strong effect.", second: "the larger replication found almost no effect", correct: "However,", distractors: ["Similarly,", "Therefore,", "For example,"] },
    { relation: "result", setup: "An archive completed a preservation project in {year}.", first: "The archive digitized its most fragile documents.", second: "researchers can now examine the documents without handling the originals", correct: "Consequently,", distractors: ["Nevertheless,", "Meanwhile,", "For instance,"] },
    { relation: "example", setup: "A {year} biology article discusses drought tolerance.", first: "Some plants can survive long periods with little rainfall.", second: "the resurrection fern can lose most of its water and recover when rain returns", correct: "For example,", distractors: ["Instead,", "Likewise,", "Therefore,"] },
    { relation: "addition", setup: "A {year} report compares two manufacturing materials.", first: "The new material is lighter than the conventional material.", second: "it is less expensive to manufacture", correct: "Moreover,", distractors: ["In contrast,", "Nevertheless,", "Specifically,"] },
    { relation: "concession", setup: "In {year}, historians assessed a newly discovered set of letters.", first: "The letters do not settle who proposed the final design.", second: "they narrow the possible dates on which the decision was made", correct: "Even so,", distractors: ["For example,", "As a result,", "In other words,"] },
    { relation: "sequence", setup: "In {year}, a team prepared sensors for fieldwork.", first: "The team first calibrated each sensor.", second: "the researchers installed the sensors in the field", correct: "Next,", distractors: ["Instead,", "Nevertheless,", "For instance,"] }
  ];

  function transitions(ctx) {
    const transition = TRANSITION_CASES[ctx.index % TRANSITION_CASES.length];
    const year = ctx.practiceSet === 2 ? 1975 + (ctx.index - 25) : 2000 + ctx.index;
    const stimulus = `${transition.setup.replace("{year}", year)} ${transition.first} ______ ${transition.second}.`;
    return item(ctx, {
      recipe: transition.relation, stimulus, question: "Which choice completes the text with the most logical transition?", correct: transition.correct,
      distractors: transition.distractors,
      explanation: `The second sentence has a ${transition.relation} relationship to the first, and “${transition.correct.replace(",", "")}” signals that relationship.`, parameters: { transition, year }
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

  function boundaries(ctx) {
    const bank = ctx.difficulty === "Hard" ? BOUNDARY_HARD_CASES : ctx.difficulty === "Medium" ? BOUNDARY_MEDIUM_CASES : BOUNDARY_CASES;
    const entry = bank[ctx.index % bank.length];
    const year = ctx.practiceSet === 2 ? 1976 + (ctx.index - 25) : 2001 + ctx.index;
    return item(ctx, {
      recipe: entry.recipe, stimulus: `A report written in ${year} contains the following statement: ${entry.text}`, question: "Which choice completes the text so that it conforms to the conventions of Standard English?", correct: entry.correct,
      distractors: entry.distractors,
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
    return item(ctx, {
      recipe: entry.recipe, stimulus: `A document revised in ${year} contains the following sentence: ${entry.text}`, question: "Which choice completes the text so that it conforms to the conventions of Standard English?", correct: entry.correct,
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

  function buildSATRWQuestions(seed = "baseline-v1", options = {}) {
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
