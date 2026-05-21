/**
 * DuckHive-IDE TypeScript AgentCore
 *
 * The core runtime for AI agent execution. Based on DuckHive-CLI's agent-core,
 * modified for IDE integration with Tauri IPC.
 */

// Agent lifecycle states
export type AgentStatus =
  | 'idle'
  | 'preparing'
  | 'running'
  | 'awaiting_approval'
  | 'paused'
  | 'recovering'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Tool call structure
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

// Message in the agent conversation
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  timestamp: number;
}

// Agent session
export interface AgentSession {
  id: string;
  status: AgentStatus;
  messages: AgentMessage[];
  model: string;
  provider: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

// Tool definition
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: ToolHandler;
}

// Tool handler function signature
export type ToolHandler = (
  args: Record<string, unknown>,
  context: ToolContext
) => Promise<unknown>;

// Context passed to tool handlers
export interface ToolContext {
  sessionId: string;
  workspacePath: string;
  session: AgentSession;
}

// Configuration for AgentCore
export interface AgentCoreConfig {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  workspacePath: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * AgentCore - The heart of the agent runtime
 *
 * Manages agent sessions, tool execution, and the model interaction loop.
 * This is the TypeScript runtime that runs inside the Tauri Rust backend.
 */
export class AgentCore {
  private config: AgentCoreConfig;
  private tools: Map<string, ToolDefinition> = new Map();
  private sessions: Map<string, AgentSession> = new Map();
  private modelClient: ModelClient | null = null;

  constructor(config: AgentCoreConfig) {
    this.config = config;
  }

  /**
   * Initialize the AgentCore with tools and model client
   */
  async initialize(): Promise<void> {
    // Initialize model client based on provider
    this.modelClient = createModelClient(this.config);

    // Register built-in tools
    this.registerBuiltInTools();
  }

  /**
   * Register a tool in the tool registry
   */
  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Register built-in file, bash, and agent tools
   */
  private registerBuiltInTools(): void {
    // File tools
    this.registerTool({
      name: 'read',
      description: 'Read contents of a file',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file to read' }
        },
        required: ['path']
      },
      handler: this.readFileTool.bind(this)
    });

