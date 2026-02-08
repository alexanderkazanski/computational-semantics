const NEGATIONS = new Set([
  "not",
  "no",
  "never",
  "none",
  "nobody",
  "nothing",
  "neither",
  "nowhere",
  "hardly",
  "scarcely",
  "barely"
]);

const INTENSIFIERS = new Set([
  "very",
  "extremely",
  "really",
  "so",
  "too",
  "quite",
  "highly",
  "deeply",
  "utterly"
]);

const DIMINISHERS = new Set([
  "slightly",
  "somewhat",
  "a_bit",
  "barely",
  "hardly",
  "sort_of",
  "kind_of"
]);

const MODALITY = {
  must: "obligation",
  should: "recommendation",
  ought: "recommendation",
  may: "permission",
  might: "possibility",
  could: "possibility",
  can: "ability",
  will: "future",
  would: "conditional"
};

const TEMPORAL_CUES = {
  yesterday: "past",
  today: "present",
  tomorrow: "future",
  now: "present",
  currently: "present",
  soon: "future",
  later: "future",
  previously: "past",
  recently: "past"
};

const PRONOUNS = new Set([
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "their",
  "our"
]);

const DETERMINERS = new Set([
  "a",
  "an",
  "the",
  "this",
  "that",
  "these",
  "those",
  "each",
  "every",
  "some",
  "any",
  "no",
  "all",
  "most"
]);

const QUANTIFIERS = {
  all: "universal",
  every: "universal",
  each: "distributive",
  many: "plural",
  few: "small_amount",
  some: "existential",
  any: "open",
  several: "plural",
  most: "majority",
  none: "zero"
};

const QUESTION_WORDS = new Set(["who", "what", "when", "where", "why", "how", "which"]);

const SENTIMENT_POSITIVE = new Set([
  "happy",
  "joy",
  "love",
  "great",
  "excellent",
  "good",
  "wonderful",
  "amazing",
  "success",
  "positive"
]);

const SENTIMENT_NEGATIVE = new Set([
  "sad",
  "angry",
  "hate",
  "bad",
  "terrible",
  "awful",
  "horrible",
  "failure",
  "negative",
  "poor"
]);

const COMMON_VERBS = new Set([
  "be",
  "am",
  "is",
  "are",
  "was",
  "were",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "say",
  "make",
  "go",
  "get",
  "see",
  "know",
  "think",
  "take",
  "come",
  "give",
  "find",
  "tell",
  "work",
  "call",
  "try",
  "ask",
  "need",
  "feel",
  "become",
  "leave",
  "put",
  "mean",
  "keep",
  "let",
  "begin",
  "help",
  "talk",
  "turn",
  "like",
  "start",
  "show",
  "hear",
  "play",
  "run",
  "move",
  "live",
  "believe",
  "bring",
  "happen",
  "write",
  "provide",
  "sit",
  "stand",
  "lose",
  "pay",
  "meet",
  "include",
  "continue",
  "set",
  "learn",
  "change",
  "lead",
  "understand",
  "watch",
  "follow",
  "stop",
  "create",
  "speak",
  "read",
  "allow",
  "add",
  "spend",
  "grow",
  "open",
  "walk",
  "win",
  "teach"
]);

const ADJECTIVE_SUFFIXES = ["ous", "ful", "able", "ible", "al", "ive", "less", "ic", "ish"];
const ADVERB_SUFFIXES = ["ly"];
const VERB_SUFFIXES = ["ed", "ing", "en", "ify", "ise", "ize"];

