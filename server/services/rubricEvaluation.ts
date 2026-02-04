/**
 * Rubric Evaluation Service
 *
 * AI-powered quality evaluation for apologetics library posts.
 * Uses Claude to score posts against a structured rubric and
 * generate auto-fix suggestions for failing posts.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  RUBRIC_CONFIG,
  RubricConfig,
  RubricAuditReport,
  AutoFixSuggestion,
} from '@shared/rubricConfig';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// ============================================================================
// TYPES
// ============================================================================

interface LibraryPostContent {
  title: string;
  tldr?: string | null;
  keyPoints?: string[] | null;
  bodyMarkdown: string;
  scriptureRefs?: string[] | null;
  perspectives?: string[] | null;
  sources?: Array<{ title: string; url: string; author?: string; date?: string }> | null;
}

// ============================================================================
// EVALUATION
// ============================================================================

function buildEvaluationPrompt(post: LibraryPostContent, config: RubricConfig): string {
  const categoriesDescription = config.categories.map((cat) => {
    const criteriaList = cat.criteria
      .map((c) => `    - ${c.id}: ${c.description} (max ${c.maxPoints} points)`)
      .join('\n');
    return `  ${cat.id} (weight: ${cat.weight}, label: "${cat.label}"):
    Description: ${cat.description}
${criteriaList}`;
  }).join('\n\n');

  return `You are a theological content quality evaluator for a Christian apologetics platform. Evaluate the following library post against the rubric below.

RUBRIC (version ${config.version}, passing score: ${config.passingScore}/100):

${categoriesDescription}

POST CONTENT:
Title: ${post.title}
TL;DR: ${post.tldr || '(not provided)'}
Key Points: ${post.keyPoints?.length ? post.keyPoints.join('\n- ') : '(not provided)'}
Body (Markdown): ${post.bodyMarkdown || '(not provided)'}
Scripture References: ${post.scriptureRefs?.length ? post.scriptureRefs.join(', ') : '(not provided)'}
Perspectives: ${post.perspectives?.length ? post.perspectives.join(', ') : '(not provided)'}
Sources: ${post.sources?.length ? post.sources.map(s => `${s.title} (${s.url})`).join(', ') : '(not provided)'}

INSTRUCTIONS:
1. Score each criteria item from 0 to its maxPoints.
2. For each category, compute a normalized score (0-100) from the criteria scores.
3. Compute the weighted total score (0-100) using category weights.
4. List any critical violations (issues that MUST be fixed before publishing).
5. List optional suggestions for improvement.

Respond with ONLY valid JSON matching this exact structure (no markdown code fences):
{
  "totalScore": <number 0-100>,
  "categoryScores": [
    {
      "categoryId": "<string>",
      "score": <number 0-100>,
      "weight": <number>,
      "weightedScore": <number>,
      "feedback": "<string>",
      "criteriaResults": [
        {
          "criteriaId": "<string>",
          "score": <number>,
          "maxPoints": <number>,
          "feedback": "<string>"
        }
      ]
    }
  ],
  "violations": ["<string>"],
  "suggestions": ["<string>"]
}`;
}

/**
 * Evaluate a library post against the rubric using AI.
 *
 * If ANTHROPIC_API_KEY is not set, returns a "skipped" report that passes
 * to allow development and testing without an API key.
 */
export async function evaluatePost(
  post: LibraryPostContent,
  config: RubricConfig = RUBRIC_CONFIG,
): Promise<RubricAuditReport> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[Rubric] No ANTHROPIC_API_KEY configured, returning skipped evaluation');
    return createSkippedReport(config);
  }

  try {
    const prompt = buildEvaluationPrompt(post, config);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/```\n?$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/```\n?$/, '');
    }

    const parsed = JSON.parse(jsonText);

    const report: RubricAuditReport = {
      version: config.version,
      totalScore: Math.round(parsed.totalScore),
      passed: parsed.totalScore >= config.passingScore,
      categoryScores: parsed.categoryScores,
      violations: parsed.violations || [],
      suggestions: parsed.suggestions || [],
      evaluatedAt: new Date().toISOString(),
    };

    console.info('[Rubric] Evaluation complete:', {
      totalScore: report.totalScore,
      passed: report.passed,
      violations: report.violations.length,
    });

    return report;
  } catch (error) {
    console.error('[Rubric] Evaluation error:', error);
    throw new Error('Failed to evaluate post against rubric');
  }
}

