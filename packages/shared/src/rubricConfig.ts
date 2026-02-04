/**
 * Rubric Configuration for Apologetics Library Post Quality Evaluation
 *
 * Versioned, config-driven rubric used by both server (evaluation) and client (display).
 * The rubric version is stored on each evaluated post for traceability.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RubricCriteria {
  id: string;
  description: string;
  maxPoints: number;
}

export interface RubricCategory {
  id: string;
  label: string;
  weight: number;
  description: string;
  criteria: RubricCriteria[];
}

export interface RubricConfig {
  version: string;
  passingScore: number;
  categories: RubricCategory[];
}

export interface CriteriaResult {
  criteriaId: string;
  score: number;
  maxPoints: number;
  feedback: string;
}

export interface CategoryScore {
  categoryId: string;
  score: number;
  weight: number;
  weightedScore: number;
  feedback: string;
  criteriaResults: CriteriaResult[];
}

export interface RubricAuditReport {
  version: string;
  totalScore: number;
  passed: boolean;
  categoryScores: CategoryScore[];
  violations: string[];
  suggestions: string[];
  evaluatedAt: string;
  skipped?: boolean;
}

export interface AutoFixSuggestion {
  field: string;
  issue: string;
  suggestion: string;
}

// ============================================================================
// RUBRIC CONFIGURATION v1.0
// ============================================================================

export const RUBRIC_CONFIG: RubricConfig = {
  version: '1.0',
  passingScore: 70,
  categories: [
    {
      id: 'scriptural_accuracy',
      label: 'Scriptural Accuracy',
      weight: 0.20,
      description: 'Correct use and interpretation of Scripture references',
      criteria: [
        {
          id: 'scripture_citations',
          description: 'Scripture references are provided and relevant to the topic',
          maxPoints: 10,
        },
        {
          id: 'scripture_context',
          description: 'Scripture is quoted in proper context without proof-texting',
          maxPoints: 10,
        },
        {
          id: 'scripture_accuracy',
          description: 'Biblical claims are factually accurate and verifiable',
          maxPoints: 10,
        },
      ],
    },
    {
      id: 'theological_depth',
      label: 'Theological Depth',
      weight: 0.15,
      description: 'Depth and nuance of theological engagement',
      criteria: [
        {
          id: 'doctrine_understanding',
          description: 'Demonstrates understanding of relevant doctrines and traditions',
          maxPoints: 10,
        },
        {
          id: 'nuance',
          description: 'Acknowledges complexity and avoids oversimplification',
          maxPoints: 10,
        },
      ],
    },
    {
      id: 'logical_coherence',
      label: 'Logical Coherence',
      weight: 0.15,
      description: 'Sound reasoning and argument structure',
      criteria: [
        {
          id: 'argument_structure',
          description: 'Arguments follow a clear logical flow from premise to conclusion',
          maxPoints: 10,
        },
        {
          id: 'no_fallacies',
          description: 'Free from logical fallacies (straw man, ad hominem, etc.)',
          maxPoints: 10,
        },
      ],
    },
    {
      id: 'pastoral_sensitivity',
      label: 'Pastoral Sensitivity',
      weight: 0.10,
      description: 'Charitable and respectful tone appropriate for a Christian audience',
      criteria: [
        {
          id: 'tone',
          description: 'Maintains a respectful, charitable, and edifying tone',
          maxPoints: 10,
        },
        {
          id: 'charity_to_views',
          description: 'Treats differing viewpoints fairly without caricature',
          maxPoints: 10,
        },
      ],
    },
    {
      id: 'scholarly_rigor',
      label: 'Scholarly Rigor',
      weight: 0.10,
      description: 'Quality of sources and academic standards',
      criteria: [
        {
          id: 'source_quality',
          description: 'Cites credible scholarly or authoritative sources',
          maxPoints: 10,
        },
        {
          id: 'attribution',
          description: 'Claims are properly attributed and not presented as original when borrowed',
          maxPoints: 10,
        },
      ],
    },
    {
      id: 'content_completeness',
      label: 'Content Completeness',
      weight: 0.15,
      description: 'All required fields are substantive and comprehensive',
      criteria: [
        {
          id: 'tldr_quality',
          description: 'TL;DR provides a concise, accurate summary of the answer',
          maxPoints: 10,
        },
        {
          id: 'key_points_coverage',
          description: 'Key points capture the essential arguments comprehensively',
          maxPoints: 10,
        },
        {
          id: 'body_depth',
          description: 'Body content provides sufficient depth and explanation',
          maxPoints: 10,
        },
      ],
    },
    {
      id: 'readability',
      label: 'Readability',
      weight: 0.15,
      description: 'Clarity, structure, and accessibility of writing',
      criteria: [
        {
          id: 'clarity',
          description: 'Writing is clear and accessible to a general Christian audience',
          maxPoints: 10,
        },
        {
          id: 'structure',
          description: 'Content is well-organized with logical section flow',
          maxPoints: 10,
        },
        {
          id: 'formatting',
          description: 'Proper use of markdown formatting (headers, lists, emphasis)',
          maxPoints: 10,
        },
      ],
    },
  ],
} as const;
