# Bask Health technical interview preparation

[Open the interview sprint](https://omarradwann.github.io/under-the-hood/interview/).

This is a reusable three-session preparation routine with a role lens based on [Bask Health's public senior frontend posting](https://jobs.bask.health/careers/53FE701745). The scenarios are authored preparation inferred from that role, not confirmed interview questions or a claim about the employer's scoring. Set your own interview date in the browser-local workspace.

## Use the next three study sessions

The app supplies a 120-minute core for each session and optional extensions for 180/240-minute budgets. Change the target date and budget in the app. Calendar dates use the browser's local calendar.

1. **Session 1 — JavaScript and problem solving.** Solve pair sum and the unique-window problem without loading a reference. Clarify the input domain, trace a counterexample, state the invariant, then explain time and space. Predict promise/timer ordering and rehearse how obsolete requests lose commit authority.
2. **Session 2 — React and browser behavior.** Explain snapshots, effect cleanup, keys, and external-store identity. Implement LRU. Diagnose an interaction using browser evidence, and discuss form submission, focus, and error recovery.
3. **Session 3 — End-to-end design and a mock.** Trace a booking/rescheduling request from a form through validation, tenant policy, an authoritative write, reconciliation, and operations. Run the 60-minute practice mock. Prepare two true, anonymized ownership stories with your contribution, evidence, tradeoff, and learning.
4. **Interview day — 30-minute warm-up.** Retrieve one familiar solution, revisit the mistake log and two stories, check the call/editor setup, and leave a buffer before the interview. Do not treat the full lesson library as a last-minute checklist.

If fewer than three preparation days remain, prioritize two coding patterns, the query-race explanation, one end-to-end design, and a mock. Remove optional extensions first.

## A repeatable live-coding loop

1. Restate inputs/outputs, constraints, mutation policy, and ambiguous behavior. Ask whether tools or AI are permitted in this round.
2. Trace a small normal example and a boundary case.
3. Explain the straightforward approach, then the data structure and invariant behind an improvement.
4. Implement in small steps while explaining decisions. Make uncertainty explicit.
5. Test empty, duplicate, boundary, failure, and ownership cases appropriate to the contract.
6. Defend time/space with its assumptions, then explain an alternative and its cost.

The eight executable drills cover lookup maps, sliding windows, binary search, interval coalescing, iterative DFS, LRU, bracket stacks, and topological ordering. Each has four visible checks, an intentionally broken starter, a reference, reasoning, and lesson links. Cases do not automatically establish complexity or correctness for every input.

## Rehearse senior explanations

The 25 prompts span JavaScript, TypeScript, React, browser behavior, Next.js, typed API boundaries, caching, concurrency, architecture, delivery, and accountable AI use. Speak for 3–5 minutes, write a brief outline, then disclose the discussion guide. Defend its follow-up questions and challenge the listed misleading claims.

Self-ratings distinguish inability to explain, partial reasoning, a clear mechanism with edge cases, and defended tradeoffs/verification. A consulted guide remains labeled. Ratings are personal reflection, not an automated employer evaluation.

For a concise technical answer, connect **trigger → mechanism → chosen fix → tradeoff → verification**. For a project story, connect **context → your responsibility → action and reasoning → observed result → learning**. Use real evidence; do not invent metrics.

## Role-specific judgment

- Follow one feature across React/Next.js, typed transport, runtime input validation, SQL/ORM behavior, and production recovery.
- Keep tenant/resource authorization and representation scope explicit. Shared types and hidden UI controls do not establish authority.
- Explain pending versus confirmed state, retry ambiguity, cache ownership, accessibility, and failure recovery.
- Discuss how you review AI-assisted code using independent contracts and real boundary evidence. The posting's AI workflow does not imply that AI is permitted during the interview.
- The posting mentions Prisma and also lists Drizzle in requirements. Prepare the underlying data guarantees and confirm concrete team choices.

The interactive six-boundary walkthrough is conceptual. This static site does not run a production booking backend. Notes, practice flags, ratings, and the mistake log are browser-local and exportable; simultaneous edits to the same item remain last-write-wins. Timers are session-only, so keep the interview page open and use a separate coding tab.
