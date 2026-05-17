# AlignBench v0 — controlled recall benchmark + falsified pronoun-rewrite fix

Adds `benchmarks/alignbench/` to the SDK: a 60-query / 55-fact controlled
benchmark for embedding-based recall, with a runner that ablates four
candidate fixes against the current Xenova/all-MiniLM-L6-v2 default.

## Why

Three observed failure modes share one signature:

1. **Partner demo** (atomicmem.filecoin.cloud): "what is my name?" returns no
   recall; "what is the user's name?" returns the same fact at cosine 0.51.
2. **LMME-S full n=500** (sprint 5): 31% of failures were "I don't have info"
   refusals when the answer text was in the haystack.
3. **BEAM Knowledge-Update**: retrieval pulls the keyword-matching chunk
   instead of the freshest one.

Each was filed as a benchmark-specific quirk. AlignBench tests whether
they're one phenomenon — and which fix actually closes the gap.

## Pre-registered hypothesis (and outcome)

Before running, I committed in writing:

> If query-side pronoun rewriting (my → the user's) doesn't lift r@5 by ≥0.25
> over baseline, the pronoun hypothesis is wrong and we look at extraction
> quality instead.

Result: query-rewrite r@5 lift = **0.000** (0.933 vs 0.933 baseline).
**Hypothesis falsified.** The diagnostic story I posted earlier — "fix it in
the SDK recall path with a pronoun rewrite" — does not survive contact with a
controlled benchmark.

This is exactly what pre-registration is for.

## What actually wins

| Variant | r@1 | r@5 | distractor_top1 | fp@control |
|---|---:|---:|---:|---:|
| baseline (current SDK) | 0.733 | 0.933 | 0.067 | 0.000 |
| **baseline, clean pool (no extraction meta-facts)** | **0.767** | **0.950** | 0.000 | 0.000 |
| query-rewrite | 0.733 | 0.933 | 0.083 (worse) | 0.000 |
| dual-storage | 0.783 | 0.933 | 0.067 | 0.000 |
| hybrid BM25 + semantic | 0.617 | 0.917 | 0.067 | **1.000** ← broken |
| combined (rewrite + BM25) | 0.650 | 0.933 | 0.083 | 1.000 |

The dominant fixable lift is **upstream of retrieval** — stopping the extractor
from emitting meta-facts like `The user asked for the user's name.` and
`As of <date>, X is a term mentioned in the conversation.`. Those poison the
embedding neighborhood for every adjacent query.

## What this PR contains

- `benchmarks/alignbench/items.json` — 55 facts, 60 scored queries, 10
  controls, across 4 variation axes (pronoun, temporal, specificity,
  negation) plus an extraction-style distractor pool observed in the partner
  demo.
- `benchmarks/alignbench/run.mjs` — standalone Node runner using
  `@huggingface/transformers` (same model as SDK). No Postgres, no network,
  no SDK dependencies. Each variant produces a directly-comparable run JSON.
- `benchmarks/alignbench/runs/*.json` — all 5 variant runs committed for
  diff-ability.
- `benchmarks/alignbench/RESULTS.md` — full per-axis breakdown, ablation
  table, per-item failure analysis on the temporal axis, recommendations.
- `benchmarks/alignbench/README.md` — what it is, how to read it, what's out
  of scope.

## What this PR does NOT contain (deliberately)

No SDK code change. Two reasons:

1. The pre-registered hypothesis was falsified, so the proposed fix (query
   rewrite) doesn't earn a code change.
2. The actual leverage is in core's extraction prompt and the temporal-state
   layer, neither of which is owned by this PR. Follow-up issues filed for
   both.

## Recommendations (filed as follow-up issues)

| # | Where | What | Priority |
|---|---|---|---|
| 1 | core | Filter meta-facts at extraction time (drop `The user (asked\|is\|requested\|said).*` etc.) | high — biggest single lift |
| 2 | SDK | Expose `EXTRACTION_PROMPT` as a configurable surface (Ethan flagged Slack-side) | high — enables (1) for design partners |
| 3 | core/SDK | Wire core's temporal-state layer (`temporal-classifier`, `temporal-rerank`) into SDK retrieval path for time-anchored queries | medium — only fix that addresses the temporal-axis structural gap |
| 4 | SDK | Opt-in `RECALL_DUAL_STORAGE=true` for first-person-heavy workloads | low — +0.05 r@1 but 2× store size |
| 5 | — | Skip BM25 hybrid unless we ship a control-set-aware weight schedule | not recommended in this form |

## Honest limits

- n=60 is small. Treat ±0.05 r@1 differences as within-noise.
- Distractor pool is hand-curated from observed SDK output. A pool sampled
  from the live partner Postgres would be the gold version.
- Single embedding model tested in default. The mpnet ablation is one data
  point, not a sweep.
- AlignBench is a diagnostic instrument, not a leaderboard.
