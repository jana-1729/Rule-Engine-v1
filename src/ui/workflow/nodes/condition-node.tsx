"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Badge } from '@/ui/components/badge';
import { GitBranch, Check, X } from 'lucide-react';

/**
 * ConditionNode Component
 * 
 * Visual node for workflow conditions/branching logic
 */

export interface ConditionNodeData extends Record<string, unknown> {
  label: string;
  field?: string;
  operator?: string;
  value?: any;
  description?: string;
}

function ConditionNode({ data, selected }: NodeProps<Node<ConditionNodeData>>) {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 border-2 min-w-[200px] ${
        selected ? 'border-amber-700 ring-2 ring-amber-300' : 'border-amber-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-amber-700"
      />
      
      <div className="flex items-start gap-2">
        <div className="p-1.5 bg-white/20 rounded">
          <GitBranch className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-white">{data.label}</p>
            <Badge variant="secondary" className="bg-white/20 text-white text-xs border-0">
              Condition
            </Badge>
          </div>
          {data.field && data.operator && (
            <div className="text-xs text-amber-100 space-y-1">
              <div className="flex items-center gap-1">
                <span className="font-medium">If</span>
                <code className="bg-white/20 px-1 py-0.5 rounded">{data.field}</code>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{data.operator}</span>
                <code className="bg-white/20 px-1 py-0.5 rounded">{String(data.value)}</code>
              </div>
            </div>
          )}
          {data.description && (
            <p className="text-xs text-amber-100 mt-2 opacity-90">
              {data.description}
            </p>
          )}
        </div>
      </div>
      
      {/* True path */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="w-3 h-3 !bg-green-500"
        style={{ top: '50%' }}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 translate-x-full ml-2">
        <div className="flex items-center gap-1 text-xs text-green-600 bg-white px-2 py-1 rounded shadow-sm">
          <Check className="h-3 w-3" />
          <span>True</span>
        </div>
      </div>
      
      {/* False path */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 !bg-red-500"
      />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-full mt-2">
        <div className="flex items-center gap-1 text-xs text-red-600 bg-white px-2 py-1 rounded shadow-sm">
          <X className="h-3 w-3" />
          <span>False</span>
        </div>
      </div>
    </div>
  );
}

export default memo(ConditionNode);

