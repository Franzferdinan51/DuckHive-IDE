import { create } from 'zustand';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

interface AgentState {
  sessionId: string | null;
  sessionStatus: string;
  messages: Message[];
  provider: string;
  model: string;
  tokenUsage: number;
  session: AgentSession | null;
}

interface AgentSession {
  id: string;
  status: string;
  messages: Message[];
}

interface AgentActions {
  setSession: (session: AgentSession) => void;
  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
}

type AgentStore = AgentState & AgentActions;

export const useAgentStore = create<AgentStore>((set, get) => ({
  sessionId: null,
  sessionStatus: 'idle',
  messages: [],
  provider: 'minimax',
  model: 'minimax-01',
  tokenUsage: 0,
  session: null,

  setSession: (session) => set({
    sessionId: session.id,
    sessionStatus: session.status,
    messages: session.messages,
    session
  }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    )
  })),

  sendMessage: async (content) => {
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      sessionStatus: 'running'
    }));

    // In a real implementation, this would call the Tauri backend
    // which would invoke the AgentCore
    try {
      // Simulate agent response
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `This is a placeholder response. In the full implementation, this would invoke the Tauri backend which runs the AgentCore TypeScript runtime. The response would be streamed in real-time.\n\nYou said: "${content}"`,
        toolCalls: []
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        sessionStatus: 'idle'
      }));
    } catch (error) {
      set({ sessionStatus: 'failed' });
      console.error('Agent error:', error);
    }
  }
}));

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function timestamp(): number {
  return Date.now();
}