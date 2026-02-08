# Computational Semantics Playground

This repository contains a rule-based NLP application that estimates sentence meaning
and explains how each word contributes to the overall semantics.

## Web app (React + Vite)

Start the React UI:

```bash
cd webapp
npm install
npm run dev
```

Open the UI at `http://localhost:5173`. The semantic analysis runs entirely in the browser.

### Deploying the UI on Netlify

1. Create a new Netlify site from this repo.
2. The included `netlify.toml` sets the base directory to `webapp`, the build command to
   `npm run build`, and the publish directory to `dist`.
3. Deploy! The app is self-contained and does not require a backend API.

A sample configuration is provided in `netlify.toml` (root) as well as `webapp/netlify.toml`.

## Output overview

The analyzer returns a structured dictionary containing:

- **Sentence type** (declarative/interrogative/exclamatory).
- **Polarity** and **modality** (negation, certainty, obligation, possibility).
- **Tense** and **temporal cues**.
- **Main predicate** with a naive subject/object guess.
- **Key topics** and **content words**.
- **Sentiment estimate** based on a small lexicon.
- **Word-by-word influence**, including a weight and description of each token's
  semantic impact.

## Limitations

This is a lightweight, interpretable baseline. It does not rely on external ML
models, so it is intentionally heuristic and conservative. You can extend the
lexicons and the heuristics in `webapp/src/semantics.js`.
