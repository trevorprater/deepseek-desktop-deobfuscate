import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Icon, type IconName } from './icons'
import { diffLines, threads, toolCalls } from './mockData'
import { scenarios, type ApprovalState, type Scenario, type ToolCall } from './model'

type IconButtonProps = {
  label: string
  icon: IconName
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  className?: string
}

function IconButton({ label, icon, onClick, active, disabled, className = '' }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`iconButton ${active ? 'isActive' : ''} ${className}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={icon} size={17} />
    </button>
  )
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'brandCompact' : ''}`} aria-label="Agent Workbench">
      <span className="brandMark">
        <svg viewBox="0 0 28 28" aria-hidden="true">
          <path d="M5.2 15.2c2.8-1.1 4.5-3.7 5.1-7.8 2.9 3.5 6 5.3 9.4 5.5-1.4 5.1-4.7 8.3-9.9 9.7-2.3-1.7-3.8-4.2-4.6-7.4Z" fill="currentColor" />
          <path d="M18.8 8.2c1.8-.1 3.2-.8 4.2-2.1.2 2.8-.7 5-2.7 6.7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12.8" cy="13.2" r="1" fill="var(--surface-base)" />
        </svg>
      </span>
      {!compact && (
        <span className="brandWords">
          <strong>Agent Workbench</strong>
          <small>UI reference</small>
        </span>
      )}
    </div>
  )
}

type SidebarProps = {
  collapsed: boolean
  activeThread: string
  onCollapse: () => void
  onSelectThread: (id: string) => void
  onOpenSettings: () => void
}

