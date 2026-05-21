/**
 * DuckHive-IDE Memory System
 *
 * 3-layer memory architecture:
 * 1. BM25 - Fast keyword search over recent context
 * 2. Embed - Semantic search via vector embeddings
 * 3. LESSONS - Learned insights persisting across sessions
 */

import type { AgentSession } from '../agent-core';

// ============ Memory Types ============

export interface MemoryEntry {
  id: string;
  type: 'bm25' | 'embed' | 'lessons';
  content: string;
  embedding?: number[];
  metadata: MemoryMetadata;
  createdAt: number;
  accessedAt: number;
  accessCount: number;
}

export interface MemoryMetadata {
  sessionId?: string;
  projectPath?: string;
  tags?: string[];
  importance?: number; // 0-1, used for LESSONS pruning
  source?: 'user' | 'agent' | 'council' | 'system';
}

export interface MemoryQuery {
  text?: string;
  tags?: string[];
  limit?: number;
  sessionId?: string;
}

export interface MemoryStats {
  totalEntries: number;
  byType: { bm25: number; embed: number; lessons: number };
  avgAccessCount: number;
  storageSize: number;
}

// ============ BM25 Layer ============

export class BM25Memory {
  private entries: Map<string, MemoryEntry> = new Map();
  private index: BM25Index = new BM25Index();

  add(content: string, metadata: MemoryMetadata = {}): MemoryEntry {
    const entry: MemoryEntry = {
      id: generateId('bm25'),
      type: 'bm25',
      content,
      metadata: { ...metadata, source: metadata.source || 'agent' },
      createdAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 0
    };

    this.entries.set(entry.id, entry);
    this.index.add(entry.id, content);

    // Limit BM25 entries to prevent unbounded growth (keep most recent 1000)
    if (this.entries.size > 1000) {
      this.pruneOldest(100);
    }

    return entry;
  }

  search(query: string, limit = 10): MemoryEntry[] {
    const ids = this.index.search(query, limit);
    return ids
      .map(id => this.entries.get(id))
      .filter((e): e is MemoryEntry => e !== undefined)
      .map(e => {
        e.accessedAt = Date.now();
        e.accessCount++;
        return e;
      });
  }

  getRecent(limit = 50): MemoryEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  delete(id: string): boolean {
    const entry = this.entries.get(id);
    if (entry) {
      this.index.remove(id);
      return this.entries.delete(id);
    }
    return false;
  }

  private pruneOldest(count: number): void {
    const sorted = Array.from(this.entries.values())
      .sort((a, b) => a.accessedAt - b.accessedAt);

    for (let i = 0; i < count && i < sorted.length; i++) {
      this.delete(sorted[i].id);
    }
  }

  getStats(): { count: number } {
    return { count: this.entries.size };
  }
}

// Simple BM25 index (in production would use a proper BM25 library)
class BM25Index {
  private documents: Map<string, string> = new Map();
  private documentLengths: Map<string, number> = new Map();
  private vocabulary: Map<string, Set<string>> = new Map();
  private avgDocLength = 0;

  add(id: string, text: string): void {
    this.documents.set(id, text);
    const words = text.toLowerCase().split(/\s+/);
    this.documentLengths.set(id, words.length);

    // Update vocabulary
    for (const word of words) {
      if (!this.vocabulary.has(word)) {
        this.vocabulary.set(word, new Set());
      }
      this.vocabulary.get(word)!.add(id);
    }

    // Update average
    const totalLength = Array.from(this.documentLengths.values()).reduce((a, b) => a + b, 0);
    this.avgDocLength = totalLength / this.documents.size;
  }

  remove(id: string): void {
    this.documents.delete(id);
    this.documentLengths.delete(id);

    for (const wordSet of this.vocabulary.values()) {
      wordSet.delete(id);
    }
  }

