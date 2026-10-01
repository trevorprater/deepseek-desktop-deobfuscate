export type Scenario = 'empty' | 'running' | 'approval' | 'success' | 'error'

export type Thread = {
  id: string
  title: string
  age: string
  workspace: string
  status?: 'running' | 'attention' | 'idle'
}

export type ToolStatus = 'running' | 'success' | 'error' | 'approval'

export type ToolCall = {
  id: string
  icon: 'read' | 'terminal' | 'edit' | 'search'
  title: string
  summary: string
  status: ToolStatus
  duration?: string
  command?: string
  output?: string
  path?: string
}

export type ApprovalState = 'pending' | 'accepted' | 'denied'

export type UiReferenceAdapter = {
  listThreads(): Promise<Thread[]>
  loadThread(threadId: string): Promise<unknown[]>
  sendMessage(threadId: string, text: string): Promise<void>
  respondToApproval(requestId: string, decision: 'allow' | 'deny'): Promise<void>
  subscribe(listener: (event: unknown) => void): () => void
}

export const scenarios: Array<{ value: Scenario; label: string }> = [
  { value: 'empty', label: 'Empty session' },
  { value: 'running', label: 'Running tools' },
  { value: 'approval', label: 'Awaiting approval' },
  { value: 'success', label: 'Completed response' },
  { value: 'error', label: 'Recoverable error' },
]
