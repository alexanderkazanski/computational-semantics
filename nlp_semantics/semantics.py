"""Semantic analysis engine."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterable

from nlp_semantics import lexicon

WORD_RE = re.compile(r"[A-Za-z']+|[0-9]+|[^\sA-Za-z0-9]")


@dataclass(frozen=True)
class Token:
    text: str
    lemma: str
    index: int


def tokenize(sentence: str) -> list[Token]:
    matches = WORD_RE.findall(sentence)
    tokens = []
    for index, match in enumerate(matches):
        lemma = match.lower()
        lemma = lemma.replace("'", "")
        tokens.append(Token(text=match, lemma=lemma, index=index))
    return tokens


def _is_content_word(lemma: str) -> bool:
    return lemma.isalpha() and lemma not in lexicon.DETERMINERS and lemma not in lexicon.PRONOUNS


def _guess_pos(lemma: str) -> str:
    if lemma in lexicon.COMMON_VERBS:
        return "verb"
    if lemma.endswith("s") and lemma[:-1] in lexicon.COMMON_VERBS:
        return "verb"
    if lemma.endswith(lexicon.VERB_SUFFIXES):
        return "verb"
    if lemma.endswith(lexicon.ADVERB_SUFFIXES):
        return "adverb"
    if lemma.endswith(lexicon.ADJECTIVE_SUFFIXES):
        return "adjective"
    if lemma in lexicon.DETERMINERS:
        return "determiner"
    if lemma in lexicon.PRONOUNS:
        return "pronoun"
    if lemma in lexicon.QUESTION_WORDS:
        return "question_word"
    if lemma.isdigit():
        return "number"
    if not lemma.isalpha():
        return "punctuation"
    return "noun"


def _detect_sentence_type(tokens: Iterable[Token]) -> str:
    if any(token.text == "?" for token in tokens):
        return "interrogative"
    if any(token.text == "!" for token in tokens):
        return "exclamatory"
    return "declarative"


def _estimate_tense(tokens: list[Token]) -> str:
    lemmas = [token.lemma for token in tokens]
    if any(token.text.lower().endswith("ed") for token in tokens):
        return "past"
    if any(lemma == "will" for lemma in lemmas):
        return "future"
    if any(lemma in ("was", "were", "had") for lemma in lemmas):
        return "past"
    return "present"


def _pick_main_verb(tokens: list[Token]) -> Token | None:
    for token in tokens:
        if _guess_pos(token.lemma) == "verb":
            return token
    return None


def _guess_subject(tokens: list[Token], verb_index: int | None) -> str | None:
    if verb_index is None:
        return None
    candidates = [token for token in tokens[:verb_index] if _guess_pos(token.lemma) in {"noun", "pronoun"}]
    if candidates:
        return " ".join(token.text for token in candidates[-2:])
    return None


def _guess_object(tokens: list[Token], verb_index: int | None) -> str | None:
    if verb_index is None:
        return None
    candidates = [token for token in tokens[verb_index + 1 :] if _guess_pos(token.lemma) in {"noun", "pronoun"}]
    if candidates:
        return " ".join(token.text for token in candidates[:2])
    return None


def _sentiment_score(tokens: list[Token]) -> int:
    score = 0
    for token in tokens:
        lemma = token.lemma
        if lemma in lexicon.SENTIMENT_POSITIVE:
            score += 1
        if lemma in lexicon.SENTIMENT_NEGATIVE:
            score -= 1
    return score


def _sentiment_label(score: int) -> str:
    if score > 0:
        return "positive"
    if score < 0:
        return "negative"
    return "neutral"


def _collect_topics(tokens: list[Token]) -> list[str]:
    topics = []
    for token in tokens:
        if _is_content_word(token.lemma) and token.lemma.isalpha():
            topics.append(token.lemma)
    return list(dict.fromkeys(topics))


def _modality(tokens: list[Token]) -> list[str]:
    modalities = []
    for token in tokens:
        if token.lemma in lexicon.MODALITY:
            modalities.append(lexicon.MODALITY[token.lemma])
    return modalities


def _polarity(tokens: list[Token]) -> str:
    if any(token.lemma in lexicon.NEGATIONS for token in tokens):
        return "negative"
    return "affirmative"


def _temporal_cues(tokens: list[Token]) -> list[str]:
    cues = []
    for token in tokens:
        if token.lemma in lexicon.TEMPORAL_CUES:
            cues.append(token.lemma)
    return cues


def _quantifiers(tokens: list[Token]) -> list[str]:
    quantifiers = []
    for token in tokens:
        if token.lemma in lexicon.QUANTIFIERS:
            quantifiers.append(token.lemma)
    return quantifiers


def _word_influence(tokens: list[Token]) -> list[dict[str, object]]:
    influences = []
    for token in tokens:
        lemma = token.lemma
        pos = _guess_pos(lemma)
        influence = "background"
        weight = 0.2
        if _is_content_word(lemma):
            influence = "content"
            weight = 1.0
        if lemma in lexicon.NEGATIONS:
            influence = "negation"
            weight = 1.4
        if lemma in lexicon.INTENSIFIERS:
            influence = "intensifier"
            weight = 1.2
        if lemma in lexicon.DIMINISHERS:
            influence = "diminisher"
            weight = 0.6
        if lemma in lexicon.QUANTIFIERS:
            influence = "quantifier"
            weight = 1.1
        if lemma in lexicon.MODALITY:
            influence = "modality"
            weight = 1.1
        influences.append(
            {
                "token": token.text,
                "lemma": lemma,
                "index": token.index,
                "pos_guess": pos,
                "influence_type": influence,
                "weight": weight,
            }
        )
    return influences


def analyze_sentence(sentence: str) -> dict[str, object]:
    tokens = tokenize(sentence)
    main_verb = _pick_main_verb(tokens)
    verb_index = main_verb.index if main_verb else None
    sentiment_score = _sentiment_score(tokens)
    analysis = {
        "sentence": sentence,
        "sentence_type": _detect_sentence_type(tokens),
        "polarity": _polarity(tokens),
        "modality": _modality(tokens),
        "tense": _estimate_tense(tokens),
        "temporal_cues": _temporal_cues(tokens),
        "quantifiers": _quantifiers(tokens),
        "main_predicate": main_verb.text if main_verb else None,
        "subject": _guess_subject(tokens, verb_index),
        "object": _guess_object(tokens, verb_index),
        "topics": _collect_topics(tokens),
        "sentiment": {
            "score": sentiment_score,
            "label": _sentiment_label(sentiment_score),
        },
        "word_influence": _word_influence(tokens),
    }
    return analysis


def format_analysis(analysis: dict[str, object]) -> str:
    lines = ["Semantic Analysis"]
    lines.append("=" * 18)
    lines.append(f"Sentence: {analysis['sentence']}")
    lines.append(f"Type: {analysis['sentence_type']}")
    lines.append(f"Polarity: {analysis['polarity']}")
    lines.append(f"Modality: {', '.join(analysis['modality']) or 'none'}")
    lines.append(f"Tense: {analysis['tense']}")
    lines.append(f"Temporal cues: {', '.join(analysis['temporal_cues']) or 'none'}")
    lines.append(f"Quantifiers: {', '.join(analysis['quantifiers']) or 'none'}")
    lines.append("Predicate/Arguments:")
    lines.append(f"  Main verb: {analysis['main_predicate'] or 'unknown'}")
    lines.append(f"  Subject: {analysis['subject'] or 'unknown'}")
    lines.append(f"  Object: {analysis['object'] or 'unknown'}")
    lines.append(f"Topics: {', '.join(analysis['topics']) or 'none'}")
    sentiment = analysis["sentiment"]
    lines.append(f"Sentiment: {sentiment['label']} (score {sentiment['score']})")
    lines.append("\nWord influence:")
    for item in analysis["word_influence"]:
        lines.append(
            "  - {token} ({pos_guess}): {influence_type} (weight {weight})".format(**item)
        )
    return "\n".join(lines)
