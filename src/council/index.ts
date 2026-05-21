/**
 * DuckHive-IDE AI Council System
 *
 * The AI Council is a multi-agent adversarial review system with coding-focused
 * councilors that provide diverse perspectives on code quality, security,
 * architecture, testing, and best practices.
 */

// ============ Councilor Types ============

export interface Councilor {
  id: string;
  name: string;
  role: string;
  specialty: string;
  description: string;
  personality: string;
  color: string;
  enabled: boolean;
  weight: number;
}

export interface CouncilVerdict {
  councilorId: string;
  verdict: 'approve' | 'reject' | 'abstain';
  confidence: number;
  findings: string[];
  suggestions: string[];
}

export interface CouncilSession {
  id: string;
  topic: string;
  code: string;
  councilors: Councilor[];
  verdicts: CouncilVerdict[];
  status: 'deliberating' | 'voting' | 'complete';
  createdAt: number;
}

// ============ Default Councilors ============

export const DEFAULT_COUNCILORS: Councilor[] = [
  // Security Council (6) - Code security focused
  { id: 'sec-001', name: 'SecuritySage', role: 'Security Expert', specialty: 'vulnerability detection', description: 'Finds security flaws and exposes attack surfaces in code', personality: 'skeptical, thorough, paranoid', color: '#f85149', enabled: true, weight: 1.5 },
  { id: 'sec-002', name: 'CryptoKnight', role: 'Cryptographer', specialty: 'encryption & hashing', description: 'Reviews cryptographic implementations in code', personality: 'precise, mathematical', color: '#f85149', enabled: true, weight: 1.2 },
  { id: 'sec-003', name: 'AuthGuardian', role: 'Auth Specialist', specialty: 'authentication systems', description: 'Reviews auth flows and session management code', personality: 'cautious, methodical', color: '#f85149', enabled: true, weight: 1.3 },
  { id: 'sec-004', name: 'InjectionHunter', role: 'Injection Expert', specialty: 'SQL/XSS/CSRF injection', description: 'Hunts for injection vulnerabilities in code', personality: 'methodical, exhausts edge cases', color: '#f85149', enabled: true, weight: 1.4 },
  { id: 'sec-005', name: 'SecretScanner', role: 'Secrets Management', specialty: 'API keys, tokens, credentials', description: 'Detects hardcoded secrets and credentials in code', personality: 'vigilant, pattern-matching', color: '#f85149', enabled: true, weight: 1.2 },
  { id: 'sec-006', name: 'InputValidator', role: 'Input Validation', specialty: 'data sanitization', description: 'Reviews input validation and data sanitization', personality: 'paranoid, defensive', color: '#f85149', enabled: true, weight: 1.2 },

  // Performance Council (6) - Code performance focused
  { id: 'perf-001', name: 'PerfGuru', role: 'Performance Analyst', specialty: 'bottleneck identification', description: 'Identifies performance bottlenecks in code', personality: 'data-driven, precise', color: '#3fb950', enabled: true, weight: 1.4 },
  { id: 'perf-002', name: 'MemoryHog', role: 'Memory Expert', specialty: 'memory optimization', description: 'Reviews memory usage patterns and leaks', personality: 'paranoid about leaks', color: '#3fb950', enabled: true, weight: 1.2 },
  { id: 'perf-003', name: 'Algorithmician', role: 'Algorithm Specialist', specialty: 'algorithmic complexity', description: 'Analyzes algorithmic complexity and efficiency', personality: 'theoretical, exact', color: '#3fb950', enabled: true, weight: 1.3 },
  { id: 'perf-004', name: 'CacheMaster', role: 'Caching Specialist', specialty: 'memoization & caching', description: 'Reviews caching strategies and memoization', personality: 'optimistic but verify', color: '#3fb950', enabled: true, weight: 1.1 },
  { id: 'perf-005', name: 'ConcurrencyChef', role: 'Concurrency Expert', specialty: 'parallel execution', description: 'Reviews concurrent and parallel code patterns', personality: 'race-condition-aware', color: '#3fb950', enabled: true, weight: 1.2 },
  { id: 'perf-006', name: 'LoopOptimizer', role: 'Loop Specialist', specialty: 'iteration optimization', description: 'Optimizes loops and iteration patterns', personality: 'efficiency-obsessed', color: '#3fb950', enabled: true, weight: 1.1 },

  // Code Quality Council (8) - Code craftsmanship
  { id: 'qual-001', name: 'CleanCode', role: 'Code Quality', specialty: 'refactoring and style', description: 'Champion of clean code principles', personality: 'opinionated but fair', color: '#58a6ff', enabled: true, weight: 1.3 },
  { id: 'qual-002', name: 'SOLIDifier', role: 'SOLID Principles', specialty: 'OOP design', description: 'Reviews adherence to SOLID principles', personality: 'dogmatic but educational', color: '#58a6ff', enabled: true, weight: 1.2 },
  { id: 'qual-003', name: 'DRYenforcer', role: 'DRY Advocate', specialty: 'code duplication', description: 'Eliminates code duplication', personality: 'repetitive about repetition', color: '#58a6ff', enabled: true, weight: 1.1 },
  { id: 'qual-004', name: 'NamingNazi', role: 'Nomenclature Expert', specialty: 'naming conventions', description: 'Cruelly judges bad variable and function names', personality: 'irritable but right', color: '#58a6ff', enabled: true, weight: 1.1 },
  { id: 'qual-005', name: 'CommentCritic', role: 'Documentation', specialty: 'comments and docs', description: 'Reviews code comments and documentation', personality: 'verbose but clear', color: '#58a6ff', enabled: true, weight: 1.0 },
  { id: 'qual-006', name: 'ComplexityCop', role: 'Cyclomatic Complexity', specialty: 'complexity reduction', description: 'Holds code complexity accountable', personality: 'strict, measured', color: '#58a6ff', enabled: true, weight: 1.1 },
  { id: 'qual-007', name: 'ImportInspector', role: 'Import Management', specialty: 'dependency hygiene', description: 'Reviews imports and dependency organization', personality: 'minimalist', color: '#58a6ff', enabled: true, weight: 0.9 },
  { id: 'qual-008', name: 'TypeEnforcer', role: 'Type Safety', specialty: 'TypeScript/JavaScript', description: 'Advocates for strong typing practices', personality: 'strict static typing', color: '#58a6ff', enabled: true, weight: 1.2 },

  // Architecture Council (6) - Code structure focused
  { id: 'arch-001', name: 'ArchWizard', role: 'Architecture Expert', specialty: 'system design', description: 'Reviews architectural decisions and design patterns', personality: 'visionary, pragmatic', color: '#bc8cff', enabled: true, weight: 1.4 },
  { id: 'arch-002', name: 'DesignPatternDan', role: 'Design Patterns', specialty: 'GOF patterns', description: 'Reviews proper design pattern usage', personality: 'pattern-conscious', color: '#bc8cff', enabled: true, weight: 1.2 },
  { id: 'arch-003', name: 'RefactorRex', role: 'Refactoring Specialist', specialty: 'code smells', description: 'Identifies code smells and refactoring opportunities', personality: 'restructuring', color: '#bc8cff', enabled: true, weight: 1.2 },
  { id: 'arch-004', name: 'CouplingCop', role: 'Coupling Analyst', specialty: 'module dependencies', description: 'Reviews coupling and module dependencies', personality: 'boundary-respecting', color: '#bc8cff', enabled: true, weight: 1.1 },
  { id: 'arch-005', name: 'CohesionQueen', role: 'Cohesion Specialist', specialty: 'single responsibility', description: 'Ensures high cohesion in modules and classes', personality: 'focused', color: '#bc8cff', enabled: true, weight: 1.0 },
  { id: 'arch-006', name: 'AbstractionAbby', role: 'Abstraction Expert', specialty: 'level of abstraction', description: 'Reviews appropriate abstraction levels', personality: 'layered thinking', color: '#bc8cff', enabled: true, weight: 1.1 },

  // Testing Council (6) - Code testing focused
  { id: 'test-001', name: 'TestMaster', role: 'Testing Specialist', specialty: 'test coverage', description: 'Ensures comprehensive test coverage', personality: 'thorough, obsessive', color: '#d29922', enabled: true, weight: 1.3 },
  { id: 'test-002', name: 'MockHunter', role: 'Mocking Expert', specialty: 'test doubles', description: 'Reviews proper usage of mocks and stubs', personality: 'skeptical of mocks', color: '#d29922', enabled: true, weight: 1.1 },
  { id: 'test-003', name: 'EdgeCaseEmma', role: 'Edge Case Analyst', specialty: 'edge cases', description: 'Finds untested edge cases and boundaries', personality: 'creative destruction', color: '#d29922', enabled: true, weight: 1.2 },
  { id: 'test-004', name: 'ArrangeActAssertAnnie', role: 'Test Structure', specialty: 'AAA pattern', description: 'Reviews test structure and AAA pattern', personality: 'structured', color: '#d29922', enabled: true, weight: 1.0 },
  { id: 'test-005', name: 'BDDchampion', role: 'BDD Specialist', specialty: 'behavior specs', description: 'Reviews BDD-style behavior specifications', personality: 'spec-driven', color: '#d29922', enabled: true, weight: 1.0 },
  { id: 'test-006', name: 'MutationMaven', role: 'Mutation Testing', specialty: 'fault injection', description: 'Reviews mutation testing coverage', personality: 'fault-injecting', color: '#d29922', enabled: true, weight: 1.0 },

  // Documentation Council (4) - Code docs focused
  { id: 'doc-001', name: 'DocuNinja', role: 'Documentation', specialty: 'docs completeness', description: 'Ensures complete code documentation', personality: 'thorough, organized', color: '#39c5cf', enabled: true, weight: 1.2 },
  { id: 'doc-002', name: 'APIDocAlex', role: 'API Documentation', specialty: 'API docs', description: 'Reviews API documentation quality', personality: 'spec-first', color: '#39c5cf', enabled: true, weight: 1.1 },
  { id: 'doc-003', name: 'JSDocJudy', role: 'JSDoc Specialist', specialty: 'inline docs', description: 'Reviews JSDoc and inline documentation', personality: 'annotating', color: '#39c5cf', enabled: true, weight: 1.0 },
  { id: 'doc-004', name: 'ReadmeRose', role: 'README Specialist', specialty: 'project docs', description: 'Reviews README and project documentation', personality: 'welcoming', color: '#39c5cf', enabled: true, weight: 1.0 },

  // Git/Branch Council (4) - Code collaboration focused
  { id: 'git-001', name: 'CommitMessageMike', role: 'Commits', specialty: 'commit conventions', description: 'Reviews commit message quality and conventions', personality: 'chronological', color: '#f97583', enabled: true, weight: 1.1 },
  { id: 'git-002', name: 'BranchNamingBrenda', role: 'Branching', specialty: 'branch conventions', description: 'Reviews branch naming conventions', personality: 'structured', color: '#f97583', enabled: true, weight: 1.0 },
  { id: 'git-003', name: 'MergeMaster', role: 'Merge Strategy', specialty: 'conflict resolution', description: 'Reviews merge strategies and conflict resolution', personality: 'cautious', color: '#f97583', enabled: true, weight: 1.1 },
  { id: 'git-004', name: 'PRreviewerPat', role: 'Code Review', specialty: 'pull request quality', description: 'Reviews pull request descriptions and scope', personality: 'thorough', color: '#f97583', enabled: true, weight: 1.2 },

  // Error Handling Council (4) - Code resilience focused
  { id: 'err-001', name: 'ExceptionElena', role: 'Exception Handling', specialty: 'try-catch patterns', description: 'Reviews exception handling patterns', personality: 'defensive', color: '#e8919d', enabled: true, weight: 1.2 },
  { id: 'err-002', name: 'ErrorRecoveryEddie', role: 'Recovery Patterns', specialty: 'retry logic', description: 'Reviews error recovery and retry logic', personality: 'resilient', color: '#e8919d', enabled: true, weight: 1.1 },
  { id: 'err-003', name: 'FallbackFrances', role: 'Fallback Strategies', specialty: 'graceful degradation', description: 'Reviews fallback and degradation strategies', personality: 'prepared', color: '#e8919d', enabled: true, weight: 1.0 },
  { id: 'err-004', name: 'NullCheckNate', role: 'Null Safety', specialty: 'undefined/null handling', description: 'Reviews null/undefined handling patterns', personality: 'cautious', color: '#e8919d', enabled: true, weight: 1.1 }
];

