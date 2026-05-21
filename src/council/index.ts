/**
 * DuckHive-IDE AI Council System
 *
 * The AI Council is a multi-agent adversarial review system with 46 councilors
 * that provide diverse perspectives on code, security, architecture, and more.
 */

import type { AgentSession } from './agent-core';

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
  // Security Council (8)
  { id: 'sec-001', name: 'SecuritySage', role: 'Security Expert', specialty: 'vulnerability detection', description: 'Finds security flaws and exposes attack surfaces', personality: 'skeptical, thorough, paranoid', color: '#f85149', enabled: true, weight: 1.5 },
  { id: 'sec-002', name: 'CryptoKnight', role: 'Cryptographer', specialty: 'encryption & hashing', description: 'Reviews cryptographic implementations', personality: 'precise, mathematical', color: '#f85149', enabled: true, weight: 1.2 },
  { id: 'sec-003', name: 'AuthGuardian', role: 'Auth Specialist', specialty: 'authentication systems', description: 'Reviews auth flows and session management', personality: 'cautious, methodical', color: '#f85149', enabled: true, weight: 1.3 },
  { id: 'sec-004', name: 'InjectionHunter', role: 'Injection Expert', specialty: 'SQL/XSS/CSI injection', description: 'Hunts for injection vulnerabilities', personality: 'methodical, exhausts edge cases', color: '#f85149', enabled: true, weight: 1.4 },
  { id: 'sec-005', name: 'PrivilegeEsc', role: 'Privilege Escalation', specialty: 'access control', description: 'Reviews privilege and permission systems', personality: 'challenge-everything', color: '#f85149', enabled: false, weight: 1.1 },
  { id: 'sec-006', name: 'CryptoAudit', role: 'Code Auditor', specialty: 'security audits', description: 'Performs comprehensive security audits', personality: 'systematic, detail-oriented', color: '#f85149', enabled: false, weight: 1.0 },
  { id: 'sec-007', name: 'ThreatModel', role: 'Threat Modeler', specialty: 'threat modeling', description: 'Creates threat models for systems', personality: 'holistic, risk-aware', color: '#f85149', enabled: false, weight: 1.0 },
  { id: 'sec-008', name: 'ZeroDayFinder', role: 'Vulnerability Researcher', specialty: '0-day discovery', description: 'Finds novel vulnerability classes', personality: 'creative, boundary-pushing', color: '#f85149', enabled: false, weight: 0.9 },

  // Performance Council (6)
  { id: 'perf-001', name: 'PerfGuru', role: 'Performance Analyst', specialty: 'bottleneck identification', description: 'Identifies performance bottlenecks', personality: 'data-driven, precise', color: '#3fb950', enabled: true, weight: 1.4 },
  { id: 'perf-002', name: 'MemoryHog', role: 'Memory Expert', specialty: 'memory optimization', description: 'Reviews memory usage patterns', personality: 'paranoid about leaks', color: '#3fb950', enabled: true, weight: 1.2 },
  { id: 'perf-003', name: 'Algorithmician', role: 'Algorithm Specialist', specialty: 'algorithmic complexity', description: 'Analyzes algorithmic complexity', personality: 'theoretical, exact', color: '#3fb950', enabled: true, weight: 1.3 },
  { id: 'perf-004', name: 'CacheMaster', role: 'Caching Specialist', specialty: 'cache optimization', description: 'Reviews caching strategies', personality: 'optimistic but verify', color: '#3fb950', enabled: false, weight: 1.1 },
  { id: 'perf-005', name: 'ConcurrencyChef', role: 'Concurrency Expert', specialty: 'parallel execution', description: 'Reviews concurrent code', personality: 'race-condition-aware', color: '#3fb950', enabled: false, weight: 1.2 },
  { id: 'perf-006', name: 'Startup Ninja', role: 'Startup Time Expert', specialty: 'initialization speed', description: 'Optimizes startup time', personality: 'impatient, efficiency-obsessed', color: '#3fb950', enabled: false, weight: 1.0 },

  // Code Quality Council (8)
  { id: 'qual-001', name: 'CleanCode', role: 'Code Quality', specialty: 'refactoring and style', description: 'Champion of clean code principles', personality: 'opinionated but fair', color: '#58a6ff', enabled: true, weight: 1.3 },
  { id: 'qual-002', name: 'SOLIDifier', role: 'SOLID Principles', specialty: 'OOP design', description: 'Reviews adherence to SOLID principles', personality: 'dogmatic but educational', color: '#58a6ff', enabled: true, weight: 1.2 },
  { id: 'qual-003', name: 'DRYenforcer', role: 'DRY Advocate', specialty: 'code duplication', description: 'Eliminates code duplication', personality: 'repetitive about repetition', color: '#58a6ff', enabled: true, weight: 1.1 },
  { id: 'qual-004', name: 'NamingNazi', role: 'Nomenclature Expert', specialty: 'naming conventions', description: 'Cruelly judges bad names', personality: 'irritable but right', color: '#58a6ff', enabled: false, weight: 1.0 },
  { id: 'qual-005', name: 'CommentCritic', role: 'Documentation', specialty: 'comments and docs', description: 'Reviews code documentation', personality: 'verbose but clear', color: '#58a6ff', enabled: false, weight: 1.0 },
  { id: 'qual-006', name: 'ComplexityCop', role: 'Cyclomatic Complexity', specialty: 'complexity reduction', description: 'Holds complexity accountable', personality: 'strict, measured', color: '#58a6ff', enabled: false, weight: 1.1 },
  { id: 'qual-007', name: 'ImportInspector', role: 'Import Management', specialty: 'dependency hygiene', description: 'Reviews imports and dependencies', personality: 'minimalist', color: '#58a6ff', enabled: false, weight: 0.9 },
  { id: 'qual-008', name: 'TypeEnforcer', role: 'Type Safety', specialty: 'typeScript/JavaScript', description: 'Advocates for strong typing', personality: 'strict static typing', color: '#58a6ff', enabled: false, weight: 1.2 },

  // Architecture Council (6)
  { id: 'arch-001', name: 'ArchWizard', role: 'Architecture Expert', specialty: 'system design', description: 'Reviews architectural decisions', personality: 'visionary, pragmatic', color: '#bc8cff', enabled: true, weight: 1.4 },
  { id: 'arch-002', name: 'MicroserviceMaven', role: 'MSA Specialist', specialty: 'microservices', description: 'Reviews microservices patterns', personality: 'divide-and-conquer', color: '#bc8cff', enabled: true, weight: 1.1 },
  { id: 'arch-003', name: 'EventSourcingSage', role: 'Event Sourcing', specialty: 'event-driven architecture', description: 'Reviews event-driven systems', personality: 'time-travel perspective', color: '#bc8cff', enabled: false, weight: 1.0 },
  { id: 'arch-004', name: 'CQRSChampion', role: 'CQRS Specialist', specialty: 'command-query separation', description: 'Reviews CQRS patterns', personality: 'separatist', color: '#bc8cff', enabled: false, weight: 1.0 },
  { id: 'arch-005', name: 'HexagonalHero', role: 'Hexagonal Architecture', specialty: 'ports and adapters', description: 'Reviews hexagonal patterns', personality: 'boundary-respecting', color: '#bc8cff', enabled: false, weight: 1.0 },
  { id: 'arch-006', name: 'EventualConsistencyE', role: 'Distributed Systems', specialty: 'eventual consistency', description: 'Reviews distributed patterns', personality: 'patient, eventual', color: '#bc8cff', enabled: false, weight: 1.1 },

  // Testing Council (6)
  { id: 'test-001', name: 'TestMaster', role: 'Testing Specialist', specialty: 'test coverage', description: 'Ensures comprehensive test coverage', personality: 'thorough, obsessive', color: '#d29922', enabled: true, weight: 1.3 },
  { id: 'test-002', name: 'MockHunter', role: 'Mocking Expert', specialty: 'test doubles', description: 'Reviews test doubles usage', personality: 'skeptical of mocks', color: '#d29922', enabled: true, weight: 1.1 },
  { id: 'test-003', name: 'EdgeCaseEmma', role: 'Edge Case Analyst', specialty: 'edge cases', description: 'Finds untested edge cases', personality: 'creative destruction', color: '#d29922', enabled: true, weight: 1.2 },
  { id: 'test-004', name: 'PropertyBasedPro', role: 'Property Testing', specialty: 'property-based tests', description: 'Reviews property-based testing', personality: 'generative', color: '#d29922', enabled: false, weight: 1.0 },
  { id: 'test-005', name: 'IntegrationIan', role: 'Integration Testing', specialty: 'integration tests', description: 'Reviews integration test coverage', personality: 'holistic', color: '#d29922', enabled: false, weight: 1.0 },
  { id: 'test-006', name: 'ContractTestColin', role: 'Contract Testing', specialty: 'API contracts', description: 'Reviews contract tests', personality: 'pact-focused', color: '#d29922', enabled: false, weight: 1.0 },

  // Documentation Council (4)
  { id: 'doc-001', name: 'DocuNinja', role: 'Documentation', specialty: 'docs completeness', description: 'Ensures complete documentation', personality: 'thorough, organized', color: '#39c5cf', enabled: true, weight: 1.2 },
  { id: 'doc-002', name: 'APIDocAlex', role: 'API Documentation', specialty: 'API docs', description: 'Reviews API documentation', personality: 'spec-first', color: '#39c5cf', enabled: true, weight: 1.1 },
  { id: 'doc-003', name: 'ReadmeRanger', role: 'Readme Specialist', specialty: 'README files', description: 'Reviews README quality', personality: 'welcoming', color: '#39c5cf', enabled: false, weight: 1.0 },
  { id: 'doc-004', name: 'ChangelogChamp', role: 'Changelog Expert', specialty: 'changelog quality', description: 'Reviews changelog entries', personality: 'chronological', color: '#39c5cf', enabled: false, weight: 0.9 },

  // Observability Council (4)
  { id: 'obs-001', name: 'LogLibrarian', role: 'Logging Specialist', specialty: 'structured logging', description: 'Reviews logging practices', personality: 'verbose, searchable', color: '#f778ba', enabled: true, weight: 1.1 },
  { id: 'obs-002', name: 'MetricMaven', role: 'Metrics Expert', specialty: 'observability metrics', description: 'Reviews metric definitions', personality: 'quantitative', color: '#f778ba', enabled: true, weight: 1.1 },
  { id: 'obs-003', name: 'TraceTracker', role: 'Tracing Specialist', specialty: 'distributed tracing', description: 'Reviews tracing implementation', personality: 'follow-the-flow', color: '#f778ba', enabled: false, weight: 1.0 },
  { id: 'obs-004', name: 'AlertAlpine', role: 'Alerting Expert', specialty: 'alert design', description: 'Reviews alerting thresholds', personality: 'signal-over-noise', color: '#f778ba', enabled: false, weight: 1.0 },

  // DevOps Council (4)
  { id: 'devops-001', name: 'DockerDame', role: 'Container Expert', specialty: 'Dockerfile review', description: 'Reviews containerization', personality: 'reproducible', color: '#2493ed', enabled: true, weight: 1.2 },
  { id: 'devops-002', name: 'CIGuru', role: 'CI/CD Specialist', specialty: 'pipelines', description: 'Reviews CI/CD pipelines', personality: 'automation-first', color: '#2493ed', enabled: true, weight: 1.1 },
  { id: 'devops-003', name: 'KubernetesKnight', role: 'K8s Specialist', specialty: 'kubernetes', description: 'Reviews K8s configurations', personality: 'orchestrated', color: '#2493ed', enabled: false, weight: 1.0 },
  { id: 'devops-004', name: 'InfraAsCodeIan', role: 'IaC Specialist', specialty: 'infrastructure as code', description: 'Reviews IaC practices', personality: 'repeatable', color: '#2493ed', enabled: false, weight: 1.0 }
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
      'obs-': 'Observability',
      'devo': 'DevOps'
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