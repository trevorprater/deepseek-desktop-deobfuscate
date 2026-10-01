import type { Thread, ToolCall } from './model'

export const threads: Thread[] = [
  { id: 'transport', title: 'Port JSON-RPC transport', age: '2m', workspace: 'Harness UI', status: 'running' },
  { id: 'review', title: 'Review session event schema', age: '18m', workspace: 'Harness UI' },
  { id: 'tests', title: 'Fix reconnect state tests', age: '1h', workspace: 'Harness UI', status: 'attention' },
  { id: 'sidebar', title: 'Refine workspace sidebar', age: 'Yesterday', workspace: 'Harness UI' },
  { id: 'protocol', title: 'Document tool result protocol', age: 'Mon', workspace: 'Protocol' },
  { id: 'release', title: 'Prepare internal preview', age: 'Sep 28', workspace: 'Protocol' },
]

export const toolCalls: ToolCall[] = [
  {
    id: 'read-config',
    icon: 'read',
    title: 'Read package configuration',
    summary: 'Read ui-reference/package.json',
    status: 'success',
    duration: '42 ms',
    path: 'ui-reference/package.json',
    output: '{\n  "name": "harness-ui-reference",\n  "scripts": { "build": "tsc --noEmit && vite build" }\n}',
  },
  {
    id: 'run-tests',
    icon: 'terminal',
    title: 'Run focused tests',
    summary: '57 tests passed in 6.8s',
    status: 'success',
    duration: '6.8 s',
    command: 'pnpm exec vitest run packages/sdk/client/tests',
    output: 'Test Files  2 passed (2)\nTests      57 passed (57)\nDuration   6.79s',
  },
  {
    id: 'edit-transport',
    icon: 'edit',
    title: 'Edit transport adapter',
    summary: 'Updating src/transport/jsonrpc.ts',
    status: 'running',
    duration: '12 s',
    path: 'src/transport/jsonrpc.ts',
    output: 'Mapping session.status and session.event notifications…',
  },
]

export const diffLines = [
  { kind: 'context', old: '18', next: '18', text: 'export function connect(options: TransportOptions) {' },
  { kind: 'remove', old: '19', next: '', text: '  return new LegacySocket(options.url)' },
  { kind: 'add', old: '', next: '19', text: '  const rpc = new JsonRpcSocket(options.url)' },
  { kind: 'add', old: '', next: '20', text: '  rpc.subscribe(normalizeHarnessEvent)' },
  { kind: 'add', old: '', next: '21', text: '  return rpc' },
  { kind: 'context', old: '20', next: '22', text: '}' },
] as const
