# Testing Rules — OPSLY

## Coverage Requirements

- **Target**: 80% code coverage
- **Critical paths**: 100% (auth, work order lifecycle, WebSocket events)

## Test Types Required

### 1. Unit Tests
- Individual services and functions
- Mock external dependencies (Prisma, Gemini API)
- Fast execution (< 100ms per test)

```typescript
// Example: Testing work order priority assignment
describe('WorkOrderService.computePriority', () => {
  it('assigns URGENT for high severity active leak', () => {
    const assessment = { severity: 'HIGH', damageType: 'water_leak' };
    expect(computePriority(assessment)).toBe(Priority.URGENT);
  });

  it('assigns MEDIUM when no photo provided', () => {
    expect(computePriority(null)).toBe(Priority.MEDIUM);
  });
});
```

### 2. Integration Tests
- API endpoints with real database (test container)
- Service interactions
- WebSocket event emission

```typescript
// Example: Testing work order creation endpoint
describe('POST /work-orders', () => {
  it('creates work order and emits WebSocket event', async () => {
    const response = await request(app)
      .post('/work-orders')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        unitId: testUnit.id,
        issueCategory: 'PLUMBING',
        issueDescription: 'Ceiling leak in main bathroom',
      });

    expect(response.status).toBe(201);
    expect(response.body.orderNumber).toMatch(/^WO-/);
    expect(response.body.status).toBe('REPORTED');
  });
});
```

### 3. E2E Tests (Demo Flows Only)
- Act 1: Tenant reports issue → work order created → dashboard updates
- Act 2: Manager assigns technician → tenant notified
- Act 3: Technician updates status → all parties notified

## What to Test

### Must Test
- Auth flows (register, login, refresh, role-gated access)
- Work order lifecycle (all state transitions)
- RBAC enforcement (tenant can't see others' orders)
- WebSocket event emission on state changes
- SLA deadline computation from priority
- Escalation trigger logic
- Gemini Vision assessment mapping

### Can Skip
- Third-party library internals
- Simple getters/setters
- UI styling (unless logic-dependent)
- Exact Gemini API response format (mock it)

## Mocking Guidelines

```typescript
// Mock Prisma
const mockPrisma = {
  workOrder: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

// Mock Gemini Vision
jest.mock('../ai/vision.service', () => ({
  assessPhoto: jest.fn().mockResolvedValue({
    damageType: 'water_leak',
    severity: 'HIGH',
    confidence: 0.89,
  }),
}));
```

## Running Tests

```bash
# Backend
cd opsly/backend && npm test               # Run all tests
cd opsly/backend && npm run test:cov        # With coverage
cd opsly/backend && npm run test:e2e        # E2E tests

# Frontend
cd opsly/frontend && npm test              # Run all tests
cd opsly/frontend && npm run test:cov      # With coverage
```

## When Tests Fail

1. Read the error carefully — understand what failed
2. Check test isolation — ensure tests don't depend on each other
3. Validate mocks — ensure mocks match real behavior
4. Fix implementation, not test — unless test has a bug
5. If stuck: Document the issue and ask for help
