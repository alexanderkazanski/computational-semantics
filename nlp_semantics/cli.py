"""Command-line interface for the semantic analyzer."""

from __future__ import annotations

import argparse
import json
import sys

from nlp_semantics.semantics import analyze_sentence, format_analysis


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Analyze sentence meaning and word-level semantic influence."
    )
    parser.add_argument("sentence", nargs="+", help="Sentence to analyze.")
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output raw JSON instead of formatted text.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    sentence = " ".join(args.sentence).strip()

    if not sentence:
        print("No sentence provided.", file=sys.stderr)
        return 2

    analysis = analyze_sentence(sentence)
    if args.json:
        print(json.dumps(analysis, indent=2))
    else:
        print(format_analysis(analysis))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
