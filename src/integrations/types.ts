import { z } from 'zod';

// ============================================
// CORE INTEGRATION TYPES
// ============================================

export interface IntegrationMetadata {
  id: string;
  slug: string;
  name: string;
  description: string;
  version: string;
  category: IntegrationCategory;
  icon: string;
  authType: AuthType;
  website?: string;
  documentation?: string;
  rateLimit?: RateLimitConfig;
}

export type IntegrationCategory =
  | 'productivity'
  | 'crm'
  | 'database'
  | 'communication'
  | 'analytics'
  | 'marketing'
  | 'sales'
  | 'finance'
  | 'hr'
  | 'developer-tools';

export type AuthType = 'oauth2' | 'api_key' | 'basic' | 'custom' | 'none';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfterMs?: number;
}

// ============================================
// AUTHENTICATION
// ============================================

export interface OAuth2Config {
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUri: string;
}

export interface ApiKeyConfig {
  headerName: string;
  prefix?: string; // e.g., "Bearer"
}

export interface BasicAuthConfig {
  usernameField: string;
  passwordField: string;
}

export type AuthConfig = OAuth2Config | ApiKeyConfig | BasicAuthConfig | Record<string, any>;

export interface ConnectionCredentials {
  type: AuthType;
  data: Record<string, any>;
  expiresAt?: Date;
}

// ============================================
// ACTIONS & TRIGGERS
// ============================================

export interface IntegrationAction {
  id: string;
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
  execute: (
    input: any,
    credentials: ConnectionCredentials,
    context: ExecutionContext
  ) => Promise<ActionResult>;
}

export interface IntegrationTrigger {
  id: string;
  name: string;
  description: string;
  type: 'webhook' | 'polling' | 'schedule';
  configSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
  
  // For webhook triggers
  setupWebhook?: (
    config: any,
    credentials: ConnectionCredentials
  ) => Promise<WebhookSetupResult>;
  
  // For polling triggers
  poll?: (
    config: any,
    credentials: ConnectionCredentials,
    lastPollTime?: Date
  ) => Promise<TriggerResult[]>;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId?: string;
    rateLimit?: {
      remaining: number;
      reset: number;
    };
  };
}

export interface TriggerResult {
  id: string;
  data: any;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface WebhookSetupResult {
  webhookId: string;
  webhookUrl: string;
  secret: string;
}

export interface ExecutionContext {
  organizationId: string;
  workflowId: string;
  executionId: string;
  stepNumber: number;
  logger: Logger;
}

export interface Logger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, error?: any) => void;
  debug: (message: string, data?: any) => void;
}

// ============================================
// FIELD SCHEMA FOR AI MAPPING
// ============================================

export interface FieldSchema {
  name: string;
  type: FieldType;
  description?: string;
  required?: boolean;
  default?: any;
  enum?: string[];
  properties?: FieldSchema[]; // For nested objects
  items?: FieldSchema; // For arrays
}

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'url'
  | 'phone'
  | 'object'
  | 'array'
  | 'json'
  | 'file';

// ============================================
// INTEGRATION INTERFACE
// ============================================

export interface Integration {
  metadata: IntegrationMetadata;
  auth: {
    type: AuthType;
    config: AuthConfig;
    validate?: (credentials: ConnectionCredentials) => Promise<boolean>;
  };
  actions: Record<string, IntegrationAction>;
  triggers: Record<string, IntegrationTrigger>;
  
  // Optional lifecycle hooks
  onInstall?: (organizationId: string) => Promise<void>;
  onUninstall?: (organizationId: string) => Promise<void>;
}

// ============================================
// FIELD MAPPING
// ============================================

export interface FieldMapping {
  source: string; // JSONPath expression
  target: string; // JSONPath expression
  transform?: Transform;
}

export interface Transform {
  type: TransformType;
  config?: any;
}

export type TransformType =
  | 'static' // Return a static value
  | 'template' // String template with variables
  | 'function' // Custom function (JS)
  | 'lookup' // Lookup from another source
  | 'conditional' // If-then-else
  | 'format-date'
  | 'format-number'
  | 'parse-json'
  | 'to-uppercase'
  | 'to-lowercase'
  | 'trim'
  | 'split'
  | 'join'
  | 'replace'
  | 'regex';

// ============================================
// WORKFLOW DEFINITION (JSON DSL)
// ============================================

export interface WorkflowDefinition {
  version: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  settings?: WorkflowSettings;
}

export interface WorkflowTrigger {
  integration: string;
  trigger: string;
  config: any;
  connectionId: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  integration: string;
  action: string;
  connectionId: string;
  input: {
    mappings: FieldMapping[];
    static?: Record<string, any>;
  };
  continueOnError?: boolean;
  retry?: RetryConfig;
}

export interface RetryConfig {
  maxAttempts: number;
  delay: number | 'exponential';
  backoffMultiplier?: number;
}

export interface WorkflowSettings {
  timeout?: number; // milliseconds
  concurrency?: number;
  rateLimit?: RateLimitConfig;
  errorHandling?: {
    strategy: 'stop' | 'continue' | 'retry';
    notifyOn?: ('error' | 'warning' | 'success')[];
  };
}

// ============================================
// EXECUTION
// ============================================

export interface ExecutionStatus {
  executionId: string;
  workflowId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  startedAt: Date;
  finishedAt?: Date;
  duration?: number;
  currentStep?: number;
  totalSteps: number;
  error?: ExecutionError;
}

export interface ExecutionError {
  stepNumber: number;
  stepName: string;
  code: string;
  message: string;
  details?: any;
  retryCount: number;
}

// ============================================
// REGISTRY
// ============================================

export interface IntegrationRegistry {
  register(integration: Integration): void;
  get(slug: string): Integration | undefined;
  list(): Integration[];
  getAction(integrationSlug: string, actionId: string): IntegrationAction | undefined;
  getTrigger(integrationSlug: string, triggerId: string): IntegrationTrigger | undefined;
}

