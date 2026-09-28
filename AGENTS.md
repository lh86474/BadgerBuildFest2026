# Frontend Agent Instructions

## Goal

Build a polished, distinctive, production-quality interface.

The goal is not merely functional correctness. Visual hierarchy,
typography, spacing, responsiveness, interaction quality, and design
coherence are first-class requirements.

Read `DESIGN.md` before making visual changes.

---

## Design hierarchy

When design instructions conflict, use this priority:

1. Explicit user requirements
2. Existing product/design language in `DESIGN.md`
3. Existing project components and tokens
4. Project references/screenshots
5. Frontend design skills
6. General anti-pattern rules

Do not sacrifice an intentional product direction merely to satisfy a
generic anti-pattern rule.

---

## New interface workflow

When creating a new page or major interface:

1. Understand the product and primary user task.
2. Read `DESIGN.md`.
3. Inspect existing components and styles before creating new ones.
4. Establish the visual concept before implementation.
5. Use the frontend-design / taste skill for art direction.
6. Implement the interface.
7. Render the result in a browser.
8. Review responsive layouts.
9. Run Hallmark as a critique pass.
10. Run web-design-guidelines for usability/accessibility issues.
11. Fix meaningful findings.
12. Perform a final visual polish pass.

Do not run multiple creative-direction skills independently and combine
their outputs. Choose one primary direction and maintain it.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