// ============================================================================
// AUTO-FIX
// ============================================================================

function buildAutoFixPrompt(
  post: LibraryPostContent,
  report: RubricAuditReport,
  config: RubricConfig,
): string {
  const violationsList = report.violations.map((v, i) => `${i + 1}. ${v}`).join('\n');

  const lowScoreCategories = report.categoryScores
    .filter((cs) => cs.score < 70)
    .map((cs) => `- ${cs.categoryId}: ${cs.score}/100 — ${cs.feedback}`)
    .join('\n');

  return `You are a theological content editor helping improve a Christian apologetics library post that failed quality evaluation.

CURRENT POST:
Title: ${post.title}
TL;DR: ${post.tldr || '(not provided)'}
Key Points: ${post.keyPoints?.length ? post.keyPoints.join('\n- ') : '(not provided)'}
Body (Markdown): ${post.bodyMarkdown || '(not provided)'}
Scripture References: ${post.scriptureRefs?.length ? post.scriptureRefs.join(', ') : '(not provided)'}
Sources: ${post.sources?.length ? post.sources.map(s => `${s.title} (${s.url})`).join(', ') : '(not provided)'}

EVALUATION RESULT (score: ${report.totalScore}/100, passing: ${config.passingScore}):

Violations:
${violationsList || '(none)'}

Low-scoring categories:
${lowScoreCategories || '(none)'}

INSTRUCTIONS:
For each violation and low-scoring area, provide a specific, actionable suggestion the author can apply. Each suggestion should identify which field to edit (title, tldr, keyPoints, bodyMarkdown, scriptureRefs, perspectives, or sources) and what to change.

Respond with ONLY valid JSON matching this exact structure (no markdown code fences):
[
  {
    "field": "<field name>",
    "issue": "<what's wrong>",
    "suggestion": "<specific fix>"
  }
]`;
}

/**
 * Generate auto-fix suggestions for a post that failed rubric evaluation.
 */
export async function generateAutoFix(
  post: LibraryPostContent,
  report: RubricAuditReport,
  config: RubricConfig = RUBRIC_CONFIG,
): Promise<AutoFixSuggestion[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[Rubric] No ANTHROPIC_API_KEY configured, cannot generate auto-fix');
    return [];
  }

  try {
    const prompt = buildAutoFixPrompt(post, report, config);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/```\n?$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/```\n?$/, '');
    }

    const suggestions: AutoFixSuggestion[] = JSON.parse(jsonText);

    console.info('[Rubric] Auto-fix generated:', suggestions.length, 'suggestions');

    return suggestions;
  } catch (error) {
    console.error('[Rubric] Auto-fix error:', error);
    throw new Error('Failed to generate auto-fix suggestions');
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function createSkippedReport(config: RubricConfig): RubricAuditReport {
  return {
    version: config.version,
    totalScore: 100,
    passed: true,
    skipped: true,
    categoryScores: config.categories.map((cat) => ({
      categoryId: cat.id,
      score: 100,
      weight: cat.weight,
      weightedScore: cat.weight * 100,
      feedback: 'Evaluation skipped (no API key configured)',
      criteriaResults: cat.criteria.map((c) => ({
        criteriaId: c.id,
        score: c.maxPoints,
        maxPoints: c.maxPoints,
        feedback: 'Skipped',
      })),
    })),
    violations: [],
    suggestions: [],
    evaluatedAt: new Date().toISOString(),
  };
}
