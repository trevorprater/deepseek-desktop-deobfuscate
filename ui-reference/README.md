# Harness UI Reference

This is a standalone visual reference for an agent harness frontend. It uses React, local mock data, and plain CSS, with no model, provider, account, or backend connection.

The goal is to give another coding agent a small, legible React application that demonstrates the target shell and every important agent state without requiring a backend.

![Running state](screenshots/running.png)

Clone and open the UI package:

```sh
git clone --depth 1 https://github.com/trevorprater/harness-ui-reference.git
cd harness-ui-reference/ui-reference
```

## Run it

```sh
pnpm install
pnpm dev
```

Production build:

```sh
pnpm build
pnpm preview
```

The committed `dist/` directory is a static build. Serve it over HTTP; opening `index.html` directly is not guaranteed to work in every browser.

## Visual states

Use the **Visual state** selector in the conversation header or set the query parameter directly:

- `?scenario=empty`
- `?scenario=running`
- `?scenario=approval`
- `?scenario=success`
- `?scenario=error`

The reference also includes cosmetic interactions for sidebar collapse, theme, work-panel tabs, transcript disclosures, tool-call accordions, approval choices, composer modes, and settings.

## Porting boundary

`src/model.ts` defines the small UI-facing vocabulary. `UiReferenceAdapter` is deliberately generic and is the only interface a real implementation needs to replace with its JSON-RPC client.

The reference models these normalized concepts:

- Threads/workspaces
- User and assistant messages
- Streaming/running state
- Tool calls and results
- Approval requests and decisions
- Recoverable connection failures
- Side-panel resources such as diffs, terminals, and files

Do not copy mock timers or hard-code scenario switching into production. Replace `mockData.ts` with selectors over your adapter's normalized event store.

## Visual reference and attribution

The application expresses its geometry, colors, typography, transcript rhythm, and composer layout in ordinary React and CSS. Screenshots cover the implemented reference states; they do not establish pixel-perfect equivalence to another application.

Required attribution for the styling and bundled React runtime is retained in [THIRD_PARTY_NOTICES.txt](public/THIRD_PARTY_NOTICES.txt), which is also copied into the production build.

See [HANDOFF.md](HANDOFF.md) for a copy-ready prompt and implementation acceptance criteria.
