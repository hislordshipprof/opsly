# Security Rules — OPSLY

## CRITICAL: Pre-Commit Security Checks

Before any commit, verify:

1. **No Hardcoded Secrets**
   - API keys must come from environment variables via ConfigService
   - No tokens, passwords, or credentials in code
   - Check: `GEMINI_API_KEY`, `JWT_SECRET`, `DATABASE_URL`

2. **Input Validation & Sanitization — BACKEND IS THE SOURCE OF TRUTH**

   The backend is the ONLY place where validation and sanitization is enforced.
   The frontend NEVER handles security — it only provides UX convenience.

   ### Backend (MANDATORY — every endpoint, no exceptions)
   - All DTOs validated with class-validator decorators (@IsString, @IsEnum, @IsUUID, @MinLength, @MaxLength, etc.)
   - All request bodies pass through global ValidationPipe (whitelist + forbidNonWhitelisted + transform)
   - String fields sanitized: strip HTML tags, trim whitespace, enforce max length
   - Enum fields validated against Prisma enum values — reject anything not in the enum
   - UUID fields validated with @IsUUID() — never accept raw string IDs without validation
   - Array fields validated with @IsArray() + @ArrayMaxSize() — prevent payload bombing
   - Nested objects validated with @ValidateNested() + @Type() from class-transformer
   - Query params validated with DTOs (not raw req.query access)
   - File uploads validated: mime type whitelist, max size, content-type header check

   ### Frontend (UX ONLY — never for security)
   - Frontend validation is OPTIONAL and exists purely for user experience (instant feedback)
   - NEVER rely on frontend validation to prevent bad data reaching the backend
   - Only add frontend validation when explicitly asked and confirmed by the user
   - When frontend validation exists, it must MIRROR backend rules exactly (use shared Zod schemas if possible)
   - Frontend should gracefully handle backend validation errors and display them to the user

3. **SQL Injection Prevention**
   - Use Prisma's parameterized queries (enforced by default)
   - Never concatenate user input into raw queries

4. **XSS Prevention**
   - Sanitize any user-generated content before display
   - Be cautious with voice transcript display
   - Never use dangerouslySetInnerHTML with user content

5. **RBAC Enforcement**
   - Every controller endpoint has @UseGuards(JwtAuthGuard, RolesGuard)
   - Every endpoint has explicit @Roles() decorator
   - Tenants can ONLY see their own work orders
   - Technicians can ONLY see their own schedule
   - WebSocket channels authorized by role on connection

6. **API Security**
   - Validate JWT on all REST endpoints
   - Validate JWT on WebSocket handshake
   - Rate limit voice/AI endpoints (expensive operations)
   - Validate CORS origin for WebSocket connections

## Environment Variable Pattern

```typescript
// CORRECT — use ConfigService (NestJS)
constructor(private config: ConfigService) {}
const apiKey = this.config.get<string>('GEMINI_API_KEY');

// NEVER DO THIS
const apiKey = 'AIzaSy...'; // HARDCODED - BLOCKED
```

## String Sanitization Pattern

```typescript
// Use a shared sanitize utility for all user-submitted text
// backend/src/common/utils/sanitize.ts

import { BadRequestException } from '@nestjs/common';

export function sanitizeText(input: string, maxLength = 1000): string {
  // Strip HTML tags
  const stripped = input.replace(/<[^>]*>/g, '');
  // Trim whitespace
  const trimmed = stripped.trim();
  // Enforce max length
  if (trimmed.length > maxLength) {
    throw new BadRequestException(`Text exceeds max length of ${maxLength}`);
  }
  return trimmed;
}
```

Apply in service layer (not controller — keep controllers thin):
```typescript
// In work-orders.service.ts
async create(dto: CreateWorkOrderDto, user: JwtPayload) {
  const description = sanitizeText(dto.issueDescription, 1000);
  // ... create with sanitized description
}
```

## Agent-Specific Security

1. **Agent Tool Calls**
   - Agents NEVER write to the database directly
   - All tool calls go through authenticated backend REST endpoints
   - Service-level tokens for agent-to-backend communication
   - Tool responses validated before agent uses them

2. **Voice Sessions**
   - Don't persist raw audio recordings — only transcripts
   - Session tokens expire — handle reconnection gracefully
   - Clear audio buffers after processing

3. **Photo Uploads**
   - Max image size: 4MB (enforce on upload endpoint)
   - Validate mime_type before sending to Gemini Vision
   - Never expose raw Gemini Vision response to frontend

## When Security Issue Found

1. STOP current work immediately
2. Do NOT commit the vulnerable code
3. Fix the vulnerability first
4. If credentials exposed, rotate immediately
5. Audit codebase for similar issues
