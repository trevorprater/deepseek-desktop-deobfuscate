# Coding-agent handoff

## Objective

Port the standalone visual reference in this directory into our existing JSON-RPC agent harness frontend. Preserve the visual design and interaction grammar while replacing deterministic mock state with our actual protocol and stores.

## Constraints

- Keep the frontend independent of any external agent runtime or provider SDK.
- Connect it to our existing backend through its JSON-RPC interface.
- Keep our existing JSON-RPC method names, authentication, lifecycle, and persistence ownership.
- Treat `src/model.ts` as a UI-facing normalization boundary, not as a required wire protocol.
- Preserve drafts, selected workspace, open side-panel tab, expanded tool rows, and pending decisions across route/state updates.
- Keep all icon buttons keyboard reachable and labeled.

## Suggested implementation order

1. Copy the design tokens and shell geometry from `src/styles.css` into our design system.
2. Port the sidebar, conversation header, transcript column, composer, and right work panel as layout-only components.
3. Create a normalized event store for messages, assistant stream deltas, tool calls/results, approvals, run status, and errors.
4. Implement `UiReferenceAdapter` against our JSON-RPC client or map its concepts into our existing query/store layer.
5. Replace `mockData.ts` and scenario branches with selectors over normalized state.
6. Wire composer Send/Stop/Queue/Retry modes to actual capabilities and preserve the draft until durable receipt.
7. Wire transcript tool accordions and approval decisions with stable call/request ids.
8. Wire side-panel resources by stable file/terminal/artifact ids.
9. Delete the visual-state picker and other reference-only labels after every production state has an automated fixture or test.

## Required visual states

- Empty/new session with starter prompts.
- Active turn with live status and a running tool.
- Blocking approval request with allow and deny paths.
- Completed answer with reasoning summary, successful tools, Markdown, code, and message actions.
- Recoverable transport failure retaining prior output and draft.
- Sidebar expanded/collapsed.
- Right panel open/closed with diff, terminal, and file tabs.
- Light and dark appearance.
- Narrow-window layout.

## Acceptance criteria

- The app renders without an external agent runtime or model-provider dependency.
- Every visible action has a real accessible name.
- Expandable rows expose `aria-expanded` and keep stable height in the collapsed state.
- Running, success, error, canceled, and approval states are visually distinct.
- Blocking decisions remain in the transcript after resolution.
- Tool errors remain inspectable and are not represented only by a toast.
- The composer clearly shows workspace, permission mode, model, and the consequence of its primary button.
- Active work with an empty draft shows Stop; active work with text shows Queue; recoverable failure shows Retry.
- The right panel does not destroy transcript state when hidden.
- Long commands, paths, output, and titles truncate or scroll without widening the shell.
- Keyboard users can reach sidebar rows, tabs, tool accordions, approval actions, composer controls, and settings.
- At 820px width the sidebar collapses and the work panel becomes an overlay; the transcript and composer remain usable.
- Reduced-motion mode removes nonessential animation.

## Reference-only code to remove in production

- Scenario selector and query-string scenario routing.
- Mock session/thread data.
- Cosmetic approval responses.
- Static terminal/diff contents.
- The “Mock interface” composer caption.
