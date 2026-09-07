# TRND.fun repository instructions

## Identity

- The current product name is **TRND.fun** and the platform token is **TRND**.
- “ViralTerminal” is a historical name that remains in some repository paths, filenames, commit history, and the legacy repository slug. Do not restore it in product-facing copy or branding.
- Read `CODEX_HANDOFF.md` before planning or editing.

## Locked UI

- Approved reference: `https://trnd-fun-brand-preview.gofivahootan.chatgpt.site/live`
- Exact preserved source: branch `backup/trnd-brand-preview-exact-20260907`, commit `c2187ff92319caea5a52156885babe020f6abedf`.
- Develop from current `main`; use the backup only as a visual oracle.
- Do not merge the backup wholesale or copy its `.openai/hosting.json` into another deployment.
- Preserve routes, layouts, component hierarchy, responsive behavior, typography, spacing, visual tokens, and core interactions.
- UI changes require a real functional, data-state, accessibility, or integration reason. Major redesign requires explicit user approval.

## Workflow

- Fetch current `origin/main` and inspect recent history before editing.
- Work on a feature branch; do not write directly to `main`.
- Preserve unrelated user changes and both backup branches.
- Repository code, confirmed deployment manifests, and reproducible tests override stale prose.
- Before merge or deployment, report changed files, tests, security implications, blockers, and the PR.

## Safety

- Never expose or commit keys, seeds, provider tokens, RPC secrets, or credentials.
- Never place secrets in `NEXT_PUBLIC_*`.
- Treat previously shared Bright Data and 6551 credentials as exposed and require rotation.
- Keep keeper disabled and dry-run by default.
- Never use `TestnetEthQuoteAdapter` on mainnet.
- No mainnet or real funds without independent audit, multisigs, operational controls, and explicit user approval.
- Keep buyback/burn manual and multisig-controlled.
- Use bigint/integer arithmetic for canonical accounting.

## Product invariants

- V1 uses one pair per launched token; multi-pair is V2.
- A Signal may produce multiple launches.
- Do not add event attestation or one-event-one-launch enforcement to contracts.
- Production must use independent TRND.fun contracts and validated routing, not the o1 API.
