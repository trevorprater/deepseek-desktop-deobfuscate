# Harness UI Reference

A standalone React interface for an agent harness, with mock sessions, tool calls, approvals, and work panels. Use it as a visual reference when connecting a frontend to your own JSON-RPC backend.

![Running state](ui-reference/screenshots/running.png)

## Run

```sh
git clone --depth 1 https://github.com/trevorprater/harness-ui-reference.git
cd harness-ui-reference/ui-reference
pnpm install --frozen-lockfile
pnpm dev
```

The app runs entirely in the browser. No account, model, backend, or submodule setup is required. Dependency installation uses the npm registry.

## Give it to your coding agent

Start with [ui-reference/HANDOFF.md](ui-reference/HANDOFF.md). It describes the UI state model, adapter boundary, and acceptance criteria for connecting your harness.

- [Source](ui-reference/src/) — React components, styling, and mock data.
- [Production build](ui-reference/dist/) — static assets ready to serve over HTTP.
- [Screenshots](ui-reference/screenshots/) — desktop, narrow, light, dark, and operational states.
- [Package guide](ui-reference/README.md) — build commands and scenario URLs.

This is a visual prototype: local controls demonstrate states, while agent execution and backend operations remain mocked. The screenshots document the implemented reference, not a pixel-difference certification against another application.

Third-party copyright and license notices are preserved in [THIRD_PARTY_NOTICES.txt](ui-reference/public/THIRD_PARTY_NOTICES.txt) and included in the static build.
