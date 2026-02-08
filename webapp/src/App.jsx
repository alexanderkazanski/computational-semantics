import { useMemo, useState } from "react";
import { analyzeSentence } from "./semantics.js";

const sampleSentence = "Every compiler optimizes the abstract syntax tree before code generation.";

export default function App() {
  const [sentence, setSentence] = useState(sampleSentence);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const wordInfluence = useMemo(() => {
    if (!analysis?.word_influence) return [];
    return analysis.word_influence;
  }, [analysis]);

  const runAnalysis = () => {
    setIsLoading(true);
    setError("");
    try {
      const payload = analyzeSentence(sentence);
      setAnalysis(payload);
    } catch (err) {
      setError(err.message || "Unexpected error.");
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Computational Semantics</p>
          <h1>Semantic Analyzer</h1>
          <p className="subtitle">
            Enter a sentence to see its estimated meaning and how each word
            shapes the overall semantics.
          </p>
        </div>
        <button className="primary" onClick={runAnalysis} disabled={isLoading}>
          {isLoading ? "Analyzing..." : "Analyze sentence"}
        </button>
      </header>

      <section className="panel">
        <label htmlFor="sentence">Sentence</label>
        <textarea
          id="sentence"
          value={sentence}
          onChange={(event) => setSentence(event.target.value)}
          rows={4}
        />
        <p className="hint">Runs entirely in the browser.</p>
      </section>

      {error && <div className="error">{error}</div>}

      {analysis && (
        <div className="grid">
          <section className="panel">
            <h2>Sentence meaning</h2>
            <dl className="summary">
              <div>
                <dt>Type</dt>
                <dd>{analysis.sentence_type}</dd>
              </div>
              <div>
                <dt>Polarity</dt>
                <dd>{analysis.polarity}</dd>
              </div>
              <div>
                <dt>Tense</dt>
                <dd>{analysis.tense}</dd>
              </div>
              <div>
                <dt>Modality</dt>
                <dd>{analysis.modality.length ? analysis.modality.join(", ") : "none"}</dd>
              </div>
              <div>
                <dt>Temporal cues</dt>
                <dd>
                  {analysis.temporal_cues.length
                    ? analysis.temporal_cues.join(", ")
                    : "none"}
                </dd>
              </div>
              <div>
                <dt>Quantifiers</dt>
                <dd>
                  {analysis.quantifiers.length
                    ? analysis.quantifiers.join(", ")
                    : "none"}
                </dd>
              </div>
              <div>
                <dt>Main predicate</dt>
                <dd>{analysis.main_predicate || "unknown"}</dd>
              </div>
              <div>
                <dt>Subject</dt>
                <dd>{analysis.subject || "unknown"}</dd>
              </div>
              <div>
                <dt>Object</dt>
                <dd>{analysis.object || "unknown"}</dd>
              </div>
              <div>
                <dt>Topics</dt>
                <dd>{analysis.topics.length ? analysis.topics.join(", ") : "none"}</dd>
              </div>
              <div>
                <dt>Sentiment</dt>
                <dd>
                  {analysis.sentiment.label} (score {analysis.sentiment.score})
                </dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <h2>Word influence</h2>
            <div className="table">
              <div className="table-row header">
                <span>Token</span>
                <span>POS</span>
                <span>Influence</span>
                <span>Weight</span>
              </div>
              {wordInfluence.map((item) => (
                <div key={`${item.token}-${item.index || item.lemma}`} className="table-row">
                  <span>{item.token}</span>
                  <span>{item.pos_guess}</span>
                  <span>{item.influence_type}</span>
                  <span>{item.weight}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
