# Milestone 4 — Gemini Vision Integration
Status: COMPLETE

## Tasks

- [x] Configure Gemini API client in NestJS (ai.module.ts) — DONE (2026-03-01)
- [x] Create /work-orders/:id/photos endpoint (POST, base64) — DONE (2026-03-01)
- [x] Implement Gemini Vision call (inline_data, mime_type, schema-constrained) — DONE (2026-03-01)
- [x] Map Vision response to AssessmentResult type — DONE (2026-03-01)
- [x] Store visionAssessment JSON on WorkOrder — DONE (2026-03-01)
- [x] Auto-set priority from Vision severity score (URGENT/HIGH/MEDIUM/LOW) — DONE (2026-03-01)
- [x] Compute slaDeadline from priority on photo assessment — DONE (2026-03-01)
- [ ] Frontend: photo upload component in tenant report flow — DEFERRED to M7
- [ ] Frontend: display vision assessment on work order detail — DEFERRED to M7
- [x] Verify: upload photo → get severity → work order priority set automatically — DONE (2026-03-01)

## Notes
- Using Gemini SDK schema-constrained generation (responseMimeType + responseSchema) instead of prompt-based JSON
- Model reasons freely about damage assessment, schema enforces structured output
- Fallback assessment returns MEDIUM priority with low confidence if Gemini call fails
- Priority mapper trusts model's recommendedPriority (reasoning rules embedded in prompt)
- AI severity score formula: severity_weight * 0.7 + confidence * 0.3
- Max image size: 4MB, allowed types: jpeg, png, webp, gif
- Photo stored as data URI for demo (production would use Cloud Storage)
- @google/generative-ai SDK installed

## Blockers
_None_