  search(query: string, limit: number): string[] {
    const queryWords = query.toLowerCase().split(/\s+/);
    const scores: Map<string, number> = new Map();

    for (const word of queryWords) {
      const docIds = this.vocabulary.get(word);
      if (!docIds) continue;

      for (const docId of docIds) {
        const score = this.calculateBM25(docId, queryWords);
        scores.set(docId, (scores.get(docId) || 0) + score);
      }
    }

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
  }

  private calculateBM25(docId: string, queryWords: string[]): number {
    const k1 = 1.5;
    const b = 0.75;

    const docLength = this.documentLengths.get(docId) || 0;
    let score = 0;

    for (const word of queryWords) {
      const docIds = this.vocabulary.get(word);
      if (!docIds || !docIds.has(docId)) continue;

      const df = docIds.size;
      const idf = Math.log((this.documents.size - df + 0.5) / (df + 0.5) + 1);

      const docFreq = docId.split(/\s+/).filter(w => w === word).length;
      const tf = docFreq / docLength;

      score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLength / this.avgDocLength)));
    }

    return score;
  }
}

// ============ Embed Layer ============

export class EmbedMemory {
  private entries: Map<string, MemoryEntry> = new Map();
  private dimension: number = 1536; // OpenAI embedding dimension

  async add(content: string, metadata: MemoryMetadata = {}): Promise<MemoryEntry> {
    // In production, would call embedding API
    const embedding = await this.generateEmbedding(content);

    const entry: MemoryEntry = {
      id: generateId('embed'),
      type: 'embed',
      content,
      embedding,
      metadata: { ...metadata, source: metadata.source || 'agent' },
      createdAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 0
    };

    this.entries.set(entry.id, entry);
    return entry;
  }

