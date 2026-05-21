# DuckHive-IDE Architecture Plan

**Generated:** 2026-05-21
**Based on:** DuckHive-CLI + OpenClaude + OpenClaw

---

## 1. Vision & Core Philosophy

DuckHive-IDE is an **AI/Agent-First IDE** for Vibe Coding — an IDE where the AI agent is a first-class citizen, not a copilot bolted on. The agent has full project context, can spawn sub-agents, invoke tools, browse files, run tests, and collaborate with the user in real-time through a rich visual interface.

**Key Differentiators:**
- Local-first, privacy-respecting (runs entirely on-user hardware)
- Multi-agent architecture with session isolation and sandboxing
- AI Council for adversarial code review and multi-perspective decisions
- Built-in media generation for vibe coding (images, speech, music)
- VS Code extension layer for deep editor integration
- Terminal + Visual workspace hybrid (TUI + GUI)

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DuckHive-IDE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐ │
│  │   VS Code        │   │   React Frontend  │   │   Go TUI         │ │
│  │   Extension      │   │   (WebView)       │   │   (Terminal)     │ │
│  │   Layer          │   │                   │   │                  │ │
│  └───────┬──────────┘   └───────┬──────────┘   └───────┬──────────┘ │
│          │                      │                      │             │
│          └──────────────────────┼──────────────────────┘             │
│                                 │                                      │
│                    ┌───────────▼───────────┐                         │
│                    │   Tauri/Rust Backend  │                          │
│                    │   (IPC Bridge)        │                          │
│                    └───────────┬───────────┘                         │
│                                │                                      │
│          ┌─────────────────────┼─────────────────────┐              │
│          │                     │                     │              │
│  ┌───────▼───────┐   ┌─────────▼─────────┐   ┌──────▼──────┐      │
│  │ AgentCore     │   │  AgentRun         │   │ Tool        │      │
│  │ (TypeScript)  │   │  ControlPlane     │   │ Registry    │      │
│  │ Runtime       │   │  (State Machine)  │   │             │      │
│  └───────────────┘   └───────────────────┘   └─────────────┘      │
│                                                                      │
│  ┌──────────────────┐   ┌──────────────────┐   ┌────────────────┐ │
│  │  3-Layer Memory   │   │  AI Council       │   │  mmx Media     │ │
│  │  BM25/Embed/LESSON│   │  (46 Councilors)  │   │  Generator     │ │
│  └──────────────────┘   └──────────────────┘   └────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Choices

### 3.1 React/TypeScript Frontend (Primary GUI)