// ============ Council Manager ============

export class AICouncil {
  private councilors: Map<string, Councilor> = new Map();
  private sessions: Map<string, CouncilSession> = new Map();

  constructor() {
    this.loadCouncilors();
  }

  private loadCouncilors(): void {
    for (const councilor of DEFAULT_COUNCILORS) {
      this.councilors.set(councilor.id, { ...councilor });
    }
  }

  /**
   * Get all councilors
   */
  getCouncilors(enabledOnly = false): Councilor[] {
    const all = Array.from(this.councilors.values());
    return enabledOnly ? all.filter(c => c.enabled) : all;
  }

  /**
   * Get councilors by category
   */
  getCouncilorsByCategory(category: string): Councilor[] {
    const prefix = category.substring(0, 4);
    return Array.from(this.councilors.values()).filter(c => c.id.startsWith(prefix));
  }

  /**
   * Get category name from councilor ID
   */
  static getCategory(councilorId: string): string {
    const prefix = councilorId.substring(0, 4);
    const categories: Record<string, string> = {
      'sec-': 'Security',
      'perf': 'Performance',
      'qual': 'Code Quality',
      'arch': 'Architecture',
      'test': 'Testing',
      'doc-': 'Documentation',
      'git-': 'Git & Collaboration',
      'err-': 'Error Handling'
    };
    return categories[prefix] || 'General';
  }

