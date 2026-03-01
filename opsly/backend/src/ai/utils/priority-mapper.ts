import { Priority } from '@prisma/client';
import { AssessmentResult } from '../types/assessment-result.js';

/**
 * Maps Gemini Vision assessment to Prisma Priority enum.
 * Uses the AI's recommendedPriority as the primary signal,
 * with severity as a validation check.
 */
export function mapAssessmentToPriority(
  assessment: AssessmentResult,
): Priority {
  const { recommendedPriority, severity } = assessment;

  // Trust the model's recommendation — it was given the priority rules
  // in the prompt and reasoned through severity + danger signals
  switch (recommendedPriority) {
    case 'URGENT':
      return Priority.URGENT;
    case 'HIGH':
      return Priority.HIGH;
    case 'LOW':
      return Priority.LOW;
    case 'MEDIUM':
    default:
      return Priority.MEDIUM;
  }
}

/**
 * Derives a 0-1 severity score from the assessment.
 * Combines the model's confidence with severity level
 * to produce a single numeric score for dashboard display.
 */
export function computeAiSeverityScore(
  assessment: AssessmentResult,
): number {
  const severityWeights: Record<string, number> = {
    LOW: 0.2,
    MEDIUM: 0.5,
    HIGH: 0.85,
  };

  const base = severityWeights[assessment.severity] ?? 0.5;

  // Blend severity weight with model confidence
  // High confidence + high severity = close to 1.0
  return Math.round((base * 0.7 + assessment.confidence * 0.3) * 100) / 100;
}
