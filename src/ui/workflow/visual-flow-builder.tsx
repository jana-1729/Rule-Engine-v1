"use client";

import { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/ui/components/button';
import { Card } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import {
  Play,
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
  Zap,
  GitBranch,
  Filter,
} from 'lucide-react';

/**
 * VisualFlowBuilder Component
 * 
 * A visual workflow builder using @xyflow/react
 * Allows drag-and-drop creation of workflows with nodes and edges
 */

interface VisualFlowBuilderProps {
  workflowName?: string;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onTest?: () => void;
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

// Initial nodes for demo
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    data: { 
      label: 'Trigger',
      integration: 'slack',
      event: 'new_message',
    },
    position: { x: 250, y: 50 },
  },
];

const initialEdges: Edge[] = [];

export function VisualFlowBuilder({
  workflowName = 'Untitled Workflow',
  onSave,
  onTest,
  initialNodes: providedNodes,
  initialEdges: providedEdges,
}: VisualFlowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(providedNodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(providedEdges || initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('[VisualFlowBuilder] Connecting nodes:', params);
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const addTriggerNode = () => {
    const newNode: Node = {
      id: `trigger-${Date.now()}`,
      type: 'trigger',
      data: { 
        label: 'New Trigger',
        integration: '',
        event: '',
      },
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addActionNode = () => {
    const newNode: Node = {
      id: `action-${Date.now()}`,
      type: 'action',
      data: { 
        label: 'New Action',
        integration: '',
        action: '',
        config: {},
      },
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addConditionNode = () => {
    const newNode: Node = {
      id: `condition-${Date.now()}`,
      type: 'condition',
      data: { 
        label: 'New Condition',
        field: '',
        operator: 'equals',
        value: '',
      },
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const deleteSelectedNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
    }
  };

  const handleSave = () => {
    console.log('[VisualFlowBuilder] Saving workflow:', { nodes, edges });
    if (onSave) {
      onSave(nodes, edges);
    }
  };

  const handleTest = () => {
    console.log('[VisualFlowBuilder] Testing workflow:', { nodes, edges });
    if (onTest) {
      onTest();
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

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('[VisualFlowBuilder] Node clicked:', node);
    setSelectedNode(node);
  }, []);

  return (
    <Card className="w-full h-[600px] relative">
      {/* Toolbar */}
      <Panel position="top-left" className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 m-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
            <Button
              size="sm"
              variant="outline"
              onClick={addTriggerNode}
              className="flex items-center gap-1"
            >
              <Zap className="h-4 w-4" />
              Trigger
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={addActionNode}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Action
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={addConditionNode}
              className="flex items-center gap-1"
            >
              <GitBranch className="h-4 w-4" />
              Condition
            </Button>
          </div>
          
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
            <Button
              size="sm"
              variant="outline"
              onClick={deleteSelectedNode}
              disabled={!selectedNode}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleTest}
              className="flex items-center gap-1"
            >
              <Play className="h-4 w-4" />
              Test
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
          
          <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={exportWorkflow}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Panel>

      {/* Info Panel */}
      {selectedNode && (
        <Panel position="top-right" className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 m-2 max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Node Details</h3>
              <Badge variant="outline">{selectedNode.type}</Badge>
            </div>
            <div className="text-xs text-gray-600">
              <p className="font-medium">{String(selectedNode.data?.label || 'Node')}</p>
              <p className="text-gray-500 mt-1">ID: {selectedNode.id}</p>
            </div>
          </div>
        </Panel>
      )}

      {/* Stats Panel */}
      <Panel position="bottom-left" className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 m-2">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>{nodes.filter(n => n.type === 'trigger').length} Triggers</span>
          </div>
          <div className="flex items-center gap-1">
            <Plus className="h-3 w-3" />
            <span>{nodes.filter(n => n.type === 'action').length} Actions</span>
          </div>
          <div className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            <span>{nodes.filter(n => n.type === 'condition').length} Conditions</span>
          </div>
        </div>
      </Panel>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        className="bg-gray-50"
      >
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'trigger':
                return '#3b82f6';
              case 'action':
                return '#10b981';
              case 'condition':
                return '#f59e0b';
              default:
                return '#6b7280';
            }
          }}
          className="border border-gray-200 rounded-lg"
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </Card>
  );
}

/**
 * WorkflowFlowView Component
 * 
 * Read-only view of a workflow for execution visualization
 */

interface WorkflowFlowViewProps {
  nodes: Node[];
  edges: Edge[];
  executionStatus?: Record<string, 'pending' | 'running' | 'completed' | 'failed'>;
}

export function WorkflowFlowView({ 
  nodes, 
  edges, 
  executionStatus = {} 
}: WorkflowFlowViewProps) {
  // Color nodes based on execution status
  const coloredNodes = nodes.map(node => ({
    ...node,
    style: {
      ...node.style,
      backgroundColor: executionStatus[node.id] === 'completed' ? '#10b981' :
                      executionStatus[node.id] === 'failed' ? '#ef4444' :
                      executionStatus[node.id] === 'running' ? '#3b82f6' :
                      '#e5e7eb',
    },
  }));

  return (
    <Card className="w-full h-[400px]">
      <ReactFlow
        nodes={coloredNodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        className="bg-gray-50"
      >
        <Controls showInteractive={false} />
        <MiniMap className="border border-gray-200 rounded-lg" />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </Card>
  );
}

