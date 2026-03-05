# NestJS Backend Skill — OPSLY

## Purpose

Defines how to build all backend modules for OPSLY using NestJS + Prisma + PostgreSQL.
Use this skill when creating any backend module, endpoint, guard, or service.

## Tech Stack

- **Framework**: NestJS with TypeScript strict mode
- **ORM**: Prisma with PostgreSQL
- **Auth**: JWT (access + refresh tokens)
- **Real-Time**: Socket.IO via @nestjs/websockets
- **Validation**: class-validator + class-transformer
- **Config**: @nestjs/config (ConfigModule/ConfigService)
- **AI**: Google ADK (agents), Gemini API (vision + live)

## Module Pattern

Every module follows this structure:
```
module-name/
├── module-name.module.ts       # imports, providers, exports
├── module-name.controller.ts   # route handlers, guards, no logic
├── module-name.service.ts      # all business logic
├── dto/
│   ├── create-X.dto.ts         # class-validator decorated
│   └── update-X.dto.ts
└── entities/                   # optional type defs
```

## Controller Pattern
```typescript
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly service: WorkOrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TENANT, Role.MANAGER, Role.ADMIN)
  create(@Body() dto: CreateWorkOrderDto, @Req() req: AuthenticatedRequest) {
    return this.service.create(dto, req.user);
  }
}
```

## Service Pattern
```typescript
@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: OpslyGateway,
  ) {}

  async create(dto: CreateWorkOrderDto, user: JwtPayload): Promise<WorkOrder> {
    const order = await this.prisma.workOrder.create({ data: { ... } });
    this.gateway.emitWorkOrderCreated(order);
    return order;
  }
}
```

## DTO Pattern
```typescript
export class CreateWorkOrderDto {
  @IsUUID()
  unitId: string;

  @IsEnum(IssueCategory)
  issueCategory: IssueCategory;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  issueDescription: string;

  @IsOptional()
  @IsArray()
  photoUrls?: string[];
}
```

## Prisma Query Rules
- Always use indexed fields in where clauses
- Use select/include strategically — never fetch all fields on list endpoints
- Always paginate list queries (take + skip)
- Never run N+1 queries

## WebSocket Event Emission
```typescript
// Always emit with role-filtered rooms
this.server.to('role:manager').emit('workorder.created', payload);
this.server.to(`user:${tenantId}`).emit('workorder.status_changed', payload);
```

## Environment Variables (via ConfigService)
```
DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET,
GEMINI_API_KEY, GOOGLE_CLOUD_PROJECT,
PORT, FRONTEND_URL
```
