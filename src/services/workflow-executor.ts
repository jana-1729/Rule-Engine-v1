import { prisma } from '@/lib/prisma';
import { integrationRegistry } from '@/integrations/registry';
import { connectionManager } from './connection-manager';
import { Node, Edge } from '@xyflow/react';

/**
 * Workflow Execution Engine
 * 
 * Executes workflows by:
 * 1. Parsing workflow definition (nodes + edges)
 * 2. Validating structure and connections
 * 3. Executing nodes in topological order
 * 4. Handling errors and retries
 * 5. Logging every step
 * 6. Tracking execution status
 */

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  endUserId: string;
  appId: string;
  startedAt: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentNodeId: string | null;
  nodeResults: Map<string, NodeResult>;
  connections: Map<string, any>;
  logs: LogEntry[];
}

export interface NodeResult {
  nodeId: string;
  nodeType: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  input: any;
  output: any;
  error?: {
    code: string;
    message: string;
    stack?: string;
    recoverable: boolean;
  };
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  retryCount: number;
}

export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  nodeId?: string;
  message: string;
  data?: any;
}

export interface ExecutionResult {
  executionId: string;
  status: 'completed' | 'failed' | 'cancelled';
  output: any;
  error?: any;
  duration: number;
  nodeResults: NodeResult[];
  logs: LogEntry[];
}

export class WorkflowExecutor {
  private context: ExecutionContext | null = null;

