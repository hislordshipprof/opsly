import { BadRequestException } from '@nestjs/common';

/**
 * Strips HTML tags, trims whitespace, enforces max length.
 * Apply in service layer on all user-submitted text fields.
 */
export function sanitizeText(input: string, maxLength = 1000): string {
  const stripped = input.replace(/<[^>]*>/g, '');
  const trimmed = stripped.trim();

  if (trimmed.length > maxLength) {
    throw new BadRequestException(
      `Text exceeds maximum length of ${maxLength} characters`,
    );
  }

  return trimmed;
}
