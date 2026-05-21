/**
 * DuckHive-IDE Tool Registry
 *
 * Central registry for all tools available to the agent.
 * Tools can be registered by the core system or via MCP servers.
 */

import type { ToolDefinition, ToolHandler, ToolContext } from './agent-core';

export { ToolDefinition, ToolHandler, ToolContext };

interface RegisteredTool {
  definition: ToolDefinition;
  enabled: boolean;
  permissions: ToolPermission[];
}

type ToolPermission =
  | 'read'       // Can read files/data
  | 'write'      // Can write files/data
  | 'execute'    // Can execute commands
  | 'network'    // Can make network requests
  | 'spawn';     // Can spawn sub-agents

interface ToolCategory {
  name: string;
  description: string;
  tools: Map<string, RegisteredTool>;
}

export class ToolRegistry {
  private categories: Map<string, ToolCategory> = new Map();
  private toolsByName: Map<string, RegisteredTool> = new Map();

  constructor() {
    this.initializeBuiltInCategories();
  }

  /**
   * Initialize the built-in tool categories
   */
  private initializeBuiltInCategories(): void {
    this.registerCategory({
      name: 'file',
      description: 'File operations'
    });

    this.registerCategory({
      name: 'bash',
      description: 'Shell and command execution'
    });

    this.registerCategory({
      name: 'agent',
      description: 'Agent spawning and delegation'
    });

    this.registerCategory({
      name: 'council',
      description: 'AI Council interactions'
    });

    this.registerCategory({
      name: 'media',
      description: 'Media generation (image, speech, music, video)'
    });

    this.registerCategory({
      name: 'mcp',
      description: 'MCP server tools'
    });
  }

  /**
   * Register a new category
   */
  registerCategory(category: { name: string; description: string }): void {
    this.categories.set(category.name, {
      name: category.name,
      description: category.description,
      tools: new Map()
    });
  }

  /**
   * Register a tool in a category
   */
  register(
    categoryName: string,
    definition: ToolDefinition,
    options?: { enabled?: boolean; permissions?: ToolPermission[] }
  ): void {
    // Ensure category exists
    if (!this.categories.has(categoryName)) {
      this.registerCategory({ name: categoryName, description: categoryName });
    }

    const category = this.categories.get(categoryName)!;
    const registered: RegisteredTool = {
      definition,
      enabled: options?.enabled ?? true,
      permissions: options?.permissions ?? ['read']
    };

    category.tools.set(definition.name, registered);
    this.toolsByName.set(definition.name, registered);
  }

  /**
   * Get a tool by name
   */
  get(name: string): ToolDefinition | undefined {
    return this.toolsByName.get(name)?.definition;
  }

  /**
   * Get all tools
   */
  getAll(): ToolDefinition[] {
    return Array.from(this.toolsByName.values())
      .filter(t => t.enabled)
      .map(t => t.definition);
  }

  /**
   * Get tools by category
   */
  getByCategory(categoryName: string): ToolDefinition[] {
    const category = this.categories.get(categoryName);
    if (!category) return [];

    return Array.from(category.tools.values())
      .filter(t => t.enabled)
      .map(t => t.definition);
  }

  /**
   * Enable or disable a tool
   */
  setEnabled(name: string, enabled: boolean): void {
    const tool = this.toolsByName.get(name);
    if (tool) {
      tool.enabled = enabled;
    }
  }

  /**
   * Check if a tool has a specific permission
   */
  hasPermission(name: string, permission: ToolPermission): boolean {
    const tool = this.toolsByName.get(name);
    return tool?.permissions.includes(permission) ?? false;
  }

  /**
   * Get all categories with their tools
   */
  getCategories(): Array<{ name: string; description: string; tools: ToolDefinition[] }> {
    return Array.from(this.categories.values()).map(c => ({
      name: c.name,
      description: c.description,
      tools: Array.from(c.tools.values())
        .filter(t => t.enabled)
        .map(t => t.definition)
    }));
  }

  /**
   * Get all tool names grouped by category
   */
  getToolMap(): Record<string, string[]> {
    const map: Record<string, string[]> = {};
    for (const [catName, category] of this.categories) {
      map[catName] = Array.from(category.tools.values())
        .filter(t => t.enabled)
        .map(t => t.definition.name);
    }
    return map;
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();

// Export for DI
export function createToolRegistry(): ToolRegistry {
  return new ToolRegistry();
}