  /**
   * Enable or disable a councilor
   */
  setCouncilorEnabled(id: string, enabled: boolean): boolean {
    const councilor = this.councilors.get(id);
    if (councilor) {
      councilor.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Create a new council session
   */
  createSession(topic: string, code: string, maxCouncilors = 5): CouncilSession {
    const enabledCouncilors = this.getCouncilors(true);

    // Sort by weight and take top maxCouncilors
    const selectedCouncilors = enabledCouncilors
      .sort((a, b) => b.weight - a.weight)
      .slice(0, maxCouncilors);

    const session: CouncilSession = {
      id: generateSessionId(),
      topic,
      code,
      councilors: selectedCouncilors,
      verdicts: [],
      status: 'deliberating',
      createdAt: Date.now()
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): CouncilSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Submit a verdict for a councilor
   */
  submitVerdict(sessionId: string, councilorId: string, verdict: CouncilVerdict): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const existingIndex = session.verdicts.findIndex(v => v.councilorId === councilorId);
    if (existingIndex >= 0) {
      session.verdicts[existingIndex] = verdict;
    } else {
      session.verdicts.push(verdict);
    }

    // Check if all councilors have voted
    if (session.verdicts.length === session.councilors.length) {
      session.status = 'complete';
    }
  }

  /**
   * Get aggregated verdict for a session
   */
  getAggregatedVerdict(sessionId: string): {
    decision: 'approve' | 'reject' | 'needs_work';
    confidence: number;
    summary: string;
    councilorCount: number;
    approveCount: number;
    rejectCount: number;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'complete') return null;

    let approveCount = 0;
    let rejectCount = 0;
    let totalConfidence = 0;

    for (const verdict of session.verdicts) {
      if (verdict.verdict === 'approve') approveCount++;
      else if (verdict.verdict === 'reject') rejectCount++;
      totalConfidence += verdict.confidence;
    }

    const avgConfidence = totalConfidence / session.verdicts.length;
    const totalWeight = session.councilors.reduce((sum, c) => sum + c.weight, 0);
    const approveWeight = session.verdicts
      .filter(v => v.verdict === 'approve')
      .reduce((sum, v) => sum + (this.councilors.get(v.councilorId)?.weight || 1), 0);

    const approvalRatio = approveWeight / totalWeight;

    let decision: 'approve' | 'reject' | 'needs_work';
    if (approvalRatio >= 0.7) decision = 'approve';
    else if (approvalRatio <= 0.3) decision = 'reject';
    else decision = 'needs_work';

    return {
      decision,
      confidence: avgConfidence,
      summary: `${approveCount} approve, ${rejectCount} reject out of ${session.councilors.length} councilors`,
      councilorCount: session.councilors.length,
      approveCount,
      rejectCount
    };
  }
}

// ============ Helper Functions ============

function generateSessionId(): string {
  return `council-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Singleton export
export const aiCouncil = new AICouncil();