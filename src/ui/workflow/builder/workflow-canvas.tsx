'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode } from '../nodes/trigger-node';
import { ActionNode } from '../nodes/action-node';
import { ConditionNode} from '../nodes/condition-node';
import { WorkflowConfigSidebar } from '../panels/workflow-config-sidebar';
import { ExecutionPanel } from '../execution/execution-panel';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Zap, 
  Plus,
  GitBranch,
  Trash2,
  Download,
} from 'lucide-react';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
};

interface WorkflowCanvasProps {
  workflowId?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[], name: string) => Promise<void>;
  onTest?: () => void;
}

function WorkflowCanvasInner({
  workflowId,
  initialNodes = [],
  initialEdges = [],
  onSave,
  onTest,
}: WorkflowCanvasProps) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);

  const onConnect = useCallback(
    (connection: Connection) => {
      console.log('[WorkflowCanvas] Connecting nodes:', connection);
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('[WorkflowCanvas] Node clicked:', node);
    setSelectedNode(node);
  }, []);

  const addTriggerNode = useCallback(() => {
    const newNode: Node = {
      id: `trigger-${Date.now()}`,
      type: 'trigger',
      data: {
        label: 'New Trigger',
        configured: false,
        connected: false,
      },
      position: {
        x: 100,
        y: 100 + nodes.length * 50,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
  }, [nodes.length, setNodes]);

  const addActionNode = useCallback(() => {
    const newNode: Node = {
      id: `action-${Date.now()}`,
      type: 'action',
      data: {
        label: 'New Action',
        configured: false,
        connected: false,
      },
      position: {
        x: 400,
        y: 100 + nodes.length * 50,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
  }, [nodes.length, setNodes]);

  const addConditionNode = useCallback(() => {
    const newNode: Node = {
      id: `condition-${Date.now()}`,
      type: 'condition',
      data: {
        label: 'New Condition',
        configured: false,
      },
      position: {
        x: 700,
        y: 100 + nodes.length * 50,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
  }, [nodes.length, setNodes]);

  const updateNodeData = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    );
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      deleteNode(selectedNode.id);
    }
  }, [selectedNode, deleteNode]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate workflow
      const validation = validateWorkflow(nodes, edges);
      if (!validation.valid) {
        alert(`Workflow validation failed:\n${validation.errors.join('\n')}`);
        return;
      }

      if (onSave) {
        await onSave(nodes, edges, workflowName);
      } else {
        // Default save logic
        const workflow = {
          name: workflowName,
          nodes,
          edges,
          version: '1.0',
        };

        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workflow),
        });

        if (response.ok) {
          alert('Workflow saved successfully!');
          router.push('/dashboard/workflows');
        } else {
          const error = await response.json();
          alert(`Failed to save workflow: ${error.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setExecutionResult(null);
    
    try {
      // Validate workflow first
      const validation = validateWorkflow(nodes, edges);
      if (!validation.valid) {
        alert(`Cannot test workflow:\n${validation.errors.join('\n')}`);
        return;
      }

      if (onTest) {
        onTest();
      } else {
        // Execute workflow
        const workflowData = {
          name: workflowName,
          nodes,
          edges,
        };

        // For testing, we'll use a mock workflow ID
        // In production, this should be a saved workflow
        const response = await fetch('/api/workflows/test-execution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflow: workflowData,
            input: {},
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setExecutionResult(data.execution);
          setShowExecutionPanel(true);
        } else {
          const error = await response.json();
          alert(`Execution failed: ${error.error?.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Failed to test workflow:', error);
      alert('Failed to test workflow');
    } finally {
      setTesting(false);
    }
  };

  const exportWorkflow = () => {
    const workflow = {
      name: workflowName,
      nodes,
      edges,
      version: '1.0',
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-8 w-px bg-gray-200"></div>
          <Input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-xl font-semibold border-none focus-visible:ring-0 px-0 h-auto"
            placeholder="Workflow Name"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleTest}
            disabled={testing || nodes.length === 0}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {testing ? 'Testing...' : 'Test'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || nodes.length === 0}
            size="sm"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { strokeWidth: 2 },
          }}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={16} 
            size={1}
            color="#e5e7eb"
          />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'trigger': return '#3b82f6';
                case 'action': return '#10b981';
                case 'condition': return '#f59e0b';
                default: return '#9ca3af';
              }
            }}
            className="!border-2 !border-gray-200 !rounded-lg !shadow-sm"
            maskColor="rgba(0, 0, 0, 0.05)"
          />
          
          {/* Toolbar Panel */}
          <Panel position="top-left" className="m-4">
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-lg p-2">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addTriggerNode}
                  className="gap-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Zap className="h-4 w-4 text-blue-500" />
                  Trigger
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addActionNode}
                  className="gap-2 hover:bg-green-50 hover:border-green-300"
                >
                  <Plus className="h-4 w-4 text-green-500" />
                  Action
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addConditionNode}
                  className="gap-2 hover:bg-amber-50 hover:border-amber-300"
                >
                  <GitBranch className="h-4 w-4 text-amber-500" />
                  Condition
                </Button>
                
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={deleteSelectedNode}
                  disabled={!selectedNode}
                  className="gap-2 hover:bg-red-50 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={exportWorkflow}
                  disabled={nodes.length === 0}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Panel>
          
          {/* Stats Panel */}
          <Panel position="bottom-left" className="m-4">
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm px-4 py-2">
              <div className="flex items-center gap-6 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>{nodes.filter(n => n.type === 'trigger').length} Triggers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>{nodes.filter(n => n.type === 'action').length} Actions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span>{nodes.filter(n => n.type === 'condition').length} Conditions</span>
                </div>
                <div className="w-px h-4 bg-gray-200"></div>
                <span>{edges.length} Connections</span>
              </div>
            </div>
          </Panel>
          
        </ReactFlow>
        
        {/* Configuration Sidebar */}
        {!showExecutionPanel && (
          <WorkflowConfigSidebar
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={updateNodeData}
            onDelete={deleteNode}
          />
        )}

        {/* Execution Panel */}
        {showExecutionPanel && executionResult && (
          <ExecutionPanel
            executionId={executionResult.id}
            execution={executionResult}
            onClose={() => setShowExecutionPanel(false)}
            onRetry={() => {
              setShowExecutionPanel(false);
              handleTest();
            }}
          />
        )}
      </div>
    </div>
  );
}

function validateWorkflow(nodes: Node[], edges: Edge[]) {
  const errors: string[] = [];

  // Must have at least one trigger
  const triggers = nodes.filter((n) => n.type === 'trigger');
  if (triggers.length === 0) {
    errors.push('Workflow must have at least one trigger');
  }

  // Must have at least one action
  const actions = nodes.filter((n) => n.type === 'action');
  if (actions.length === 0) {
    errors.push('Workflow must have at least one action');
  }

  // All nodes should be configured
  const unconfigured = nodes.filter((n) => !n.data.configured);
  if (unconfigured.length > 0) {
    errors.push(`${unconfigured.length} node(s) are not configured`);
  }

  // Check for disconnected nodes (except triggers)
  const connectedNodeIds = new Set([
    ...edges.map((e) => e.source),
    ...edges.map((e) => e.target),
  ]);
  const disconnected = nodes.filter(
    (n) => n.type !== 'trigger' && !connectedNodeIds.has(n.id)
  );
  if (disconnected.length > 0) {
    errors.push(`${disconnected.length} node(s) are not connected`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

