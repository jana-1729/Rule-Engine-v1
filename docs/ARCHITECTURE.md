# System Architecture

## Overview

This integration platform follows a **microservices-inspired architecture** within a Next.js monorepo, designed for **horizontal scalability**, **fault tolerance**, and **modularity**.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Workflow    │  │ Integration  │  │  Dashboard   │     │
│  │  Builder     │  │  Gallery     │  │   & Logs     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Workflows   │  │ Integrations │  │  AI Service  │     │
│  │  API         │  │  API         │  │   API        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Queue      │  │ Credentials  │  │   Metrics    │     │
│  │  Service     │  │  Service     │  │  Service     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Background Workers                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Execution   │  │   Trigger    │  │   Cleanup    │     │
│  │   Worker     │  │   Worker     │  │   Worker     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data & Infrastructure                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │  Redis       │  │   OpenAI     │     │
│  │  (Supabase)  │  │  (Upstash)   │  │   API        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Integration Plugin System

**Goal**: Support 1000+ integrations without code changes to core platform

**Design**:
- Each integration is a self-contained module
- Follows `Integration` interface contract
- Auto-discovered via registry
- Versioned independently

**Structure**:
```typescript
interface Integration {
  metadata: IntegrationMetadata;
  auth: AuthConfig;
  actions: Record<string, IntegrationAction>;
  triggers: Record<string, IntegrationTrigger>;
}
```

**Scaling Strategy**:
- Lazy loading: Integrations loaded on-demand
- Plugin versioning: Support multiple versions simultaneously
- Dynamic imports: Reduce initial bundle size
- Registry caching: In-memory registry with Redis fallback

### 2. Workflow Engine

**Goal**: Execute workflows reliably at scale

**Components**:
- **Engine**: Orchestrates workflow execution
- **Field Mapper**: Applies data transformations
- **Validator**: Pre-execution validation

**Execution Flow**:
```
1. Receive trigger payload
2. Validate workflow definition
3. Create execution record
4. For each step:
   a. Get integration action
   b. Fetch & decrypt credentials
   c. Apply field mappings
   d. Execute action
   e. Log results
5. Update execution status
```

**Error Handling**:
- Per-step retry with exponential backoff
- `continueOnError` flag for non-critical steps
- Dead letter queue for failed executions
- Automatic rollback (future enhancement)

### 3. Queue System

**Goal**: Handle millions of executions with graceful degradation

**Design**:
- Redis Sorted Sets for priority queues
- Separate queues: `pending`, `processing`, `scheduled`, `dead_letter`
- Worker pool for parallel processing
- Job deduplication to prevent duplicates

**Queue Operations**:
```typescript
enqueueWorkflow(workflowId, payload, priority?)
dequeueJob() -> Job | null
completeJob(jobId)
failJob(jobId, error) // Handles retry logic
```

**Scaling**:
- Horizontal scaling: Multiple workers across nodes
- Priority lanes: High-priority jobs processed first
- Backpressure handling: Graceful degradation under load
- Monitoring: Queue depth, processing rate, lag

### 4. Credential Management

**Goal**: Secure storage and access to OAuth tokens and API keys

**Security Layers**:
1. **Encryption**: AES-256-GCM for credentials at rest
2. **Rotation**: Automatic OAuth token refresh
3. **Scopes**: Fine-grained permission validation
4. **Audit**: All credential access logged

**Flow**:
```
Create Connection:
  → User grants OAuth permission
  → Platform receives tokens
  → Encrypt with master key
  → Store in database

Use Connection:
  → Fetch encrypted credentials
  → Decrypt on-demand
  → Check expiration
  → Auto-refresh if needed
  → Return to workflow
```

### 5. Observability Stack

**Logging Levels**:
- **Step Logs**: Input/output/error for each step
- **Execution Logs**: Overall workflow status
- **Audit Logs**: User actions and changes
- **Error Logs**: System errors and failures

