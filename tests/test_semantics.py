from nlp_semantics.semantics import analyze_sentence


def test_negation_affects_polarity():
    analysis = analyze_sentence("The cat did not run.")
    assert analysis["polarity"] == "negative"


def test_subject_object_detection():
    analysis = analyze_sentence("Alice likes Bob.")
    assert analysis["subject"] == "Alice"
    assert analysis["object"] == "Bob"


def test_question_detection():
    analysis = analyze_sentence("Why did she leave?")
    assert analysis["sentence_type"] == "interrogative"
