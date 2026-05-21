/**
 * DuckHive-IDE MCP Bridge System
 *
 * Bridges to external MCP servers, providing tool access to the agent.
 * Based on OpenClaude's ACP protocol and MCP transport architecture.
 */

import type { ToolDefinition } from '../agent-core';

// ============ MCP Types ============

export type MCPTransportType = 'stdio' | 'sse' | 'streamable-http';

export interface MCPServerConfig {
  name: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  url?: string;
  transport?: MCPTransportType;
  headers?: Record<string, string>;
  connectionTimeoutMs?: number;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  annotations?: {
    readOnly?: boolean;
    destructive?: boolean;
    idempotent?: boolean;
  };
}

export interface MCPConnection {
  serverName: string;
  transport: MCPTransportType;
  isConnected: boolean;
  tools: MCPTool[];
  lastPing?: number;
}

// ============ MCP Transport Implementations ============

/**
 * Stdio transport for local MCP servers
 */
export class StdioMCPTransport {
  private serverConfig: MCPServerConfig;
  private process?: Deno.ChildProcess;
  private requestId = 0;
  private pendingRequests = new Map<string, {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
  }>();

  constructor(config: MCPServerConfig) {
    this.serverConfig = config;
  }

  async connect(): Promise<void> {
    if (!this.serverConfig.command) {
      throw new Error('No command specified for stdio transport');
    }

    // In production, this would spawn the process
    console.log(`[MCP.Stdio] Starting server: ${this.serverConfig.command}`);
    this.requestId = 0;
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }
    this.pendingRequests.clear();
  }

  async sendRequest(method: string, params?: unknown): Promise<unknown> {
    const id = `req-${++this.requestId}`;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      // Simulate JSON-RPC over stdio
      setTimeout(() => {
        const pending = this.pendingRequests.get(id);
        if (pending) {
          pending.resolve({ jsonrpc: '2.0', id, result: {} });
          this.pendingRequests.delete(id);
        }
      }, 50);
    });
  }

  async listTools(): Promise<MCPTool[]> {
    const response = await this.sendRequest('tools/list');
    return (response as { tools?: MCPTool[] })?.tools || [];
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const response = await this.sendRequest('tools/call', {
      name: toolName,
      arguments: args
    });
    return response;
  }
}

/**
 * SSE transport for remote MCP servers
 */
export class SSETransport {
  private serverConfig: MCPServerConfig;
  private eventSource?: EventSource;
  private requestQueue: Map<string, {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
  }> = new Map();

  constructor(config: MCPServerConfig) {
    this.serverConfig = config;
  }

  async connect(): Promise<void> {
    if (!this.serverConfig.url) {
      throw new Error('No URL specified for SSE transport');
    }

    console.log(`[MCP.SSE] Connecting to: ${this.serverConfig.url}`);

    // In production, would establish SSE connection
    this.eventSource = undefined;
  }

  async disconnect(): Promise<void> {
    this.eventSource?.close();
    this.requestQueue.clear();
  }

  async sendRequest(method: string, params?: unknown): Promise<unknown> {
    const id = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    return fetch(this.serverConfig.url!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.serverConfig.headers
      },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params })
    }).then(r => r.json());
  }

  async listTools(): Promise<MCPTool[]> {
    const response = await this.sendRequest('tools/list');
    return (response as { tools?: MCPTool[] })?.tools || [];
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest('tools/call', { name: toolName, arguments: args });
  }
}

/**
 * Streamable HTTP transport for MCP servers
 */
export class StreamableHTTPTransport extends SSETransport {
  constructor(config: MCPServerConfig) {
    super({ ...config, transport: 'streamable-http' });
  }

  // StreamableHTTP specific methods would go here
}

// ============ MCP Bridge ============

export class MCPBridge {
  private connections = new Map<string, MCPConnection>();
  private servers = new Map<string, MCPServerConfig>();
  private registeredTools: ToolDefinition[] = [];

  constructor() {
    this.loadDefaultServers();
  }

  private loadDefaultServers(): void {
    // Example servers that could be configured
    // In production, these would be loaded from config
  }

  /**
   * Add an MCP server configuration
   */
  addServer(config: MCPServerConfig): void {
    this.servers.set(config.name, config);
  }

  /**
   * Remove an MCP server configuration
   */
  removeServer(name: string): void {
    this.servers.delete(name);
    this.disconnectServer(name);
  }

  /**
   * Connect to an MCP server
   */
  async connectServer(name: string): Promise<boolean> {
    const config = this.servers.get(name);
    if (!config) {
      console.error(`[MCP.Bridge] Server not found: ${name}`);
      return false;
    }

    let transport: StdioMCPTransport | SSETransport | StreamableHTTPTransport;

    switch (config.transport) {
      case 'stdio':
        transport = new StdioMCPTransport(config);
        break;
      case 'sse':
        transport = new SSETransport(config);
        break;
      case 'streamable-http':
      default:
        transport = new StreamableHTTPTransport(config);
        break;
    }

    try {
      await transport.connect();

      const tools = await transport.listTools();

      this.connections.set(name, {
        serverName: name,
        transport: config.transport || 'stdio',
        isConnected: true,
        tools,
        lastPing: Date.now()
      });

      // Register tools from this server
      for (const tool of tools) {
        this.registerMCTool(name, tool);
      }

      console.log(`[MCP.Bridge] Connected to ${name} with ${tools.length} tools`);
      return true;
    } catch (error) {
      console.error(`[MCP.Bridge] Failed to connect to ${name}:`, error);
      return false;
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnectServer(name: string): Promise<void> {
    const connection = this.connections.get(name);
    if (connection) {
      // Would disconnect transport here
      this.connections.delete(name);
    }
  }

  /**
   * Register an MCP tool in the tool registry
   */
  private registerMCTool(serverName: string, mcpTool: MCPTool): void {
    const tool: ToolDefinition = {
      name: `mcp_${serverName}_${mcpTool.name}`,
      description: `[${serverName}] ${mcpTool.description}`,
      inputSchema: mcpTool.inputSchema as Record<string, unknown>,
      handler: async (args, ctx) => {
        const connection = this.connections.get(serverName);
        if (!connection) {
          throw new Error(`Not connected to ${serverName}`);
        }

        // Route to appropriate transport
        if (connection.transport === 'stdio') {
          const transport = new StdioMCPTransport(this.servers.get(serverName)!);
          return transport.callTool(mcpTool.name, args);
        } else {
          const transport = new SSETransport(this.servers.get(serverName)!);
          return transport.callTool(mcpTool.name, args);
        }
      }
    };

    this.registeredTools.push(tool);
  }

  /**
   * Get all registered tools from all connected MCP servers
   */
  getAllTools(): ToolDefinition[] {
    return [...this.registeredTools];
  }

  /**
   * Get connection status for all servers
   */
  getConnectionStatus(): Array<{ name: string; connected: boolean; toolCount: number }> {
    return Array.from(this.connections.values()).map(conn => ({
      name: conn.serverName,
      connected: conn.isConnected,
      toolCount: conn.tools.length
    }));
  }

  /**
   * List configured servers
   */
  listServers(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  /**
   * List connected servers
   */
  listConnectedServers(): string[] {
    return Array.from(this.connections.values())
      .filter(c => c.isConnected)
      .map(c => c.serverName);
  }
}

// Singleton export
export const mcpBridge = new MCPBridge();