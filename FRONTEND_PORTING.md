# Porting the frontend to another JSON-RPC harness

If the goal is to reuse the visual design without inheriting the original runtime architecture, start with [`ui-reference/`](ui-reference/) and its [`HANDOFF.md`](ui-reference/HANDOFF.md). It is a flattened, backend-free React implementation of the shell and core states described below. Use this document when you need to trace a reference component back to the complete vendored source or preserve more of the original plugin graph.

## What is included

The complete editable application source is vendored under `upstream-source/`. The frontend is not just `apps/web`: it is a Cordis client plugin graph assembled from the Web shell plus packages under `packages/client`, browser halves under other package groups, shared protocol packages, and the desktop carrier.

The most useful starting points are:

| Surface | Location |
| --- | --- |
| Vite browser shell and boot | `upstream-source/apps/web/src` |
| Electron desktop main/preloads | `upstream-source/apps/desktop/src` |
| Electron-owned static renderers | `upstream-source/apps/desktop/renderer` |
| Shared UI primitives and tokens | `upstream-source/packages/client/ui-primitives`, `ui-theme` |
| Main layout/sidebar/conversation | `upstream-source/packages/client/ui-layout`, `ui-sidebar*`, `ui-conversation`, `ui-chat` |
| Session/client stores | `upstream-source/packages/client/ui-session`, `connection`, `store` |
| Browser RPC gateway | `upstream-source/packages/api/gateway`, `packages/api/remotes` |
| Client module loader | `upstream-source/packages/client/modules` |
| Host-side Web server/static delivery | `upstream-source/packages/host/webserver`, `frontend-static` |
| Session event vocabulary | `upstream-source/packages/core/session/src` |

`frontend-build/` contains the matching compiled browser and desktop artifacts, including source maps, so you can inspect the running form without rebuilding first.

## The important incompatibility

The browser frontend does **not** speak the SDK's stdio JSON-RPC protocol directly. It expects a Harness Host that:

1. Serves the Vite shell and a generated `__DSH_BOOT__` client-plugin manifest.
2. Serves individual or batched browser plugin bundles.
3. Exposes the Harness gateway/remotes transport used by the client stores.
4. Emits the Harness session-event and agent-status vocabulary consumed by the conversation, trajectory, tool, jobs, goal, workspace, and settings packages.

Your existing JSON-RPC harness therefore needs either a compatibility gateway or a thinner UI extraction. Do not try to point `frontend-build/web/index.html` at an arbitrary JSON-RPC URL and expect it to boot.

## Route A: preserve the full UI and write a compatibility gateway

Choose this when you want nearly all of the DeepSeek UI: workspaces, sessions, tool cards, trajectories, sidebars, settings, jobs, goals, plugins, and desktop behavior.

Keep the client plugin graph and replace the Host-facing layer:

1. Start at `packages/client/connection` and `packages/api/gateway/client`.
2. Implement a browser transport for your WebSocket or HTTP JSON-RPC endpoint.
3. Implement the remote methods consumed by the mounted UI packages. Search for `ctx.remotes` and generated client types to inventory them.
4. Translate your harness lifecycle notifications into the event types in `packages/core/session/src/types.ts` plus the agent status messages consumed by `packages/api/session-controller`.
5. Either keep the existing boot manifest/module endpoints or replace `packages/client/modules` with static imports from the UI packages you select.
6. Remove Host features you do not implement from the profile so their client plugins are never advertised.

This route minimizes React/CSS work but requires the broadest protocol adapter.

## Route B: reuse the design system and core conversation UI

Choose this when your JSON-RPC harness already owns sessions, tools, and settings and you mainly want the visual design.

Start with these packages:

- `ui-primitives` and `ui-theme` for controls, overlays, icons, typography, colors, spacing, radii, and light/dark behavior.
- `ui-layout` for the frame and pane composition.
- `ui-sidebar`, `ui-sidebar-right`, and `ui-sidebar-files` for navigation and secondary panels.
- `ui-conversation` and `ui-chat` for message composition, streaming presentation, and the composer.
- `ui-tool` for generic and specialized tool-call rows.
- `ui-trajectory` if your harness exposes detailed execution events.

Copy or import the React components and replace their Cordis service/store dependencies with your own hooks. This is usually less work than emulating every DeepSeek remote method.

## Minimal data translation

At minimum, a useful chat implementation needs normalized equivalents of:

- Session identity, title, creation/update time, and selected workspace.
- User and assistant messages with ordered content blocks.
- Streaming assistant chunks followed by a committed assistant message.
- Tool call identity, name, arguments, lifecycle state, result, and error.
- Whole-agent status such as running, waiting for input, idle, failed, or interrupted.
- Composer submission, attachment upload/reference, and optional approval/question requests.

Preserve stable ids across notifications. The DeepSeek UI stores and presenters assume that streaming frames settle into durable session events; if your protocol only emits ephemeral chunks, add a reducer in your adapter that produces committed messages/tool results.

## Practical first milestone

1. Build the vendored source with `node scripts/build-vendored-source.mjs`.
2. Run the unmodified Web profile to explore the UI and inspect its boot manifest.
3. Mount only theme, layout, sidebar, conversation, chat, and generic tool presentation in a reduced profile.
4. Implement your JSON-RPC connection and translate one session's messages/status/tool events.
5. Add the remaining panels only when your backend supports their remotes.

This sequence gets the design on screen without first reproducing the entire DeepSeek backend.

## License

DeepSeek Harness is MIT licensed; retain `upstream-source/LICENSE` and the notices in `upstream-source/THIRD_PARTY_NOTICES.md`. The separately vendored Office conversion kit is MPL-2.0 and is not required for a chat-only frontend.
