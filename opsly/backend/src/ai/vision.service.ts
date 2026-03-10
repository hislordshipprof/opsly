import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import { AssessmentResult } from './types/assessment-result.js';

/** Prompt focuses on reasoning — schema handles output format */
const VISION_PROMPT = `You are a property maintenance damage assessment expert.

Carefully analyze this photo of a reported maintenance issue in a residential unit.

Assessment criteria:
- Look for visible damage, leaks, stains, cracks, pest evidence, equipment failure
- Determine if there is immediate danger (active water leak, gas leak, exposed wiring, fire risk)
- Evaluate how urgently this needs repair

Priority reasoning:
- If severity is HIGH and there is active water, gas, or electrical danger → recommend URGENT
- If severity is HIGH but no immediate danger to safety → recommend HIGH
- If severity is MEDIUM or damage is moderate → recommend MEDIUM
- If damage is purely cosmetic or aesthetic → recommend LOW

Be specific in your observations — describe exactly what you see in the image.`;

/** Schema constrains output — model reasons freely, returns structured JSON */
const ASSESSMENT_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    damageType: {
      type: SchemaType.STRING,
      description: 'Type of damage identified (e.g., water_leak, electrical_fault, mold, pest_damage, structural_crack, appliance_failure, cosmetic)',
    } as Schema,
    severity: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      description: 'Overall severity of the damage',
    } as Schema,
    confidence: {
      type: SchemaType.NUMBER,
      description: 'Your confidence in this assessment from 0.0 to 1.0',
    } as Schema,
    observations: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING } as Schema,
      description: 'Specific observations about what is visible in the photo (3-5 items)',
    } as Schema,
    recommendedPriority: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      description: 'Recommended repair priority based on severity and danger level',
    } as Schema,
    specialistRequired: {
      type: SchemaType.BOOLEAN,
      description: 'Whether a specialist tradesperson is needed (e.g., licensed electrician, plumber)',
    } as Schema,
    estimatedCategory: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['plumbing', 'electrical', 'hvac', 'structural', 'appliance', 'pest', 'locksmith', 'other'],
      description: 'The maintenance category this issue falls under',
    } as Schema,
  },
  required: [
    'damageType',
    'severity',
    'confidence',
    'observations',
    'recommendedPriority',
    'specialistRequired',
    'estimatedCategory',
  ],
};

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private readonly model;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set — vision assessment will fail');
    }

    const genAI = new GoogleGenerativeAI(apiKey || '');
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: ASSESSMENT_SCHEMA,
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    });
  }

  async assessPhoto(
    imageBase64: string,
    mimeType: string,
  ): Promise<AssessmentResult> {
    this.validateImage(imageBase64, mimeType);

    const sizeKB = this.getImageSizeKB(imageBase64);
    this.logger.log(`Assessing photo (${mimeType}, ${sizeKB}KB)`);

    try {
      const result = await this.model.generateContent([
        { text: VISION_PROMPT },
        { inlineData: { mimeType, data: imageBase64 } },
      ]);

      const responseText = result.response.text();
      this.logger.log(`Gemini Vision raw response: ${responseText}`);
      const parsed = JSON.parse(responseText) as AssessmentResult;

      this.logger.log(
        `Assessment complete: severity=${parsed.severity}, priority=${parsed.recommendedPriority}, confidence=${parsed.confidence}, damageType=${parsed.damageType}, observations=${parsed.observations?.join('; ') ?? 'none'}`,
      );

      return parsed;
    } catch (error) {
      this.logger.error(
        `Vision assessment failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.fallbackAssessment();
    }
  }

  private validateImage(imageBase64: string, mimeType: string): void {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Invalid image type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    const sizeBytes = Buffer.from(imageBase64, 'base64').length;
    if (sizeBytes > MAX_IMAGE_SIZE) {
      throw new BadRequestException(
        `Image exceeds maximum size of 4MB (got ${(sizeBytes / 1024 / 1024).toFixed(1)}MB)`,
      );
    }
  }

  private getImageSizeKB(base64: string): number {
    return Math.round(Buffer.from(base64, 'base64').length / 1024);
  }

  /** Safe fallback if Gemini call fails entirely */
  private fallbackAssessment(): AssessmentResult {
    this.logger.warn('Using fallback assessment — Gemini call failed');
    return {
      damageType: 'unknown',
      severity: 'MEDIUM',
      confidence: 0.3,
      observations: ['Photo received but AI assessment could not be completed'],
      recommendedPriority: 'MEDIUM',
      specialistRequired: false,
      estimatedCategory: 'other',
    };
  }
}
