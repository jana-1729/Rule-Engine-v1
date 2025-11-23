"use client";

import { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';

interface WorkflowBuilderProps {
  onSave: (workflow: any) => void;
  initialWorkflow?: any;
}

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
};

function TriggerNode({ data }: any) {
  return (
    <div className="px-6 py-4 bg-green-50 border-2 border-green-500 rounded-lg shadow-lg min-w-[200px]">
      <div className="font-bold text-green-700 mb-1">🎯 Trigger</div>
      <div className="text-sm text-gray-700">{data.label || 'Start'}</div>
    </div>
  );
}

function ActionNode({ data }: any) {
  return (
    <div className="px-6 py-4 bg-blue-50 border-2 border-blue-500 rounded-lg shadow-lg min-w-[200px]">
      <div className="font-bold text-blue-700 mb-1">⚡ Action</div>
      <div className="text-sm text-gray-700">{data.label || 'Action'}</div>
      {data.integration && (
        <div className="text-xs text-gray-500 mt-1">{data.integration}</div>
      )}
    </div>
  );
}

function ConditionNode({ data }: any) {
  return (
    <div className="px-6 py-4 bg-yellow-50 border-2 border-yellow-500 rounded-lg shadow-lg min-w-[200px]">
      <div className="font-bold text-yellow-700 mb-1">🔀 Condition</div>
      <div className="text-sm text-gray-700">{data.label || 'If/Else'}</div>
    </div>
  );
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 250, y: 50 },
    data: { label: 'Workflow Start' },
  },
];

const initialEdges: Edge[] = [];

export function WorkflowBuilder({ onSave, initialWorkflow }: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState('slack');

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const addActionNode = () => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: 'action',
      position: { x: 250, y: nodes.length * 150 + 50 },
      data: {
        label: 'Send Message',
        integration: selectedIntegration,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addConditionNode = () => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: 'condition',
      position: { x: 250, y: nodes.length * 150 + 50 },
      data: { label: 'Check Condition' },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleSave = () => {
    const workflow = {
      name: workflowName,
      description: workflowDescription,
      nodes,
      edges,
      enabled: true,
    };
    onSave(workflow);
  };

  return (
    <div className="space-y-6">
      {/* Workflow Info */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workflow Name
            </label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My Automation Workflow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe what this workflow does..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <Card>
        <CardHeader>
          <CardTitle>Add Nodes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Integration:</label>
              <select
                value={selectedIntegration}
                onChange={(e) => setSelectedIntegration(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="slack">Slack</option>
                <option value="notion">Notion</option>
                <option value="google-sheets">Google Sheets</option>
              </select>
            </div>
            <Button onClick={addActionNode}>+ Add Action</Button>
            <Button onClick={addConditionNode} variant="outline">
              + Add Condition
            </Button>
            <Button onClick={handleSave} className="ml-auto">
              Save Workflow
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardContent className="p-0">
          <div style={{ height: '600px', width: '100%' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Drag nodes to reposition them</li>
            <li>• Connect nodes by dragging from one node's edge to another</li>
            <li>• Add actions to perform integration operations</li>
            <li>• Add conditions to create branching logic</li>
            <li>• Save your workflow when you're done</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

