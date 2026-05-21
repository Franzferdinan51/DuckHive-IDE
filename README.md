# DuckHive-IDE

**AI-First IDE for Vibe Coding**

> Where the AI agent is a first-class citizen, not a copilot bolted on.

DuckHive-IDE is a next-generation AI/Agent-First IDE built on DuckHive-CLI, OpenClaude, and OpenClaw. It features a multi-agent architecture, AI Council for adversarial code review, native media generation, and deep VS Code integration.

## Features

### Core Architecture
- **AI-First Design**: Agent has full project context, spawns sub-agents, invokes tools natively
- **Multi-Agent System**: Sub-agent spawning with per-agent model routing and session isolation
- **3-Layer Memory**: BM25 keyword search → Semantic embeddings → LESSONS learned
- **AI Council**: 46 adversarial councilors for code review, security, and multi-perspective decisions

### Agent Capabilities
- **File Operations**: Read, write, edit, glob, grep with full project awareness
- **Bash Execution**: Shell commands, process management, Docker integration
- **Media Generation**: Built-in image, speech, music, and video generation (mmx)
- **MCP Bridge**: Connect to Model Context Protocol servers for extended tools
- **Task Management**: Delegate to sub-agents, await results, chain workflows

### IDE Integration
- **VS Code Extension**: Inline chat, codeLens actions, terminal integration
- **Monaco Editor**: Full VS Code editor experience in the web view
- **Terminal Panel**: xterm.js based terminal for shell access
- **File Explorer**: Project-aware file browsing with Git integration
- **Split Views**: Resizable panels for chat, editor, terminal, and output

### UI Options
- **React WebUI**: Rich visual interface with React + TypeScript
- **Go TUI**: Terminal-first workflow (Go/Bubble Tea) for headless use
- **Dark/Light Themes**: Customizable syntax highlighting and UI colors

### Multi-Provider Support
- **MiniMax**: Default provider with M2.7 model
- **OpenAI**: GPT-4o, GPT-4o-mini, o1, o1-mini
- **Claude**: Via Anthropic API
- **Gemini**: Google AI models
- **Ollama**: Local inference (no API key needed)
- **OpenRouter**: Access to 100+ models

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       DuckHive-IDE                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │  VS Code    │  │   React WebUI   │  │   Go TUI        │      │
│  │  Extension  │  │   (WebView)     │  │   (Terminal)    │      │
│  └──────┬──────┘  └──────┬────────┘  └──────┬────────┘      │
│         └─────────────────┼─────────────────┘                 │
│                    ┌───────▼────────┐                         │
│                    │  Tauri/Rust    │                         │
│                    │  (IPC Bridge)  │                         │
│                    └───────┬────────┘                         │
│          ┌─────────────────┼─────────────────┐                │
│  ┌───────▼───────┐ ┌───────▼───────┐ ┌──────▼──────┐         │
│  │  AgentCore    │ │  AgentRun      │ │  Tool       │         │
│  │  (TS Runtime) │ │  ControlPlane │ │  Registry   │         │
│  └───────────────┘ └───────────────┘ └─────────────┘         │
│                                                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐    │
│  │  3-Layer      │  │  AI Council    │  │  mmx Media     │    │
│  │  Memory       │  │  (46 Councilors│  │  Generator     │    │
│  └───────────────┘  └───────────────┘  └────────────────┘    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites
- Node.js 20+ (for npm/bun)
- Rust 1.75+ (for Tauri)
- bun (recommended) or npm

### Build from Source

```bash
# Clone the repository
git clone https://github.com/Franzferdinan51/DuckHive-IDE.git
cd DuckHive-IDE

# Install dependencies
bun install

# Build the TypeScript core
bun run build:core

# Build the Tauri app
bun run build:tauri

# Or run in development mode
bun run dev
```

### VS Code Extension

```bash
cd vscode-extension
code --install-extension duckhive-ide.vsix
```

## Configuration

DuckHive-IDE uses a JSON configuration file at `~/.duckhive-ide/config.json`:

```json
{
  "version": "1",
  "providers": {
    "default": "minimax",
    "minimax": {
      "api_key": "${MINIMAX_API_KEY}",
      "base_url": "https://api.minimax.io/v1"
    },
    "openai": {
      "api_key": "${OPENAI_API_KEY}",
      "base_url": "https://api.openai.com/v1"
    }
  },
  "agentModels": {
    "default": "minimax-01",
    "Explore": "gpt-4o",
    "Plan": "claude-4-sonnet",
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
  "ui": {
    "theme": "dark",
    "fontSize": 14,
    "panelLayout": "right"
  }
}
```

## Key Slash Commands

| Command | Description |
|---------|-------------|
| `/new` | Start a new agent session |
| `/status` | Show current provider, model, token usage |
| `/reset` | Reset conversation context |
| `/compact` | Compact context to save tokens |
| `/think <level>` | Set reasoning effort level |
| `/verbose on\|off` | Toggle verbose output |
| `/trace on\|off` | Toggle trace output |
| `/usage` | Show token usage statistics |
| `/goal` | Enter autonomous goal mode |
| `/council` | Invoke AI Council for decision |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+A` | Open AI Chat |
| `Ctrl+Shift+X` | Open Explorer |
| `Ctrl+Shift+T` | Open Terminal |
| `Ctrl+Shift+M` | Toggle Media Panel |
| `Ctrl+Shift+C` | Invoke AI Council |
| `Ctrl+Enter` | Send message to agent |

## Comparison with Other AI Coding Tools

| Feature | DuckHive-IDE | GitHub Copilot | Cursor | Windsurf |
|---------|-------------|----------------|--------|----------|
| Agent-First Architecture | ✅ | ❌ | Partial | Partial |
| Multi-Agent Support | ✅ | ❌ | ❌ | ❌ |
| AI Council | ✅ | ❌ | ❌ | ❌ |
| Built-in Media Gen | ✅ | ❌ | ❌ | ❌ |
| 3-Layer Memory | ✅ | ❌ | ❌ | ❌ |
| Local-First | ✅ | ❌ | ❌ | ❌ |
| VS Code Extension | ✅ | ✅ | ❌ | ❌ |
| Go TUI | ✅ | ❌ | ❌ | ❌ |
| Open Source | ✅ | ❌ | Partial | Partial |

## Project Structure

```
DuckHive-IDE/
├── ARCHITECTURE.md     # Detailed architecture plan
├── CLAUDE.md           # Agent instructions
├── README.md           # This file
├── bin/                # Launchers
├── config/             # Default configurations
├── src/                # TypeScript core (AgentCore)
│   ├── cli.ts
│   ├── agent-core.ts
│   ├── tool-registry.ts
│   ├── memory/
│   └── skills/
├── src-tauri/          # Rust/Tauri backend
├── webui/              # React frontend
├── vscode-extension/   # VS Code integration
├── tui/               # Go TUI (fallback)
└── tests/              # Test suites
```

## Credits & Inspiration

DuckHive-IDE is built on the shoulders of giants:

- [**DuckHive-CLI**](https://github.com/Franzferdinan51/DuckHive) - AI coding CLI with AgentCore, AI Council, and mmx tools
- [**OpenClaude**](https://github.com/Gitlawb/openclaude) - Coding agent CLI with multi-provider support and VS Code extension
- [**OpenClaw**](https://github.com/openclaw/openclaw) - Personal AI assistant with multi-channel and Live Canvas

## License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for the vibe coding community**