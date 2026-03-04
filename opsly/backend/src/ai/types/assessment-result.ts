/** Structured output from Gemini Vision photo assessment */
export interface AssessmentResult {
  /** Type of damage detected (e.g., "water_leak", "electrical_fault") */
  damageType: string;

  /** Severity level from vision analysis */
  severity: 'LOW' | 'MEDIUM' | 'HIGH';

  /** Model confidence score (0-1) */
  confidence: number;

  /** Detailed observations from the image */
  observations: string[];

  /** AI-recommended priority based on severity + danger assessment */
  recommendedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  /** Whether a specialist tradesperson is needed */
  specialistRequired: boolean;

  /** Estimated issue category from the image */
  estimatedCategory: string;
}