function Sidebar({ collapsed, activeThread, onCollapse, onSelectThread, onOpenSettings }: SidebarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const filtered = threads.filter(thread => thread.title.toLowerCase().includes(query.toLowerCase()))

  return (
    <aside className={`sidebar ${collapsed ? 'sidebarCollapsed' : ''}`} aria-label="Workspace navigation">
      <div className="sidebarTop">
        <Brand compact={collapsed} />
        <IconButton label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} icon="collapse" onClick={onCollapse} />
      </div>

      <button className="newThreadButton" type="button" aria-label="New session">
        <Icon name="add" size={16} />
        {!collapsed && <span>New session</span>}
        {!collapsed && <kbd>⌘ N</kbd>}
      </button>

      <nav className="primaryNav" aria-label="Global panels">
        <button type="button" aria-label="Plugins"><Icon name="plugin" size={16} />{!collapsed && <span>Plugins</span>}</button>
        <button type="button" aria-label="Automations, 2 need attention"><Icon name="history" size={16} />{!collapsed && <span>Automations</span>} {!collapsed && <span className="navBadge">2</span>}</button>
      </nav>

      {!collapsed && (
        <>
          <div className="workspaceHeading">
            <span>Workspaces</span>
            <div>
              <IconButton label="Search sessions" icon="search" active={searchOpen} onClick={() => setSearchOpen(value => !value)} />
              <IconButton label="View options" icon="menu" />
              <IconButton label="Add workspace" icon="add" />
            </div>
          </div>
          {searchOpen && (
            <label className="sidebarSearch">
              <Icon name="search" size={14} />
              <input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search sessions" aria-label="Search session names" />
            </label>
          )}
          <div className="workspaceTree">
            <div className="workspaceRow"><Icon name="folder" size={15} /><span>Harness UI</span><Icon name="chevron" size={13} /></div>
            <div className="threadList">
              {filtered.filter(thread => thread.workspace === 'Harness UI').map(thread => (
                <button
                  type="button"
                  key={thread.id}
                  className={`threadRow ${thread.id === activeThread ? 'isSelected' : ''}`}
                  onClick={() => onSelectThread(thread.id)}
                >
                  <span className={`threadStatus ${thread.status ?? 'idle'}`} />
                  <span className="threadTitle">{thread.title}</span>
                  <span className="threadAge">{thread.age}</span>
                </button>
              ))}
            </div>
            <div className="workspaceRow secondaryWorkspace"><Icon name="folder" size={15} /><span>Protocol</span><Icon name="chevron" size={13} /></div>
            <div className="threadList">
              {filtered.filter(thread => thread.workspace === 'Protocol').map(thread => (
                <button type="button" key={thread.id} className="threadRow" onClick={() => onSelectThread(thread.id)}>
                  <span className="threadStatus idle" />
                  <span className="threadTitle">{thread.title}</span>
                  <span className="threadAge">{thread.age}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="sidebarFooter">
        <button type="button" aria-label="Settings" onClick={onOpenSettings}><Icon name="settings" size={17} />{!collapsed && <span>Settings</span>}</button>
      </div>
    </aside>
  )
}

type HeaderProps = {
  panelOpen: boolean
  dark: boolean
  scenario: Scenario
  onPanel: () => void
  onDark: () => void
  onScenario: (scenario: Scenario) => void
}

function Header({ panelOpen, dark, scenario, onPanel, onDark, onScenario }: HeaderProps) {
  const [tab, setTab] = useState<'chat' | 'trajectory'>('chat')
  return (
    <header className="conversationHeader">
      <div className="titleLine">
        <div className="crumbs">
          <button type="button">Harness UI</button>
          <span>/</span>
          <strong>Port JSON-RPC transport</strong>
          <span className="previewPill">Preview</span>
        </div>
        <div className="headerActions">
          <label className="scenarioPicker">
            <span>Visual state</span>
            <select aria-label="Visual state" value={scenario} onChange={event => onScenario(event.target.value as Scenario)}>
              {scenarios.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <IconButton label={dark ? 'Use light appearance' : 'Use dark appearance'} icon={dark ? 'sun' : 'moon'} onClick={onDark} />
          <IconButton label={panelOpen ? 'Close work panel' : 'Open work panel'} icon="panel" active={panelOpen} onClick={onPanel} />
          <IconButton label="More conversation actions" icon="more" />
        </div>
      </div>
      <div className="viewTabs" role="tablist" aria-label="Conversation views">
        <button type="button" role="tab" aria-selected={tab === 'chat'} className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>Chat</button>
        <button type="button" role="tab" aria-selected={tab === 'trajectory'} className={tab === 'trajectory' ? 'active' : ''} onClick={() => setTab('trajectory')}>Trajectory <span className="tabCount">7</span></button>
      </div>
    </header>
  )
}

function Disclosure({ title, summary, children, defaultOpen = false, icon = 'sparkle' }: { title: string; summary?: string; children?: ReactNode; defaultOpen?: boolean; icon?: IconName }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`disclosure ${open ? 'isOpen' : ''}`}>
      <button type="button" className="disclosureHeader" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <Icon name={icon} size={15} />
        <span className="disclosureTitle">{title}</span>
        {summary && <><span className="dotSep" /><span className="disclosureSummary">{summary}</span></>}
        <Icon name="chevron" size={14} className="disclosureChevron" />
      </button>
      {open && children && <div className="disclosureBody">{children}</div>}
    </div>
  )
}

function statusText(tool: ToolCall) {
  if (tool.status === 'running') return 'Running'
  if (tool.status === 'success') return 'Success'
  if (tool.status === 'approval') return 'Awaiting approval'
  return 'Failed'
}

function ToolCard({ tool }: { tool: ToolCall }) {
  const [open, setOpen] = useState(tool.status === 'running')
  return (
    <section className={`toolCard status-${tool.status}`} aria-label={`${tool.title}: ${statusText(tool)}`}>
      <button type="button" className="toolHeader" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <span className="toolIcon"><Icon name={tool.icon} size={15} /></span>
        <span className="toolText"><strong>{tool.title}</strong><span>{tool.summary}</span></span>
        {tool.duration && <span className="toolDuration">{tool.duration}</span>}
        <span className="toolState"><span className="stateDot" />{statusText(tool)}</span>
        <Icon name="chevron" size={14} className="toolChevron" />
      </button>
      {open && (
        <div className="toolBody">
          {(tool.path || tool.command) && (
            <div className="toolMeta"><span>{tool.command ? 'Command' : 'Path'}</span><code>{tool.command ?? tool.path}</code><IconButton label={tool.command ? 'Copy command' : 'Copy path'} icon="copy" /></div>
          )}
          <pre>{tool.output}</pre>
        </div>
      )}
    </section>
  )
}

function ApprovalCard({ state, onState }: { state: ApprovalState; onState: (state: ApprovalState) => void }) {
  return (
    <section className={`approvalCard approval-${state}`} aria-labelledby="approval-title">
      <div className="approvalIcon"><Icon name={state === 'pending' ? 'approval' : state === 'accepted' ? 'check' : 'close'} size={18} /></div>
      <div className="approvalContent">
        <div className="approvalHeading">
          <div><strong id="approval-title">Allow command?</strong><span>{state === 'pending' ? 'The agent is waiting for your decision.' : state === 'accepted' ? 'Allowed once for this turn.' : 'Denied. The agent will not run this command.'}</span></div>
          <span className="riskPill">Workspace write</span>
        </div>
        <div className="commandPreview"><code>pnpm install && pnpm test</code><IconButton label="Copy command" icon="copy" /></div>
        <dl className="approvalFacts"><div><dt>Runs in</dt><dd>~/work/harness-ui</dd></div><div><dt>Can change</dt><dd>Files inside this workspace</dd></div></dl>
        {state === 'pending' && <div className="approvalActions"><button type="button" className="button secondary" onClick={() => onState('denied')}>Deny</button><button type="button" className="button primary" onClick={() => onState('accepted')}>Allow once</button></div>}
      </div>
    </section>
  )
}

function AssistantAnswer() {
  return (
    <article className="assistantAnswer">
      <p>I separated the UI from the runtime and added a transport boundary your JSON-RPC harness can implement.</p>
      <p>The frontend now expects one normalized event stream with stable session, message, and tool-call identifiers:</p>
      <ul><li><strong>session.status</strong> drives running, blocked, idle, and failed states.</li><li><strong>session.event</strong> supplies durable user, assistant, and tool timeline events.</li><li><strong>approval.request</strong> renders as a blocking decision card instead of a transient dialog.</li></ul>
      <pre className="codeBlock"><span className="codeLabel">transport.ts</span><code>{`adapter.subscribe(event => {
  transcript.ingest(normalizeJsonRpcEvent(event))
})`}</code><button type="button" aria-label="Copy code"><Icon name="copy" size={14} /></button></pre>
      <p>The visual shell remains backend-agnostic; only the adapter owns your protocol names and payload validation.</p>
      <div className="messageActions"><IconButton label="Copy response" icon="copy" /><IconButton label="Fork from this point" icon="history" /><span>11:42 AM</span></div>
    </article>
  )
}

type TranscriptProps = {
  scenario: Scenario
  approval: ApprovalState
  onApproval: (state: ApprovalState) => void
}

function Transcript({ scenario, approval, onApproval }: TranscriptProps) {
  if (scenario === 'empty') {
    return (
      <div className="emptyState">
        <div className="emptyGlyph"><Icon name="sparkle" size={28} /></div>
        <h1>Explore the unknown</h1>
        <p>Start with a task, question, or repository. This reference uses mock data only.</p>
        <div className="starterGrid">
          <button type="button"><Icon name="code" size={17} /><span><strong>Build a feature</strong><small>Plan and implement a focused change</small></span></button>
          <button type="button"><Icon name="search" size={17} /><span><strong>Investigate a bug</strong><small>Trace an issue through the codebase</small></span></button>
          <button type="button"><Icon name="read" size={17} /><span><strong>Explain a project</strong><small>Map architecture and key workflows</small></span></button>
        </div>
      </div>
    )
  }

  return (
    <div className="transcriptColumn">
      <div className="userMessageRow"><div className="userBubble">Build a compatibility layer so this frontend can consume my existing JSON-RPC agent harness.</div><div className="userActions"><button type="button">Edit</button><span>11:39 AM</span></div></div>

      <Disclosure title="Thought for a while" summary="Mapped the frontend transport and session event contracts" icon="sparkle">
        <p>The UI can remain unchanged if the adapter normalizes your RPC notifications into the session timeline vocabulary. I’ll isolate that boundary before touching presentation components.</p>
      </Disclosure>

      <div className="toolStack">
        {toolCalls.slice(0, scenario === 'running' ? 3 : 2).map(tool => <ToolCard key={tool.id} tool={scenario === 'error' && tool.id === 'run-tests' ? { ...tool, status: 'error', summary: 'Connection closed before results arrived', output: 'TransportClosedError: WebSocket disconnected\nRetry after reconnecting the local harness.' } : tool} />)}
      </div>

      {scenario === 'approval' && <ApprovalCard state={approval} onState={onApproval} />}

      {scenario === 'error' && (
        <section className="errorCard"><Icon name="warning" size={18} /><div><strong>Could not continue the run</strong><p>The JSON-RPC connection closed while a tool was active. Your draft and the last received output are preserved.</p><button type="button" className="textButton">View connection details</button></div></section>
      )}

      {scenario === 'success' && <AssistantAnswer />}

      {scenario === 'running' && (
        <div className="runningStatus" role="status"><span className="spinner" /><span><strong>Working</strong><small>Updating the transport adapter</small></span><time>0:18</time></div>
      )}
    </div>
  )
}

type ComposerProps = {
  scenario: Scenario
  draft: string
  onDraft: (value: string) => void
  approval: ApprovalState
  onScenario: (scenario: Scenario) => void
}

function Composer({ scenario, draft, onDraft, approval, onScenario }: ComposerProps) {
  const blocked = scenario === 'approval' && approval === 'pending'
  const mode = blocked ? 'disabled' : scenario === 'running' ? (draft.trim() ? 'queue' : 'stop') : scenario === 'error' && !draft.trim() ? 'retry' : draft.trim() ? 'send' : 'disabled'
  const label = mode === 'queue' ? 'Queue follow-up' : mode === 'stop' ? 'Stop run' : mode === 'retry' ? 'Retry run' : mode === 'send' ? 'Send message' : blocked ? 'Answer request above to continue' : 'Type a message to send'

  const primaryAction = () => {
    if (mode === 'stop') onScenario('success')
    if (mode === 'retry') onScenario('running')
    if (mode === 'send' || mode === 'queue') {
      onDraft('')
      onScenario('running')
    }
  }

  return (
    <div className={`composerWrap ${scenario === 'empty' ? 'composerHero' : ''}`}>
      {scenario === 'running' && <div className="backgroundProcess"><Icon name="terminal" size={14} /><span>1 terminal running</span><button type="button">Open</button><button type="button">Stop</button></div>}
      <div className={`composer ${blocked ? 'composerBlocked' : ''}`}>
        <textarea value={draft} onChange={event => onDraft(event.target.value)} placeholder={blocked ? 'Respond to the approval request above' : 'Describe what you want to build, / commands, @ files or sessions'} aria-label="Message composer" disabled={blocked} />
        <div className="composerToolbar">
          <div className="composerLeft"><IconButton label="Add files or run commands" icon="add" /><button type="button" className="composerPill"><Icon name="sparkle" size={14} />Standard</button><button type="button" className="composerPill"><Icon name="approval" size={14} />Workspace write</button></div>
          <div className="composerRight"><button type="button" className="modelPicker"><span>Frontier model</span><small>High</small><Icon name="chevron" size={13} /></button><button type="button" className={`sendButton mode-${mode}`} onClick={primaryAction} disabled={mode === 'disabled'} aria-label={label} title={label}><Icon name={mode === 'stop' ? 'stop' : mode === 'retry' ? 'history' : 'send'} size={16} /></button></div>
        </div>
      </div>
      <p className="composerHint">Mock interface · no requests leave this browser</p>
    </div>
  )
}

function RightPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'diff' | 'terminal' | 'files'>('diff')
  return (
    <aside className="rightPanel" aria-label="Work panel">
      <div className="panelHeader"><div className="panelTabs" role="tablist"><button type="button" className={tab === 'diff' ? 'active' : ''} onClick={() => setTab('diff')}>Review</button><button type="button" className={tab === 'terminal' ? 'active' : ''} onClick={() => setTab('terminal')}>Terminal</button><button type="button" className={tab === 'files' ? 'active' : ''} onClick={() => setTab('files')}>Files</button></div><IconButton label="Close work panel" icon="close" onClick={onClose} /></div>
      {tab === 'diff' && <div className="diffView"><div className="diffToolbar"><span><Icon name="file" size={14} />src/transport/jsonrpc.ts</span><div><button type="button">Unified</button><IconButton label="Copy patch" icon="copy" /></div></div><div className="diffCode">{diffLines.map((line, index) => <div key={index} className={`diffLine ${line.kind}`}><span>{line.old}</span><span>{line.next}</span><code>{line.kind === 'add' ? '+' : line.kind === 'remove' ? '-' : ' '}{line.text}</code></div>)}</div><div className="reviewFooter"><span><strong>1</strong> file changed</span><span className="added">+3</span><span className="removed">−1</span></div></div>}
      {tab === 'terminal' && <div className="terminalPanel"><div className="terminalTitle"><span className="terminalDot red" /><span className="terminalDot yellow" /><span className="terminalDot green" /><strong>harness-ui — zsh</strong></div><pre><span className="prompt">~/work/harness-ui $</span> pnpm test{`\n`}<span className="muted">Test Files</span> 2 passed (2){`\n`}<span className="muted">Tests</span> 57 passed (57){`\n`}<span className="successText">Done in 6.79s</span>{`\n\n`}<span className="prompt">~/work/harness-ui $</span> <span className="terminalCursor" /></pre></div>}
      {tab === 'files' && <div className="fileTree"><div className="fileTreeRow folder"><Icon name="folder" size={15} />src</div><div className="fileTreeRow nested folder"><Icon name="folder" size={15} />transport</div><div className="fileTreeRow nested2 active"><Icon name="file" size={15} />jsonrpc.ts<span>M</span></div><div className="fileTreeRow nested2"><Icon name="file" size={15} />events.ts</div><div className="fileTreeRow"><Icon name="file" size={15} />package.json</div></div>}
    </aside>
  )
}

function SettingsModal({ dark, onDark, onClose }: { dark: boolean; onDark: () => void; onClose: () => void }) {
  return (
    <div className="modalBackdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section className="settingsModal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="settingsSidebar"><h2 id="settings-title">Settings</h2>{['General', 'Appearance', 'Models', 'Permissions', 'Plugins', 'Advanced'].map((label, index) => <button type="button" key={label} className={index === 1 ? 'active' : ''}>{label}</button>)}</div>
        <div className="settingsContent"><div className="settingsTop"><div><h3>Appearance</h3><p>Choose how the workbench looks on this device.</p></div><IconButton label="Close settings" icon="close" onClick={onClose} /></div><div className="settingsSection"><h4>Theme</h4><div className="themeCards"><button type="button" className={!dark ? 'active' : ''} onClick={() => dark && onDark()}><span className="themePreview lightPreview"><i /><i /><i /></span><strong>Light</strong></button><button type="button" className={dark ? 'active' : ''} onClick={() => !dark && onDark()}><span className="themePreview darkPreview"><i /><i /><i /></span><strong>Dark</strong></button><button type="button"><span className="themePreview systemPreview"><i /><i /><i /></span><strong>System</strong></button></div></div><div className="settingsRow"><div><strong>Content size</strong><span>Adjust transcript and composer text.</span></div><select defaultValue="default"><option value="compact">Compact</option><option value="default">Default</option><option value="large">Large</option></select></div><div className="settingsRow"><div><strong>Reduce motion</strong><span>Minimize nonessential interface animation.</span></div><label className="switch"><input type="checkbox" /><span /></label></div></div>
      </section>
    </div>
  )
}

export function App() {
  const initialScenario = useMemo<Scenario>(() => {
    const query = new URLSearchParams(window.location.search).get('scenario')
    return scenarios.some(item => item.value === query) ? query as Scenario : 'running'
  }, [])
  const [scenario, setScenario] = useState<Scenario>(initialScenario)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const [dark, setDark] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeThread, setActiveThread] = useState('transport')
  const [draft, setDraft] = useState('')
  const [approval, setApproval] = useState<ApprovalState>('pending')

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  useEffect(() => {
    if (!settingsOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [settingsOpen])

  useEffect(() => {
    setApproval('pending')
    const url = new URL(window.location.href)
    url.searchParams.set('scenario', scenario)
    window.history.replaceState(null, '', url)
  }, [scenario])

  return (
    <div className={`appShell ${sidebarCollapsed ? 'sidebarIsCollapsed' : ''} ${panelOpen ? 'panelIsOpen' : ''}`}>
      <Sidebar collapsed={sidebarCollapsed} activeThread={activeThread} onCollapse={() => setSidebarCollapsed(value => !value)} onSelectThread={setActiveThread} onOpenSettings={() => setSettingsOpen(true)} />
      <main className="conversation">
        <Header panelOpen={panelOpen} dark={dark} scenario={scenario} onPanel={() => setPanelOpen(value => !value)} onDark={() => setDark(value => !value)} onScenario={setScenario} />
        <div className={`conversationBody ${scenario === 'empty' ? 'isEmpty' : ''}`}>
          <div className="transcriptScroll"><Transcript scenario={scenario} approval={approval} onApproval={setApproval} /></div>
          <Composer scenario={scenario} draft={draft} onDraft={setDraft} approval={approval} onScenario={setScenario} />
        </div>
      </main>
      {panelOpen && <RightPanel onClose={() => setPanelOpen(false)} />}
      {settingsOpen && <SettingsModal dark={dark} onDark={() => setDark(value => !value)} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
