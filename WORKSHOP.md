# Engineering workshop

Open [`/workshop/`](https://omarradwann.github.io/under-the-hood/workshop/) for general developer practice. The workshop connects the curriculum to three learning tracks, eight executable coding patterns with 32 behavioral checks, 25 technical discussions, and a six-boundary system-design walkthrough.

## Build evidence

1. State the input/output contract and ownership assumptions.
2. Trace a small example and select a data structure or invariant.
3. Implement on the coding bench, inspect the checks, and investigate counterexamples.
4. Explain correctness, complexity, failure modes, and what remains unverified.

The discussions include a writing area, optional reasoning guides, follow-up questions, claims to challenge, and links to the relevant lessons. Self-ratings distinguish incomplete reasoning from an explanation with tradeoffs and verification. They are reflection aids, not an objective assessment.

The system-design walkthrough traces UI intent, typed transport, tenant policy, an atomic write, reconciliation, and operation. It is conceptual: the static site does not execute a production backend. Real database concurrency, authorization, deployment, and recovery require integration evidence in the application being built.

## Local records

Learning flags, explanations, guide-consulted labels, self-ratings, and a learning log remain in the browser. Export them as JSON with **Export learning notes**. No account or external execution service is needed.

Existing learning notes and coding drafts are read through compatibility aliases. The current workshop state and exports contain learning records only. Old private planning metadata is ignored. Concurrent browser writes remain last-write-wins; export important notes before clearing browser data.

All twenty training reference solutions pass their 78 listed behavioral checks, and every intentionally broken starter fails at least one check. Passing those cases does not prove correctness for all inputs or certify mastery. Compare implementations with their stated contracts and seek additional evidence where the assumptions change.