    this.registerTool({
      name: 'write',
      description: 'Write content to a file',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path to the file to write' },
          content: { type: 'string', description: 'Content to write' }
        },
        required: ['path', 'content']
      },
      handler: this.writeFileTool.bind(this)
    });

    this.registerTool({
      name: 'glob',
      description: 'Find files matching a pattern',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Glob pattern to match' },
          cwd: { type: 'string', description: 'Working directory' }
        },
        required: ['pattern']
      },
      handler: this.globTool.bind(this)
    });

    this.registerTool({
      name: 'grep',
      description: 'Search for pattern in files',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex pattern to search' },
          path: { type: 'string', description: 'Directory to search in' },
          flags: { type: 'string', description: 'Regex flags (e.g., "i" for case-insensitive)' }
        },
        required: ['pattern', 'path']
      },
      handler: this.grepTool.bind(this)
    });

    // Bash tool
    this.registerTool({
      name: 'bash',
      description: 'Execute a bash/shell command',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command to execute' },
          cwd: { type: 'string', description: 'Working directory' },
          timeout: { type: 'number', description: 'Timeout in milliseconds' }
        },
        required: ['command']
      },
      handler: this.bashTool.bind(this)
    });

    // Agent tools
    this.registerTool({
      name: 'spawn',
      description: 'Spawn a sub-agent with its own session',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'System prompt for the agent' },
          model: { type: 'string', description: 'Model to use' },
          tools: { type: 'array', items: { type: 'string' }, description: 'Tool names to enable' }
        },
        required: ['prompt']
      },
      handler: this.spawnTool.bind(this)
    });

    this.registerTool({
      name: 'task',
      description: 'Delegate a task to a sub-agent and await result',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Task description' },
          model: { type: 'string', description: 'Model to use' }
        },
        required: ['prompt']
      },
      handler: this.taskTool.bind(this)
    });

    // Council tool
    this.registerTool({
      name: 'council',
      description: 'Invoke AI Council for multi-perspective analysis',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Topic for council to debate' },
          maxCouncilors: { type: 'number', description: 'Maximum councilors to invoke' }
        },
        required: ['topic']
      },
      handler: this.councilTool.bind(this)
    });
  }

  /**
   * Create a new agent session
   */
  createSession(options?: { model?: string; provider?: string }): AgentSession {
    const session: AgentSession = {
      id: generateId(),
      status: 'idle',
      messages: [],
      model: options?.model ?? this.config.model,
      provider: options?.provider ?? this.config.provider,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): AgentSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Run the agent loop for a session
   */
  async run(sessionId: string, userMessage: string): Promise<AgentMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Update session status
    session.status = 'preparing';
    session.updatedAt = Date.now();

    // Add user message
    const message: AgentMessage = {
      id: generateId(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    session.messages.push(message);

    // Run the agent loop
    session.status = 'running';
    return this.agentLoop(session);
  }

  /**
   * The main agent loop: model → tools → model → tools → ...
   */
  private async agentLoop(session: AgentSession): Promise<AgentMessage> {
    const maxIterations = 100;
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;

      // Build context for model
      const context = this.buildContext(session);

      // Call the model
      const response = await this.modelClient!.complete(context);

      // If no tool calls, we're done
      if (!response.toolCalls || response.toolCalls.length === 0) {
        const assistantMessage: AgentMessage = {
          id: generateId(),
          role: 'assistant',
          content: response.content,
          timestamp: Date.now()
        };
        session.messages.push(assistantMessage);
        return assistantMessage;
      }

      // Add assistant message with tool calls
      const assistantMessage: AgentMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls.map(tc => ({
          id: tc.id,
          name: tc.name,
          arguments: tc.arguments,
          status: 'pending' as const
        })),
        timestamp: Date.now()
      };
      session.messages.push(assistantMessage);

      // Execute each tool call
      for (const tc of response.toolCalls) {
        await this.executeToolCall(session, tc);
      }
    }

    throw new Error(`Agent loop exceeded max iterations (${maxIterations})`);
  }

  /**
   * Build the context for a model call
   */
  private buildContext(session: AgentSession): ModelContext {
    return {
      messages: session.messages.map(m => ({
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls?.map(tc => ({
          id: tc.id,
          name: tc.name,
          arguments: tc.arguments
        }))
      })),
      tools: Array.from(this.tools.values()).map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      }))
    };
  }

  /**
   * Execute a tool call
   */
  private async executeToolCall(session: AgentSession, tc: ToolCall): Promise<void> {
    const tool = this.tools.get(tc.name);
    if (!tool) {
      // Mark as failed
      const msg = session.messages.find(m => m.toolCalls?.some(mtc => mtc.id === tc.id));
      msg?.toolCalls?.find(mtc => mtc.id === tc.id)!.status = 'failed';
      msg?.toolCalls?.find(mtc => mtc.id === tc.id)!.error = `Tool not found: ${tc.name}`;
      return;
    }

    // Mark as executing
    const msg = session.messages.find(m => m.toolCalls?.some(mtc => mtc.id === tc.id));
    msg?.toolCalls?.find(mtc => mtc.id === tc.id)!.status = 'executing';

    try {
      const context: ToolContext = {
        sessionId: session.id,
        workspacePath: this.config.workspacePath,
        session
      };

      const result = await tool.handler(tc.arguments, context);

      // Mark as completed
      msg?.toolCalls?.find(mtc => mtc.id === tc.id)!.status = 'completed';
      msg?.toolCalls?.find(mtc => mtc.id === tc.id)!.result = result;

      // Add tool result as a message
      const toolMessage: AgentMessage = {
        id: generateId(),
        role: 'tool',
        content: JSON.stringify(result),
        timestamp: Date.now()
      };
      session.messages.push(toolMessage);
    } catch (error) {
      // Mark as failed
      msg?.toolCalls?.find(mtc => mtc.id === tc.id)!.status = 'failed';
      msg?.toolCalls?.find(mtc => mtc.id === tc.id)!.error = String(error);

      // Add error as a message
      const errorMessage: AgentMessage = {
        id: generateId(),
        role: 'tool',
        content: `Error: ${error}`,
        timestamp: Date.now()
      };
      session.messages.push(errorMessage);
    }
  }

  // ============ Built-in Tool Handlers ============

  private async readFileTool(args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.resolve(ctx.workspacePath, args.path as string);
    const content = await fs.readFile(filePath, 'utf-8');
    return { path: filePath, content, size: content.length };
  }

  private async writeFileTool(args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.resolve(ctx.workspacePath, args.path as string);
    await fs.writeFile(filePath, args.content as string, 'utf-8');
    return { path: filePath, written: true };
  }

  private async globTool(args: Record<string, unknown>, _ctx: ToolContext): Promise<unknown> {
    // Simple glob implementation - in production would use a proper glob library
    const pattern = args.pattern as string;
    const cwd = (args.cwd as string) || '.';
    return { pattern, cwd, matches: [] };
  }

  private async grepTool(args: Record<string, unknown>, _ctx: ToolContext): Promise<unknown> {
    const pattern = args.pattern as string;
    const path = args.path as string;
    return { pattern, path, matches: [] };
  }

  private async bashTool(args: Record<string, unknown>, _ctx: ToolContext): Promise<unknown> {
    // Bash execution would be handled by Tauri backend for security
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  private async spawnTool(args: Record<string, unknown>, _ctx: ToolContext): Promise<unknown> {
    // Spawn would create a new AgentCore instance in a worker
    return { sessionId: generateId(), status: 'idle' };
  }

  private async taskTool(args: Record<string, unknown>, _ctx: ToolContext): Promise<unknown> {
    // Task would delegate to a sub-agent and await result
    return { result: 'Task delegated' };
  }

  private async councilTool(args: Record<string, unknown>, _ctx: ToolContext): Promise<unknown> {
    // Council invocation would trigger the AI Council system
    return { councilors: [], verdict: 'pending' };
  }
}

// ============ Helper Types & Functions ============

interface ModelContext {
  messages: Array<{
    role: string;
    content: string;
    toolCalls?: Array<{ id: string; name: string; arguments: Record<string, unknown> }>;
  }>;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }>;
}

interface ModelResponse {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
}

interface ModelClient {
  complete(context: ModelContext): Promise<ModelResponse>;
}

/**
 * Create a model client based on provider configuration
 */
function createModelClient(config: AgentCoreConfig): ModelClient {
  // Placeholder - actual implementation would use fetch to call the LLM API
  return {
    async complete(context: ModelContext): Promise<ModelResponse> {
      return {
        content: 'DuckHive-IDE AgentCore initialized. Awaiting model connection...',
        toolCalls: []
      };
    }
  };
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Export for use by Tauri backend
export { AgentCore as default };