const WORD_RE = /[A-Za-z']+|[0-9]+|[^\sA-Za-z0-9]/g;

const tokenize = (sentence) => {
  const matches = sentence.match(WORD_RE) ?? [];
  return matches.map((match, index) => ({
    text: match,
    lemma: match.toLowerCase().replace(/'/g, ""),
    index
  }));
};

const isContentWord = (lemma) =>
  /^[a-z]+$/.test(lemma) && !DETERMINERS.has(lemma) && !PRONOUNS.has(lemma);

const guessPos = (lemma) => {
  if (COMMON_VERBS.has(lemma)) return "verb";
  if (lemma.endsWith("s") && COMMON_VERBS.has(lemma.slice(0, -1))) return "verb";
  if (VERB_SUFFIXES.some((suffix) => lemma.endsWith(suffix))) return "verb";
  if (ADVERB_SUFFIXES.some((suffix) => lemma.endsWith(suffix))) return "adverb";
  if (ADJECTIVE_SUFFIXES.some((suffix) => lemma.endsWith(suffix))) return "adjective";
  if (DETERMINERS.has(lemma)) return "determiner";
  if (PRONOUNS.has(lemma)) return "pronoun";
  if (QUESTION_WORDS.has(lemma)) return "question_word";
  if (/^\d+$/.test(lemma)) return "number";
  if (!/^[a-z]+$/.test(lemma)) return "punctuation";
  return "noun";
};

const detectSentenceType = (tokens) => {
  if (tokens.some((token) => token.text === "?")) return "interrogative";
  if (tokens.some((token) => token.text === "!")) return "exclamatory";
  return "declarative";
};

const estimateTense = (tokens) => {
  if (tokens.some((token) => token.text.toLowerCase().endsWith("ed"))) return "past";
  if (tokens.some((token) => token.lemma === "will")) return "future";
  if (tokens.some((token) => ["was", "were", "had"].includes(token.lemma))) return "past";
  return "present";
};

const pickMainVerb = (tokens) => tokens.find((token) => guessPos(token.lemma) === "verb") ?? null;

const guessSubject = (tokens, verbIndex) => {
  if (verbIndex === null) return null;
  const candidates = tokens
    .slice(0, verbIndex)
    .filter((token) => ["noun", "pronoun"].includes(guessPos(token.lemma)));
  if (!candidates.length) return null;
  return candidates.slice(-2).map((token) => token.text).join(" ");
};

const guessObject = (tokens, verbIndex) => {
  if (verbIndex === null) return null;
  const candidates = tokens
    .slice(verbIndex + 1)
    .filter((token) => ["noun", "pronoun"].includes(guessPos(token.lemma)));
  if (!candidates.length) return null;
  return candidates.slice(0, 2).map((token) => token.text).join(" ");
};

const sentimentScore = (tokens) =>
  tokens.reduce((score, token) => {
    if (SENTIMENT_POSITIVE.has(token.lemma)) return score + 1;
    if (SENTIMENT_NEGATIVE.has(token.lemma)) return score - 1;
    return score;
  }, 0);

const sentimentLabel = (score) => {
  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
};

const collectTopics = (tokens) => {
  const topics = [];
  tokens.forEach((token) => {
    if (isContentWord(token.lemma) && /^[a-z]+$/.test(token.lemma)) {
      topics.push(token.lemma);
    }
  });
  return Array.from(new Set(topics));
};

const detectModality = (tokens) =>
  tokens.flatMap((token) => (MODALITY[token.lemma] ? [MODALITY[token.lemma]] : []));

const detectPolarity = (tokens) =>
  tokens.some((token) => NEGATIONS.has(token.lemma)) ? "negative" : "affirmative";

const temporalCues = (tokens) =>
  tokens.flatMap((token) => (TEMPORAL_CUES[token.lemma] ? [token.lemma] : []));

const quantifiers = (tokens) =>
  tokens.flatMap((token) => (QUANTIFIERS[token.lemma] ? [token.lemma] : []));

const wordInfluence = (tokens) =>
  tokens.map((token) => {
    const lemma = token.lemma;
    const pos = guessPos(lemma);
    let influence = "background";
    let weight = 0.2;

    if (isContentWord(lemma)) {
      influence = "content";
      weight = 1.0;
    }
    if (NEGATIONS.has(lemma)) {
      influence = "negation";
      weight = 1.4;
    }
    if (INTENSIFIERS.has(lemma)) {
      influence = "intensifier";
      weight = 1.2;
    }
    if (DIMINISHERS.has(lemma)) {
      influence = "diminisher";
      weight = 0.6;
    }
    if (QUANTIFIERS[lemma]) {
      influence = "quantifier";
      weight = 1.1;
    }
    if (MODALITY[lemma]) {
      influence = "modality";
      weight = 1.1;
    }

    return {
      token: token.text,
      lemma,
      index: token.index,
      pos_guess: pos,
      influence_type: influence,
      weight
    };
  });

export const analyzeSentence = (sentence) => {
  const tokens = tokenize(sentence);
  const mainVerb = pickMainVerb(tokens);
  const verbIndex = mainVerb ? mainVerb.index : null;
  const score = sentimentScore(tokens);

  return {
    sentence,
    sentence_type: detectSentenceType(tokens),
    polarity: detectPolarity(tokens),
    modality: detectModality(tokens),
    tense: estimateTense(tokens),
    temporal_cues: temporalCues(tokens),
    quantifiers: quantifiers(tokens),
    main_predicate: mainVerb ? mainVerb.text : null,
    subject: guessSubject(tokens, verbIndex),
    object: guessObject(tokens, verbIndex),
    topics: collectTopics(tokens),
    sentiment: {
      score,
      label: sentimentLabel(score)
    },
    word_influence: wordInfluence(tokens)
  };
};
