# Reusing DeepSeek Harness in another harness

## Result

Use the readable, fully vendored source in `upstream-source/`, not the minified marketing page or the Electron renderer. No DeepSeek Git remote or submodule is needed after cloning this repository. DeepSeek publishes the Harness as an MIT-licensed Cordis plugin tree. The downloaded desktop release is version `0.2.0-rc.2`, and its shell/runtime has been mapped back to the source with no unexplained first-party file differences; see `analysis/SUMMARY.md`.

The recommended integration boundary is the subprocess JSON-RPC SDK. It keeps Harness session lifecycle, tools, plugins, and persistence intact while your other harness remains the supervisor. Profile patches are the next layer for replacing providers, tools, policy, storage, or UI pieces. Directly importing internal packages is possible, but these APIs are still pre-stable and tightly coupled across the workspace.

## Option 1: TypeScript subprocess bridge

The high-level `DeepSeekHarness` client launches `dsh --profile sdk`, performs a bounded initialize handshake, queues prompts, streams notifications, and returns the last committed response after the agent becomes idle.

From published packages:

```sh
npm install @deepseek-ai/dsh@0.2.0-rc.2 @deepseek-ai/dsh-sdk-client@0.2.0-rc.2
```

The local runnable example uses the built checkout instead:

```sh
export DEEPSEEK_API_KEY='your credential'
export DSH_BRIDGE_WORKSPACE='/absolute/path/to/the/workspace'
export DSH_BRIDGE_HOME='/absolute/path/to/an/isolated-dsh-home'
node examples/typescript-sdk-bridge.mjs 'Inspect the repository and summarize its architecture.'
```

The bridge inherits the parent environment so the selected model provider can read its credential. Use an isolated `DSH_BRIDGE_HOME` per product/test environment: it owns profiles, plugins, settings, credentials, and durable sessions. Reuse a session id only when you intentionally want to continue the same conversation.

For stricter process isolation, pass a complete scrubbed `env` to `DeepSeekHarness`; when `env` is supplied, it replaces the inherited environment rather than merging with it.

## Option 2: Python SDK

The published Python package includes a matching native runtime and does not require a system Node.js for normal SDK execution:

```sh
python -m venv .venv
. .venv/bin/activate
python -m pip install deepseek-harness-sdk
python upstream-source/python/sdk/examples/minimal.py \
  --workspace /absolute/path/to/a/disposable-workspace \
  --dsh-home /absolute/path/to/an/isolated-dsh-home \
  --session-id integration-001 \
  'Inspect the repository and summarize its architecture.'
```

Use `profile="sdk"` for the normal Harness composition or `profile="sdk-minimal"` for the deliberately small shell-and-session runtime. The full Python contract is in `upstream-source/python/sdk/README.md`.

## Option 3: Mount your behavior as a plugin

Harness is built on Cordis: services, tools, model adapters, session persistence, the agent loop, the Web host, and UI contributions are all plugins. A supported application is a named profile plus ordered patch layers.

For a one-run overlay:

```sh
cd upstream-source
DSH_HOME=/absolute/path/to/an/isolated-dsh-home \
  pnpm dsh web --no-open --patch /absolute/path/to/your.cordis.patch.yml
```

For persistent installation:

```sh
DSH_HOME=/absolute/path/to/an/isolated-dsh-home \
  pnpm dsh plugin --profile web add file:/absolute/path/to/your-plugin-bundle
```

Profile layers apply in this order: shipped bundles, the profile patch, the home patch, then command-line `--patch` files. A patch targets a row by id or inserts new rows. `pnpm dsh --profile web --dump-config` prints the fully composed tree.

Useful source seams:

| Need | Source package |
| --- | --- |
| Sessions and durable events | `packages/core/session` |
| Agent interface and default loop | `packages/core/agent`, `packages/core/agent-loop` |
| Tool registry and execution pipeline | `packages/core/tools` |
| LLM adapter interface/providers | `packages/llm/llm`, `packages/llm/*` |
| System-prompt assembly | `packages/core/system-prompt` |
| Filesystem and shell providers | `packages/fs/*`, `packages/shell/*`, `packages/subprocess/*` |
| JSON-RPC integration | `packages/sdk/client`, `packages/sdk/server`, `packages/sdk/protocol` |
| Application compositions | `packages/bundle/*` |
| Desktop carrier | `apps/desktop`, `apps/desktop-host` |
| Browser application | `apps/web`, `packages/client/*` |

Read `upstream-source/docs/architecture.md` before changing package behavior and `upstream-source/docs/cookbook/extension-cookbook.md` before adding a capability.

## Build and verify the local source

The pinned toolchain is Node.js `^22.19 || >=24` and pnpm `11.7.0`:

```sh
node scripts/build-vendored-source.mjs
cd upstream-source
pnpm dsh --help
```

The wrapper supplies the original seven-character source commit because the vendored directory intentionally has no nested Git metadata. The official build profile embeds the public version, title, and source commit. Client CSS-module tokens are path-derived, so release-machine and local builds can differ in those tokens while their readable source and behavior remain identical.

Focused SDK verification:

```sh
cd upstream-source
pnpm exec vitest run \
  packages/sdk/client/tests/launch.spec.ts \
  packages/sdk/client/tests/sdk-client.spec.ts
```

Re-run the distribution audit after rebuilding:

```sh
node scripts/analyze-distribution.mjs
```

## What is raw versus readable

- `original/site/` is a generated capture of the public page resources and is intentionally gitignored.
- `deobfuscated/site/` is a generated formatted copy of the JavaScript/CSS/HTML; formatting does not recover original identifier names.
- `deobfuscated/app-asar/` is the generated unpacked distribution and is intentionally gitignored.
- `upstream-source/` is the preferred source-form reconstruction: original TypeScript, React, Python, native C/C++, configs, tests, docs, and source maps.

The signed app embeds build commit `5e9e301`, while the public release tag resolves to `639ed015…`. This is build metadata, not an unexplained code delta: the audit normalizes that seven-character badge plus release-path-derived CSS tokens, and every remaining first-party difference is classified as release manifest rewriting, signing, or generated release records.

## Compatibility and licensing

`0.2.0-rc.2` is a developer preview and explicitly permits breaking API changes. Pin the version and source commit in the consuming harness, keep the SDK process boundary narrow, and re-run the audit before upgrading.

DeepSeek Harness is MIT licensed. The separately published LibreOffice kit is MPL-2.0 and its native engine carries additional LibreOffice notices. The extracted distribution also contains third-party packages under their own licenses; retain `LICENSE` and `THIRD_PARTY_NOTICES.md` materials when redistributing.
