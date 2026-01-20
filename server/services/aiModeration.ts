/**
 * AI-Powered Content Moderation Service
 * Uses Claude API to analyze content for policy violations
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface ModerationResult {
  allowed: boolean;
  confidence: number; // 0-1
  violations: string[];
  categories: {
    hate_speech: number;
    harassment: number;
    sexual_content: number;
    violence: number;
    spam: number;
    misinformation: number;
    profanity: number;
  };
  reasoning: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'allow' | 'review' | 'block' | 'auto_remove';
}

const MODERATION_PROMPT = `You are a content moderation AI for a Christian social networking platform called "The Connection". Your role is to analyze user-generated content and determine if it violates community guidelines.

Community Guidelines:
1. NO hate speech, discrimination, or attacks based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics
2. NO harassment, bullying, threats, or intimidation
3. NO sexual content, nudity, or sexually explicit material
4. NO graphic violence, gore, or violent threats
5. NO spam, scams, or malicious links
6. NO misinformation or deliberate false information
7. NO excessive profanity or vulgar language
8. Content should be respectful and align with Christian values

Analyze the following content and respond ONLY with valid JSON in this exact format:
{
  "allowed": boolean,
  "confidence": number (0-1),
  "violations": ["array", "of", "specific", "violations"],
  "categories": {
    "hate_speech": number (0-1),
    "harassment": number (0-1),
    "sexual_content": number (0-1),
    "violence": number (0-1),
    "spam": number (0-1),
    "misinformation": number (0-1),
    "profanity": number (0-1)
  },
  "reasoning": "brief explanation of your decision",
  "severity": "low" | "medium" | "high" | "critical",
  "action": "allow" | "review" | "block" | "auto_remove"
}

Content to analyze:
`;

/**
 * Analyze content using AI moderation
 */
export async function moderateContent(
  content: string,
  contentType: 'post' | 'comment' | 'message' | 'event' | 'community' = 'post'
): Promise<ModerationResult> {
  try {
    // Skip if no API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('[AI Moderation] No API key configured, using basic moderation only');
      return getFallbackModeration(content);
    }

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Fast and cost-effective for moderation
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${MODERATION_PROMPT}\n\nType: ${contentType}\n\n${content}`,
        },
      ],
    });

    // Parse response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/```\n?$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/```\n?$/, '');
    }

    const result = JSON.parse(jsonText) as ModerationResult;

    // Log moderation decision
    console.log('[AI Moderation]', {
      contentType,
      allowed: result.allowed,
      severity: result.severity,
      action: result.action,
      violations: result.violations,
    });

    return result;
  } catch (error) {
    console.error('[AI Moderation] Error:', error);
    // Fallback to basic moderation on error
    return getFallbackModeration(content);
  }
}

/**
 * Batch moderation for multiple pieces of content
 */
export async function moderateContentBatch(
  items: Array<{ id: string | number; content: string; type: string }>
): Promise<Map<string | number, ModerationResult>> {
  const results = new Map<string | number, ModerationResult>();

  // Process in parallel with concurrency limit
  const BATCH_SIZE = 5;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (item) => ({
        id: item.id,
        result: await moderateContent(item.content, item.type as any),
      }))
    );

    batchResults.forEach(({ id, result }) => {
      results.set(id, result);
    });
  }

  return results;
}

/**
 * Fallback moderation using basic keyword matching
 */
function getFallbackModeration(content: string): ModerationResult {
  const normalized = content.toLowerCase();

  const profanityWords = [
    'fuck', 'shit', 'damn', 'hell', 'ass', 'bitch', 'bastard',
    'cock', 'dick', 'pussy', 'cunt', 'piss', 'whore', 'slut',
  ];

  const hateWords = [
    'n*gger', 'f*ggot', 'k*ke', 'sp*c', 'ch*nk', 'ret*rd',
    // Add more but censored patterns
  ];

  const sexualWords = [
    'porn', 'porno', 'xxx', 'sex', 'nude', 'naked', 'penis',
    'vagina', 'breast', 'cum', 'orgasm', 'masturbat',
  ];

  let profanityCount = 0;
  let hateCount = 0;
  let sexualCount = 0;

  profanityWords.forEach(word => {
    if (normalized.includes(word)) profanityCount++;
  });

  hateWords.forEach(word => {
    const pattern = word.replace(/\*/g, '[a-z]');
    if (new RegExp(pattern, 'i').test(normalized)) hateCount++;
  });

  sexualWords.forEach(word => {
    if (normalized.includes(word)) sexualCount++;
  });

  const violations: string[] = [];
  if (profanityCount > 0) violations.push('profanity');
  if (hateCount > 0) violations.push('hate_speech');
  if (sexualCount > 0) violations.push('sexual_content');

  const totalViolations = profanityCount + hateCount * 3 + sexualCount * 2;
  const allowed = totalViolations === 0;

  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let action: 'allow' | 'review' | 'block' | 'auto_remove' = 'allow';

  if (hateCount > 0) {
    severity = 'critical';
    action = 'auto_remove';
  } else if (sexualCount > 2) {
    severity = 'high';
    action = 'block';
  } else if (profanityCount > 3 || sexualCount > 0) {
    severity = 'medium';
    action = 'review';
  } else if (profanityCount > 0) {
    severity = 'low';
    action = 'allow';
  }

  return {
    allowed,
    confidence: 0.7, // Lower confidence for keyword-based matching
    violations,
    categories: {
      hate_speech: hateCount > 0 ? 0.8 : 0,
      harassment: 0,
      sexual_content: sexualCount > 0 ? 0.7 : 0,
      violence: 0,
      spam: 0,
      misinformation: 0,
      profanity: profanityCount > 0 ? 0.6 : 0,
    },
    reasoning: violations.length > 0
      ? `Basic keyword detection found: ${violations.join(', ')}`
      : 'No violations detected by basic moderation',
    severity,
    action,
  };
}

/**
 * Check if content should be auto-moderated based on result
 */
export function shouldAutoModerate(result: ModerationResult): boolean {
  return result.action === 'auto_remove' ||
         (result.action === 'block' && result.confidence > 0.85);
}

/**
 * Get recommended moderation action
 */
export function getRecommendedAction(result: ModerationResult): {
  action: 'approve' | 'warn' | 'hide' | 'delete' | 'ban_user';
  reason: string;
} {
  if (result.action === 'auto_remove' || result.severity === 'critical') {
    return {
      action: 'delete',
      reason: `Critical violation detected: ${result.violations.join(', ')}`,
    };
  }

  if (result.action === 'block' || result.severity === 'high') {
    return {
      action: 'hide',
      reason: `High severity violation: ${result.violations.join(', ')}`,
    };
  }

  if (result.action === 'review' || result.severity === 'medium') {
    return {
      action: 'warn',
      reason: `Medium severity issues: ${result.violations.join(', ')}`,
    };
  }

  return {
    action: 'approve',
    reason: 'Content passed moderation checks',
  };
}

/**
 * Calculate user reputation impact based on moderation result
 */
export function getReputationImpact(result: ModerationResult): number {
  if (result.action === 'auto_remove') return -50;
  if (result.action === 'block') return -25;
  if (result.action === 'review') return -10;
  if (result.violations.length === 0) return 1; // Small positive for good content
  return 0;
}
