/**
 * DuckHive-IDE AgentCore Types
 */

export interface Config {
  version: string;
  providers: Record<string, ProviderConfig>;
  agentModels: Record<string, string>;
  workspace: WorkspaceConfig;
  council: CouncilConfig;
  tools: ToolsConfig;
  ui: UIConfig;
}

export interface ProviderConfig {
  api_key?: string;
  base_url?: string;
  model?: string;
}

export interface WorkspaceConfig {
  path: string;
  autoLoadDUCK: boolean;
}

export interface CouncilConfig {
  enabled: boolean;
  debateThreshold: number;
  maxCouncilors: number;
}

export interface ToolsConfig {
  bashEnabled: boolean;
  dockerSandbox: boolean;
}

export interface UIConfig {
  theme: 'dark' | 'light';
  fontSize: number;
  panelLayout: 'right' | 'bottom' | 'left';
}

// IPC Command types for Tauri
export interface IPCCall {
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface IPCResponse {
  id: string;
  result?: unknown;
  error?: string;
}

// Session event types
export type SessionEvent =
  | { type: 'status_change'; status: string }
  | { type: 'message_added'; message: unknown }
  | { type: 'tool_called'; toolCall: unknown }
  | { type: 'tool_result'; toolCallId: string; result: unknown }
  | { type: 'error'; error: string };