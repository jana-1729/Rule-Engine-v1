'use client';

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
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';

interface EnhancedWorkflowBuilderProps {
  onSave: (workflow: any) => void;
  initialWorkflow?: any;
  integrations?: Array<{ slug: string; name: string; actions: any[] }>;
}

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
};

function TriggerNode({ data }: any) {
  return (
    <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-500 rounded-lg shadow-lg min-w-[220px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🎯</span>
        <div>
          <div className="font-bold text-green-700">Trigger</div>
          <div className="text-xs text-green-600">{data.integration || 'Start'}</div>
        </div>
      </div>
      <div className="text-sm text-gray-700 font-medium">{data.label || 'Workflow Start'}</div>
      {data.event && (
        <div className="text-xs text-gray-500 mt-1">Event: {data.event}</div>
      )}
    </div>
  );
}

function ActionNode({ data }: any) {
  return (
    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-500 rounded-lg shadow-lg min-w-[220px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">⚡</span>
        <div>
          <div className="font-bold text-blue-700">Action</div>
          <div className="text-xs text-blue-600">{data.integration || 'Unknown'}</div>
        </div>
      </div>
      <div className="text-sm text-gray-700 font-medium">{data.label || 'Action'}</div>
      {data.action && (
        <div className="text-xs text-gray-500 mt-1">{data.action}</div>
      )}
    </div>
  );
}

function ConditionNode({ data }: any) {
  return (
    <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-500 rounded-lg shadow-lg min-w-[220px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🔀</span>
        <div>
          <div className="font-bold text-yellow-700">Condition</div>
          <div className="text-xs text-yellow-600">If/Else</div>
        </div>
      </div>
      <div className="text-sm text-gray-700 font-medium">{data.label || 'Check Condition'}</div>
      {data.condition && (
        <div className="text-xs text-gray-500 mt-1">{data.condition}</div>
      )}
    </div>
  );
}

function DelayNode({ data }: any) {
  return (
    <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-500 rounded-lg shadow-lg min-w-[220px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">⏱️</span>
        <div>
          <div className="font-bold text-purple-700">Delay</div>
          <div className="text-xs text-purple-600">Wait</div>
        </div>
      </div>
      <div className="text-sm text-gray-700 font-medium">{data.label || 'Wait'}</div>
      {data.duration && (
        <div className="text-xs text-gray-500 mt-1">{data.duration}</div>
      )}
    </div>
  );
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 250, y: 50 },
    data: { label: 'Workflow Start', integration: 'Manual' },
  },
];

const initialEdges: Edge[] = [];

export function EnhancedWorkflowBuilder({
  onSave,
  initialWorkflow,
  integrations = [],
}: EnhancedWorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedIntegration, setSelectedIntegration] = useState('slack');
  const [selectedAction, setSelectedAction] = useState('send_message');
  const [isTestMode, setIsTestMode] = useState(false);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'smoothstep',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2 },
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
        label: selectedAction.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        integration: selectedIntegration,
        action: selectedAction,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addConditionNode = () => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: 'condition',
      position: { x: 250, y: nodes.length * 150 + 50 },
      data: { label: 'Check Condition', condition: 'if value > 0' },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addDelayNode = () => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: 'delay',
      position: { x: 250, y: nodes.length * 150 + 50 },
      data: { label: 'Wait', duration: '5 minutes' },
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
      version: '1.0.0',
    };
    onSave(workflow);
  };

  const handleTest = () => {
    setIsTestMode(true);
    // Simulate workflow execution
    console.log('Testing workflow with nodes:', nodes);
    setTimeout(() => {
      setIsTestMode(false);
      alert('Workflow test completed! Check console for details.');
    }, 2000);
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
            <Label htmlFor="workflow-name">Workflow Name</Label>
            <Input
              id="workflow-name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="My Automation Workflow"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="workflow-description">Description</Label>
            <Textarea
              id="workflow-description"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder="Describe what this workflow does..."
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <Card>
        <CardHeader>
          <CardTitle>Add Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="integration-select">Integration</Label>
                <select
                  id="integration-select"
                  value={selectedIntegration}
                  onChange={(e) => setSelectedIntegration(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="slack">Slack</option>
                  <option value="notion">Notion</option>
                  <option value="google-sheets">Google Sheets</option>
                  {integrations.map((int) => (
                    <option key={int.slug} value={int.slug}>
                      {int.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="action-select">Action</Label>
                <select
                  id="action-select"
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="send_message">Send Message</option>
                  <option value="create_page">Create Page</option>
                  <option value="append_row">Append Row</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={addActionNode} variant="default">
                + Add Action
              </Button>
              <Button onClick={addConditionNode} variant="outline">
                + Add Condition
              </Button>
              <Button onClick={addDelayNode} variant="outline">
                + Add Delay
              </Button>
              <div className="ml-auto flex gap-2">
                <Button
                  onClick={handleTest}
                  variant="outline"
                  disabled={isTestMode || nodes.length <= 1}
                >
                  {isTestMode ? 'Testing...' : '🧪 Test'}
                </Button>
                <Button onClick={handleSave} disabled={!workflowName || nodes.length <= 1}>
                  💾 Save Workflow
                </Button>
              </div>
            </div>
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
              className="bg-gray-50"
            >
              <Background color="#ddd" gap={16} />
              <Controls />
              <MiniMap
                nodeColor={(node) => {
                  switch (node.type) {
                    case 'trigger':
                      return '#22c55e';
                    case 'action':
                      return '#3b82f6';
                    case 'condition':
                      return '#eab308';
                    case 'delay':
                      return '#a855f7';
                    default:
                      return '#6b7280';
                  }
                }}
                maskColor="rgba(0, 0, 0, 0.1)"
              />
              <Panel position="top-right" className="bg-white p-2 rounded-md shadow-sm text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Trigger</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Action</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span>Condition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span>Delay</span>
                  </div>
                </div>
              </Panel>
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
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span>Select an integration and action from the dropdowns above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span>Click "Add Action" to add steps to your workflow</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span>Drag nodes to reposition them on the canvas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <span>Connect nodes by dragging from one node's edge to another</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">5.</span>
              <span>Add conditions to create branching logic</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">6.</span>
              <span>Test your workflow before saving</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">7.</span>
              <span>Save when you're done!</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