**Core Libraries:**
- **Framework:** React 19 + TypeScript 5
- **Build Tool:** Vite 6
- **State Management:** Zustand (lightweight, DuckHive pattern)
- **UI Components:** Radix UI + custom components
- **Styling:** CSS Modules + CSS Variables for theming
- **Editor Integration:** Monaco Editor (VS Code's editor)
- **Terminal:** xterm.js

**Frontend Architecture:**
```
webui/
├── src/
│   ├── components/       # UI components (resizable panels, chat, etc.)
│   ├── hooks/            # React hooks for agent interaction
│   ├── stores/            # Zustand stores
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # Helpers
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
└── package.json
```

### 3.2 VS Code Extension (Editor Integration Layer)

Based on OpenClaude's `vscode-extension/openclaude-vscode` pattern:
- Provides inline chat, codeLens actions, terminal integration
- Communicates with Tauri backend via JSON-RPC
- Manages diagnostics, decorations, and editor events

### 3.3 Go TUI (Terminal-First Workflow)

Based on DuckHive's `tui/` (Go/Bubble Tea):
- Interactive terminal UI when running headless
- Agent/Shell/Council/Media mode switching
- Fallback when no browser available

---

## 4. Backend: Tauri + Rust

**Why Tauri:**
- Native performance, small binary, local-first
- WebView for React frontend
- Rust for safety and performance in agent runtime
- IPC between frontend and TypeScript agent runtime

**Backend Architecture:**
```
src-tauri/
├── src/
│   ├── main.rs           # Tauri entry point
│   ├── commands.rs       # Tauri command handlers
│   ├── agent_runtime.rs  # TypeScript runtime host (deno_core)
│   ├── tool_registry.rs  # Tool execution engine
│   ├── session.rs        # Session management
│   ├── mcp_bridge.rs    # MCP server integration
│   └── ipc.rs           # IPC protocol definitions
├── Cargo.toml
└── tauri.conf.json
```

---

## 5. Core Systems

### 5.1 AgentCore (TypeScript Runtime)

Port from DuckHive-CLI `src/`:
- `AgentCore` class managing agent lifecycle
- Tool loop: model call → tool execution → follow-up
- Streaming output via Tauri events
- 3-layer memory: BM25 → embed → LESSONS

### 5.2 AgentRun ControlPlane

Durable run store with state machine:
```
queued → preparing → running → awaiting_approval → paused → recovering → completed|failed|cancelled
```

### 5.3 Multi-Agent System

Inspired by OpenClaw:
- Sub-agent spawning with per-agent model routing
- Session isolation (each agent has own context)
- Docker sandbox support for untrusted agents
- Tool permission tiers per agent

### 5.4 Tool Registry

Pre-built tools (from DuckHive-CLI + custom):
- **File Tools:** read, write, edit, glob, grep, ls
- **Bash Tools:** shell execution, process management
- **Agent Tools:** spawn, delegate, task, await
- **MCP Tools:** server → tool bridging
- **Media Tools:** mmx image/speech/music/video generation
- **Council Tools:** invoke councilors, run debates

### 5.5 AI Council System

From DuckHive-CLI's council/senate:
- 46 adversarial councilors with different personas
- Debate mode for major decisions
- Code review council, security council, performance council
- Configurable thresholds for requiring council approval

### 5.6 Memory System

3-layer architecture:
1. **BM25:** Fast keyword search over recent context
2. **Embed:** Semantic search via vector embeddings
3. **LESSONS:** Learned insights persisting across sessions

---

## 6. Feature Priority Matrix

| Feature | Priority | Source | Notes |
|----------|----------|--------|-------|
| Tauri + React shell | P0 | - | Foundation |
| AgentCore integration | P0 | DuckHive | TypeScript runtime |
| Tool registry | P0 | DuckHive | File/Bash/Agent tools |
| Chat interface | P0 | OpenClaw | Multi-channel UX |
| VS Code extension | P1 | OpenClaude | Editor integration |
| Multi-agent routing | P1 | OpenClaw | Session isolation |
| AI Council | P1 | DuckHive | 46 councilors |
| 3-layer memory | P1 | DuckHive | BM25/embed/LESSONS |
| Go TUI | P2 | DuckHive | Terminal fallback |
| Monaco editor | P2 | OpenClaw | Live Canvas concept |
| Media generation | P2 | DuckHive | mmx tools |
| MCP server bridge | P2 | OpenClaude | Tool extension |
| Provider config UI | P2 | OpenClaude | Multi-provider |

---

## 7. Configuration Schema

```json
{
  "version": "1",
  "providers": {
    "default": "minimax",
    "minimax": {
      "api_key": "",
      "base_url": "https://api.minimax.io/v1"
    },
    "openai": {
      "api_key": "",
      "base_url": "https://api.openai.com/v1"
    },
    "ollama": {
      "base_url": "http://localhost:11434/v1"
    }
  },
  "agentModels": {
    "default": "minimax-01",
    "Explore": "gpt-4o",
    "Plan": "claude-4",
    "Council": "gpt-4o"
  },
  "workspace": {
    "path": "~/duckhive-projects",
    "autoLoadDUCK": true
  },
  "council": {
    "enabled": true,
    "debateThreshold": 0.7,
    "maxCouncilors": 5
  },
  "tools": {
    "bashEnabled": true,
    "dockerSandbox": false
  },
  "ui": {
    "theme": "dark",
    "fontSize": 14,
    "panelLayout": "right"
  }
}
```

---

## 8. Directory Structure

```
DuckHive-IDE/
├── README.md
├── CLAUDE.md
├── ARCHITECTURE.md
├── bin/                    # Launchers
├── config/                 # Default configs
├── src/                    # TypeScript core (AgentCore)
│   ├── cli.ts
│   ├── agent-core.ts
│   ├── tool-registry.ts
│   ├── memory/
│   ├── council/
│   └── skills/
├── src-tauri/              # Rust/Tauri backend
│   ├── src/main.rs
│   ├── src/commands.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── webui/                  # React frontend
│   ├── src/components/
│   ├── src/stores/
│   ├── src/hooks/
│   └── package.json
├── vscode-extension/       # VS Code integration
├── tui/                    # Go TUI (fallback)
├── scripts/                # Build utilities
└── tests/                  # Test suites
```

---

## 9. Implementation Phases

### Phase 1: Foundation (MVP)
1. Initialize Tauri project with React frontend
2. Get basic shell running (empty window)
3. Integrate minimal AgentCore (TypeScript)
4. Basic chat interface in frontend
5. File read/write tools working
6. README draft

### Phase 2: Core IDE
1. Monaco editor integration
2. File explorer panel
3. Terminal panel (xterm.js)
4. Tool execution engine
5. Session management
6. Provider configuration UI

### Phase 3: Agent Features
1. Multi-agent spawning
2. AI Council integration
3. 3-layer memory system
4. VS Code extension
5. MCP server bridge

### Phase 4: Polish
1. Go TUI fallback
2. Media generation tools
3. Live Canvas visual workspace
4. Performance optimization
5. Full documentation

---

## 10. Key Inspirations & Mappings

| From | Feature | Implementation |
|------|---------|-----------------|
| DuckHive-CLI | AgentCore | Port `src/agent-core.ts` to Tauri host |
| DuckHive-CLI | AI Council | Integrate `council/` module |
| DuckHive-CLI | mmx tools | Add as tool registry entries |
| DuckHive-CLI | 3-layer memory | Port `memory/` module |
| OpenClaude | Provider abstraction | Multi-provider config UI |
| OpenClaude | VS Code extension | `vscode-extension/` port |
| OpenClaw | Multi-channel UI | React chat panels |
| OpenClaw | Session isolation | Per-agent context isolation |
| OpenClaw | Live Canvas | Visual workspace component |
| OpenClaw | Docker sandbox | Tool permission tiers |

---

## 11. Technical Decisions

### Why Not Electron?
- Tauri: 10MB vs Electron's 150MB+
- Native performance, smaller attack surface
- Rust backend for safety in tool execution
- Better for local-first privacy

### Why TypeScript for AgentCore?
- DuckHive-CLI already in TypeScript — port not rewrite
- Rich tool ecosystem (npm packages)
- Easy skill authoring
- Monaco Editor for editor integration

### Why Go for TUI?
- DuckHive TUI already in Go — port not rewrite
- Bubble Tea is excellent for terminal UI
- Small binary, fast startup
- Good for headless/server scenarios

---

*This plan is a living document. Update as architecture evolves.*