  /**
   * Execute a workflow
   */
  async execute(
    workflowId: string,
    endUserId: string,
    appId: string,
    input?: any
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Get workflow
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          integration: true,
          app: true,
        },
      });

      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Parse workflow definition
      const definition = workflow.definition as any;
      const nodes: Node[] = definition.nodes || [];
      const edges: Edge[] = definition.edges || [];

      // Validate workflow
      const validation = this.validateWorkflow(nodes, edges);
      if (!validation.valid) {
        throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
      }

      // Create execution record
      const execution = await prisma.execution.create({
        data: {
          workflowId,
          appId,
          endUserId,
          integrationId: workflow.integrationId,
          status: 'running',
          input: input || {},
          startedAt: new Date(),
        },
      });

      // Initialize execution context
      this.context = {
        executionId: execution.id,
        workflowId,
        endUserId,
        appId,
        startedAt: new Date(),
        status: 'running',
        currentNodeId: null,
        nodeResults: new Map(),
        connections: new Map(),
        logs: [],
      };

      this.log('info', 'Workflow execution started', { workflowId, executionId: execution.id });

      // Get execution order (topological sort)
      const executionOrder = this.getExecutionOrder(nodes, edges);
      this.log('info', 'Execution order determined', { order: executionOrder.map(n => n.id) });

      // Execute nodes in order
      for (const node of executionOrder) {
        try {
          await this.executeNode(node, nodes, edges);
        } catch (error: any) {
          this.log('error', `Node execution failed: ${node.id}`, { error: error.message });
          
          // Check if error is recoverable
          if (!this.isRecoverableError(error)) {
            throw error;
          }
          
          // Try retry
          const maxRetries = 3;
          const nodeResult = this.context.nodeResults.get(node.id);
          if (nodeResult && nodeResult.retryCount < maxRetries) {
            this.log('info', `Retrying node: ${node.id}`, { retryCount: nodeResult.retryCount + 1 });
            await this.retryNode(node, nodes, edges, maxRetries);
          } else {
            throw error;
          }
        }
      }

      // Execution completed successfully
      this.context.status = 'completed';
      const duration = Date.now() - startTime;

      this.log('info', 'Workflow execution completed', { duration });

      // Update execution record
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          duration,
          output: this.getWorkflowOutput(),
          logs: this.context.logs as any,
        },
      });

      return {
        executionId: execution.id,
        status: 'completed',
        output: this.getWorkflowOutput(),
        duration,
        nodeResults: Array.from(this.context.nodeResults.values()),
        logs: this.context.logs,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      this.log('error', 'Workflow execution failed', { error: error.message });

      // Update execution record
      if (this.context) {
        await prisma.execution.update({
          where: { id: this.context.executionId },
          data: {
            status: 'failed',
            completedAt: new Date(),
            duration,
            error: {
              message: error.message,
              stack: error.stack,
            },
            logs: this.context.logs as any,
          },
        });
      }

      return {
        executionId: this.context?.executionId || '',
        status: 'failed',
        output: null,
        error: {
          message: error.message,
          stack: error.stack,
        },
        duration,
        nodeResults: this.context ? Array.from(this.context.nodeResults.values()) : [],
        logs: this.context?.logs || [],
      };
    }
  }

  /**
   * Execute a single node
   */
  private async executeNode(node: Node, allNodes: Node[], allEdges: Edge[]): Promise<void> {
    if (!this.context) throw new Error('Execution context not initialized');

    const nodeData = node.data as any;
    this.context.currentNodeId = node.id;

    // Initialize node result
    const nodeResult: NodeResult = {
      nodeId: node.id,
      nodeType: node.type || 'unknown',
      status: 'running',
      input: {},
      output: null,
      startedAt: new Date(),
      retryCount: 0,
    };

    this.context.nodeResults.set(node.id, nodeResult);
    this.log('info', `Executing node: ${node.id}`, { type: node.type, label: nodeData.label });

    try {
      // Get input from previous nodes
      const input = this.getNodeInput(node, allEdges);
      nodeResult.input = input;

      // Execute based on node type
      let output: any;

      if (node.type === 'trigger') {
        // Triggers are entry points, use provided input
        output = input;
        this.log('info', `Trigger node executed: ${node.id}`, { output });
      } else if (node.type === 'action') {
        // Execute action
        output = await this.executeAction(node, input);
        this.log('info', `Action node executed: ${node.id}`, { output });
      } else if (node.type === 'condition') {
        // Evaluate condition
        output = this.evaluateCondition(node, input);
        this.log('info', `Condition node evaluated: ${node.id}`, { result: output });
      } else {
        throw new Error(`Unknown node type: ${node.type}`);
      }

      // Update node result
      nodeResult.status = 'success';
      nodeResult.output = output;
      nodeResult.completedAt = new Date();
      nodeResult.duration = nodeResult.completedAt.getTime() - nodeResult.startedAt.getTime();

      this.log('info', `Node completed: ${node.id}`, { duration: nodeResult.duration });
    } catch (error: any) {
      nodeResult.status = 'failed';
      nodeResult.error = {
        code: error.code || 'EXECUTION_ERROR',
        message: error.message,
        stack: error.stack,
        recoverable: this.isRecoverableError(error),
      };
      nodeResult.completedAt = new Date();
      nodeResult.duration = nodeResult.completedAt.getTime() - nodeResult.startedAt.getTime();

      this.log('error', `Node failed: ${node.id}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Execute an action node
   */
  private async executeAction(node: Node, input: any): Promise<any> {
    if (!this.context) throw new Error('Execution context not initialized');

    const nodeData = node.data as any;

    if (!nodeData.integration) {
      throw new Error('Action node missing integration configuration');
    }

    // Get integration
    const integration = integrationRegistry.get(nodeData.integration.slug);
    if (!integration) {
      throw new Error(`Integration not found: ${nodeData.integration.slug}`);
    }

    // Get action
    const action = integration.actions?.[nodeData.action];
    if (!action) {
      throw new Error(`Action not found: ${nodeData.action}`);
    }

    // Get connection
    const connection = await connectionManager.getConnection(
      this.context.endUserId,
      nodeData.integration.slug
    );

    if (!connection) {
      throw new Error(`No connection found for ${nodeData.integration.name}`);
    }

    // Execute action
    this.log('info', `Calling integration action`, {
      integration: nodeData.integration.slug,
      action: nodeData.action,
    });

    const result = await action.execute(
      nodeData.fieldValues || {},
      {
        type: 'oauth2',
        data: connection.credentials,
      } as any,
      {
        organizationId: this.context.appId, // Using appId as organizationId
        workflowId: this.context.workflowId,
        executionId: this.context.executionId,
        stepNumber: Array.from(this.context.nodeResults.values()).length + 1,
        logger: {
          info: (msg: string, data?: any) => this.log('info', msg, data),
          warn: (msg: string, data?: any) => this.log('warn', msg, data),
          error: (msg: string, error?: any) => this.log('error', msg, error),
          debug: (msg: string, data?: any) => this.log('debug', msg, data),
        },
      }
    );

    return result;
  }

  /**
   * Evaluate a condition node
   */
  private evaluateCondition(node: Node, input: any): boolean {
    const nodeData = node.data as any;
    const conditions = nodeData.conditions || [];
    const logicOperator = nodeData.logicOperator || 'AND';

    if (conditions.length === 0) {
      return true;
    }

    const results = conditions.map((condition: any) => {
      const fieldValue = input[condition.field];
      return this.evaluateSingleCondition(fieldValue, condition.operator, condition.value);
    });

    if (logicOperator === 'AND') {
      return results.every((r: boolean) => r);
    } else {
      return results.some((r: boolean) => r);
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateSingleCondition(fieldValue: any, operator: string, compareValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue == compareValue;
      case 'not_equals':
        return fieldValue != compareValue;
      case 'contains':
        return String(fieldValue).includes(String(compareValue));
      case 'not_contains':
        return !String(fieldValue).includes(String(compareValue));
      case 'starts_with':
        return String(fieldValue).startsWith(String(compareValue));
      case 'ends_with':
        return String(fieldValue).endsWith(String(compareValue));
      case 'greater_than':
        return Number(fieldValue) > Number(compareValue);
      case 'less_than':
        return Number(fieldValue) < Number(compareValue);
      case 'is_empty':
        return !fieldValue || fieldValue === '';
      case 'is_not_empty':
        return !!fieldValue && fieldValue !== '';
      default:
        return false;
    }
  }

  /**
   * Get input for a node from previous nodes
   */
  private getNodeInput(node: Node, edges: Edge[]): any {
    if (!this.context) return {};

    // Find incoming edges
    const incomingEdges = edges.filter(edge => edge.target === node.id);

    if (incomingEdges.length === 0) {
      return {};
    }

    // Merge outputs from all previous nodes
    const input: any = {};

    for (const edge of incomingEdges) {
      const sourceResult = this.context.nodeResults.get(edge.source);
      if (sourceResult && sourceResult.output) {
        Object.assign(input, sourceResult.output);
      }
    }

    return input;
  }

  /**
   * Get workflow output (from last node)
   */
  private getWorkflowOutput(): any {
    if (!this.context) return null;

    // Find the last successful node
    const results = Array.from(this.context.nodeResults.values());
    const lastResult = results[results.length - 1];

    return lastResult?.output || null;
  }

  /**
   * Get execution order using topological sort
   */
  private getExecutionOrder(nodes: Node[], edges: Edge[]): Node[] {
    const visited = new Set<string>();
    const order: Node[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      // Visit dependencies first (incoming edges)
      const incomingEdges = edges.filter(e => e.target === nodeId);
      for (const edge of incomingEdges) {
        visit(edge.source);
      }

      // Add this node
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        order.push(node);
      }
    };

    // Start with trigger nodes (no incoming edges)
    const triggerNodes = nodes.filter(node => 
      node.type === 'trigger' || !edges.some(e => e.target === node.id)
    );

    for (const trigger of triggerNodes) {
      visit(trigger.id);
    }

    return order;
  }

  /**
   * Validate workflow structure
   */
  private validateWorkflow(nodes: Node[], edges: Edge[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    // Check for cycles
    if (this.hasCycle(nodes, edges)) {
      errors.push('Workflow contains cycles');
    }

    // Check all nodes are configured
    const unconfigured = nodes.filter(n => !(n.data as any).configured);
    if (unconfigured.length > 0) {
      errors.push(`${unconfigured.length} node(s) are not configured`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if workflow has cycles
   */
  private hasCycle(nodes: Node[], edges: Edge[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = edges.filter(e => e.source === nodeId);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          if (dfs(edge.target)) return true;
        } else if (recursionStack.has(edge.target)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) return true;
      }
    }

    return false;
  }

  /**
   * Retry a failed node
   */
  private async retryNode(node: Node, allNodes: Node[], allEdges: Edge[], maxRetries: number): Promise<void> {
    if (!this.context) return;

    const nodeResult = this.context.nodeResults.get(node.id);
    if (!nodeResult) return;

    const retryCount = nodeResult.retryCount + 1;
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff, max 30s

    this.log('info', `Waiting ${delay}ms before retry`, { nodeId: node.id, retryCount });
    await new Promise(resolve => setTimeout(resolve, delay));

    nodeResult.retryCount = retryCount;
    nodeResult.status = 'running';

    await this.executeNode(node, allNodes, allEdges);
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverableError(error: any): boolean {
    // Network errors, rate limits, timeouts are recoverable
    const recoverableCodes = ['ECONNRESET', 'ETIMEDOUT', 'RATE_LIMIT', '429', '503'];
    return recoverableCodes.some(code => 
      error.code === code || error.message?.includes(code)
    );
  }

  /**
   * Log a message
   */
  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any): void {
    if (!this.context) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      nodeId: this.context.currentNodeId || undefined,
      message,
      data,
    };

    this.context.logs.push(entry);
    console.log(`[WorkflowExecutor] [${level.toUpperCase()}] ${message}`, data || '');
  }
}

export const workflowExecutor = new WorkflowExecutor();