**Metrics Tracked**:
- Execution counts (success/failure)
- Duration (average, p50, p95, p99)
- Integration usage
- Error rates
- Queue depth

**Monitoring Dashboard**:
- Real-time execution status
- Historical trends
- Error rate alerts
- Performance bottlenecks

## Scalability Design

### Database (PostgreSQL via Supabase)

**Optimization**:
- **Partitioning**: `workflow_executions` partitioned by month
- **Indexes**: Compound indexes on `(organizationId, status, createdAt)`
- **Connection Pooling**: PgBouncer with 100 max connections
- **RLS**: Row-Level Security for multi-tenancy

**Query Patterns**:
- List workflows: Index on `organizationId`
- Execution history: Partitioned table with time-based queries
- Metrics: Aggregated materialized views (future)

### Redis (Upstash)

**Usage**:
- Job queue (Sorted Sets)
- Rate limiting (Token bucket)
- Session storage
- Cache layer (integration metadata)

**Scaling**:
- Upstash auto-scales
- Regional replication for latency
- Lua scripts for atomic operations

### Workers

**Design**:
- Stateless: Can scale horizontally
- Graceful shutdown: Finish in-progress jobs
- Health checks: `/health` endpoint
- Auto-restart on failure

**Deployment**:
```
Production:
  - 5+ worker nodes
  - Load balancer
  - Auto-scaling based on queue depth
  - Different regions for global coverage
```

## Data Flow

### Workflow Execution (End-to-End)

```
User clicks "Run Workflow"
  ↓
POST /api/workflows/execute
  ↓
Validate workflow exists & is active
  ↓
enqueueWorkflow() → Redis queue
  ↓
Worker dequeues job
  ↓
workflowEngine.executeWorkflow()
  ├─ Create execution record (DB)
  ├─ Get workflow definition (DB)
  ├─ For each step:
  │   ├─ Get action from registry
  │   ├─ Fetch credentials (DB + decrypt)
  │   ├─ Apply field mappings
  │   ├─ Execute action (External API)
  │   └─ Log step result (DB)
  └─ Update execution status (DB)
  ↓
Notify user (webhook/email)
```

### OAuth Connection Flow

```
User clicks "Connect Integration"
  ↓
Redirect to OAuth provider
  ↓
User grants permission
  ↓
Provider redirects to /api/integrations/callback
  ↓
Exchange code for tokens
  ↓
Encrypt tokens (AES-256-GCM)
  ↓
Store in database
  ↓
Return to user dashboard
```

## Security Architecture

### Defense in Depth

**Layer 1: Network**
- HTTPS everywhere
- Webhook signature verification
- Rate limiting per IP

**Layer 2: Authentication**
- Supabase Auth (JWT)
- Session management
- MFA support

**Layer 3: Authorization**
- Row-Level Security (RLS)
- Organization-based access
- Role-based permissions

**Layer 4: Data**
- Encryption at rest (credentials)
- Encryption in transit (TLS)
- Regular key rotation

**Layer 5: Audit**
- All actions logged
- Immutable audit trail
- Compliance reporting

## Performance Targets

### Latency
- API response: < 200ms (p95)
- Workflow execution: < 5s (simple)
- Dashboard load: < 1s

### Throughput
- API requests: 10,000 req/s
- Workflow executions: 100,000 jobs/hour
- Concurrent workers: 500+

### Reliability
- Uptime: 99.9%
- Data durability: 99.999999999%
- Recovery time: < 1 hour

## Future Enhancements

### Phase 2
- GraphQL API
- Real-time execution streaming (WebSockets)
- Workflow versioning
- A/B testing workflows
- Conditional branching

### Phase 3
- Multi-region deployment
- Workflow marketplace
- Custom code execution (sandboxed)
- Advanced error recovery
- Machine learning for optimization

### Phase 4
- Self-hosted option
- Enterprise features (SSO, SAML)
- Advanced analytics
- Compliance certifications (SOC 2, HIPAA)
- White-label support