  async search(query: string, limit = 10): Promise<MemoryEntry[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const scored = Array.from(this.entries.values()).map(entry => ({
      entry,
      score: this.cosineSimilarity(queryEmbedding, entry.embedding!)
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored
      .slice(0, limit)
      .map(({ entry }) => {
        entry.accessedAt = Date.now();
        entry.accessCount++;
        return entry;
      });
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Placeholder - in production would call embedding API
    // This creates a deterministic pseudo-embedding for demo
    const seed = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: this.dimension }, (_, i) =>
      Math.sin(seed * (i + 1) * 0.1) * 0.1
    );
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  getStats(): { count: number } {
    return { count: this.entries.size };
  }
}

// ============ LESSONS Layer ============

export interface Lesson {
  id: string;
  insight: string;
  context: string; // When this applies
  tags: string[];
  confidence: number; // 0-1, how confident we are this is correct
  timesApplied: number;
  successCount: number;
  failureCount: number;
  createdAt: number;
  lastAppliedAt?: number;
}

export class LessonsMemory {
  private lessons: Map<string, Lesson> = new Map();

  /**
   * Learn a new insight from an event
   */
  learn(
    insight: string,
    context: string,
    tags: string[] = [],
    outcome: 'success' | 'failure' = 'success'
  ): Lesson {
    const id = generateId('lesson');

    const lesson: Lesson = {
      id,
      insight,
      context,
      tags,
      confidence: outcome === 'success' ? 0.6 : 0.3,
      timesApplied: 0,
      successCount: outcome === 'success' ? 1 : 0,
      failureCount: outcome === 'failure' ? 1 : 0,
      createdAt: Date.now()
    };

    this.lessons.set(id, lesson);
    this.prune();

    return lesson;
  }

  /**
   * Apply lessons to update confidence
   */
  applyLesson(id: string, outcome: 'success' | 'failure'): void {
    const lesson = this.lessons.get(id);
    if (!lesson) return;

    lesson.timesApplied++;
    lesson.lastAppliedAt = Date.now();

    if (outcome === 'success') {
      lesson.successCount++;
      lesson.confidence = Math.min(0.95, lesson.confidence + 0.05);
    } else {
      lesson.failureCount++;
      lesson.confidence = Math.max(0.05, lesson.confidence - 0.1);
    }
  }

  /**
   * Recall relevant lessons
   */
  recall(context: string, limit = 5): Lesson[] {
    const contextLower = context.toLowerCase();
    const contextWords = contextLower.split(/\s+/);

    return Array.from(this.lessons.values())
      .filter(l => l.confidence > 0.3)
      .map(l => ({
        lesson: l,
        relevance: this.calculateRelevance(l, contextWords)
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map(({ lesson }) => lesson);
  }

  /**
   * Get all lessons
   */
  getAll(): Lesson[] {
    return Array.from(this.lessons.values())
      .sort((a, b) => b.confidence - a.confidence);
  }

  private calculateRelevance(lesson: Lesson, contextWords: string[]): number {
    let score = 0;

    // Context match
    for (const word of contextWords) {
      if (lesson.context.toLowerCase().includes(word)) score += 0.3;
      if (lesson.insight.toLowerCase().includes(word)) score += 0.2;
    }

    // Tag overlap
    for (const tag of lesson.tags) {
      if (contextWords.some(w => tag.includes(w) || w.includes(tag))) score += 0.2;
    }

    return Math.min(1, score);
  }

  /**
   * Prune low-confidence lessons to prevent unbounded growth
   */
  private prune(): void {
    if (this.lessons.size <= 100) return;

    const sorted = Array.from(this.lessons.values())
      .sort((a, b) => a.confidence - b.confidence);

    // Remove bottom 20% of lessons
    const toRemove = Math.floor(this.lessons.size * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.lessons.delete(sorted[i].id);
    }
  }

  getStats(): { count: number; avgConfidence: number } {
    const lessons = Array.from(this.lessons.values());
    if (lessons.length === 0) return { count: 0, avgConfidence: 0 };

    const avgConfidence = lessons.reduce((sum, l) => sum + l.confidence, 0) / lessons.length;
    return { count: lessons.length, avgConfidence };
  }
}

// ============ Memory Manager ============

export class MemoryManager {
  readonly bm25: BM25Memory;
  readonly embed: EmbedMemory;
  readonly lessons: LessonsMemory;

  constructor() {
    this.bm25 = new BM25Memory();
    this.embed = new EmbedMemory();
    this.lessons = new LessonsMemory();
  }

  /**
   * Store a memory entry in appropriate layers
   */
  async store(content: string, metadata: MemoryMetadata = {}): Promise<void> {
    // Always store in BM25 for keyword search
    this.bm25.add(content, metadata);

    // Store in embed layer for semantic search
    await this.embed.add(content, metadata);
  }

  /**
   * Search all memory layers
   */
  async search(query: string, limit = 10): Promise<MemoryEntry[]> {
    // Get BM25 results
    const bm25Results = this.bm25.search(query, limit);

    // Get embed results
    const embedResults = await this.embed.search(query, limit);

    // Merge and dedupe (prefer higher access count)
    const byId = new Map<string, MemoryEntry>();
    for (const r of [...bm25Results, ...embedResults]) {
      const existing = byId.get(r.id);
      if (!existing || r.accessCount > existing.accessCount) {
        byId.set(r.id, r);
      }
    }

    return Array.from(byId.values()).slice(0, limit);
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    const bm25Stats = this.bm25.getStats();
    const embedStats = this.embed.getStats();
    const lessonsStats = this.lessons.getStats();

    return {
      totalEntries: bm25Stats.count + embedStats.count + lessonsStats.count,
      byType: {
        bm25: bm25Stats.count,
        embed: embedStats.count,
        lessons: lessonsStats.count
      },
      avgAccessCount: 0, // Would calculate from all entries
      storageSize: 0 // Would calculate actual bytes
    };
  }

  /**
   * Learn from an outcome
   */
  learnFromOutcome(
    insight: string,
    context: string,
    tags: string[],
    outcome: 'success' | 'failure'
  ): void {
    this.lessons.learn(insight, context, tags, outcome);
  }
}

// Singleton export
export const memoryManager = new MemoryManager();

// ============ Helper Functions ============

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}