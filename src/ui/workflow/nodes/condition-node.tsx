import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { GitBranch, Settings, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ConditionNodeData {
  label: string;
  field?: string;
  operator?: string;
  value?: string;
  configured: boolean;
  conditionCount?: number;
}

export const ConditionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as ConditionNodeData;
  const isConfigured = nodeData.configured;
  
  return (
    <div className={`min-w-[280px] ${selected ? 'ring-2 ring-amber-500' : ''}`}>
      <Card className={`border-2 ${selected ? 'border-amber-500 shadow-lg' : 'border-amber-300'} bg-white`}>
        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white"
        />
        
        <CardHeader className="pb-3 pt-4 px-4 bg-gradient-to-r from-amber-50 to-amber-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500 rounded-md">
                <GitBranch className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm text-gray-900">CONDITION</span>
            </div>
            {isConfigured ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-3 pb-4 px-4 space-y-3">
          {isConfigured && nodeData.field ? (
            <>
              {/* Condition Summary */}
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">If</span>
                  <span className="font-mono font-semibold text-gray-900 mx-1 px-2 py-0.5 bg-gray-100 rounded">
                    {nodeData.field}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-mono font-semibold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">
                    {nodeData.operator || 'equals'}
                  </span>
                  <span className="font-mono font-semibold text-gray-900 mx-1 px-2 py-0.5 bg-gray-100 rounded">
                    {nodeData.value || '...'}
                  </span>
                </div>
              </div>
              
              {/* Condition Count */}
              {nodeData.conditionCount && nodeData.conditionCount > 1 && (
                <Badge variant="secondary" className="text-xs">
                  +{nodeData.conditionCount - 1} more {nodeData.conditionCount - 1 === 1 ? 'condition' : 'conditions'}
                </Badge>
              )}
              
              {/* Configure Button */}
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2 text-xs"
              >
                <Settings className="h-3 w-3" />
                Edit Conditions
              </Button>
            </>
          ) : (
            <>
              {/* Not Configured State */}
              <div className="text-center py-4">
                <GitBranch className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">
                  Add conditions to branch your workflow
                </p>
                <Button size="sm" variant="default" className="gap-2">
                  <Settings className="h-3 w-3" />
                  Add Conditions
                </Button>
              </div>
            </>
          )}
          
          {/* Branch Labels */}
          {isConfigured && (
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                True
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                False
              </span>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Output Handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '30%' }}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '70%' }}
        className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
