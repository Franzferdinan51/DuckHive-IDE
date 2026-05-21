# DuckHive-IDE Agent Instructions

You are helping build DuckHive-IDE, an AI-First IDE for Vibe Coding.

## Project Context

DuckHive-IDE combines three major influences:
- **DuckHive-CLI**: AgentCore runtime, AI Council (46 councilors), mmx media tools, 3-layer memory
- **OpenClaude**: Multi-provider support, VS Code extension, coding-focused tool workflows
- **OpenClaw**: Multi-channel UI, session isolation, Live Canvas visual workspace

## Architecture

The IDE has three frontend options:
1. **React WebUI**: Primary GUI via Tauri WebView
2. **VS Code Extension**: Editor integration layer
3. **Go TUI**: Terminal-first fallback

All frontends communicate with the **Tauri/Rust backend** via IPC, which hosts the **TypeScript AgentCore runtime**.

## Key Directories

- `src/` - TypeScript AgentCore, tools, skills, memory
- `src-tauri/` - Rust backend, Tauri commands
- `webui/` - React frontend
- `vscode-extension/` - VS Code extension source
- `tui/` - Go TUI source

## Coding Standards

1. **TypeScript**: Use strict mode, explicit types, no `any`
2. **React**: Functional components, hooks, TypeScript
3. **Rust**: Use `?` for error propagation, no `.unwrap()` without context
4. **Tools**: All tools must have proper error handling and logging
5. **Memory**: Respect privacy - never log sensitive data

## Design Principles

1. **Agent-First**: AI is a first-class citizen with full project context
2. **Local-First**: Data stays on user's machine
3. **Privacy-Respecting**: No telemetry without explicit opt-in
4. **Extensible**: MCP bridge allows third-party tool integration
5. **Fast**: Startup under 2 seconds, response under 1 second for simple queries

## Issue Reporting

When you encounter bugs or missing features:
1. Check ARCHITECTURE.md for design context
2. Check existing issues before creating new ones
3. Include: OS, Rust version, Node version, error messages, steps to reproduce