# Agent Workbench UI Reference

This is a standalone, backend-free visual reference for an agent harness frontend. It intentionally does not import DeepSeek Harness, Cordis, the DeepSeek gateway, or any model/provider SDK.

The goal is to give another coding agent a small, legible React application that demonstrates the target shell and every important agent state without requiring a backend.

![Running state](screenshots/running.png)

Clone only this package:

```sh
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/trevorprater/deepseek-desktop-deobfuscate.git
cd deepseek-desktop-deobfuscate
git sparse-checkout set ui-reference
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

## Visual source

The geometry, density, surface hierarchy, token values, transcript rhythm, composer shape, and desktop shell proportions are based on the MIT-licensed source vendored in `../upstream-source/`. This standalone package has been flattened into ordinary React and CSS so it is understandable without the original runtime architecture.

See [HANDOFF.md](HANDOFF.md) for a copy-ready prompt and implementation acceptance criteria.
