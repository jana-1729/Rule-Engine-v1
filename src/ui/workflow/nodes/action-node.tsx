"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Badge } from '@/ui/components/badge';
import { Play, Settings } from 'lucide-react';

/**
 * ActionNode Component
 * 
 * Visual node for workflow actions
 */

export interface ActionNodeData extends Record<string, unknown> {
  label: string;
  integration?: string;
  action?: string;
  description?: string;
  config?: Record<string, any>;
}

function ActionNode({ data, selected }: NodeProps<Node<ActionNodeData>>) {
  const hasConfig = data.config && Object.keys(data.config).length > 0;
  
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-green-500 to-green-600 border-2 min-w-[200px] ${
        selected ? 'border-green-700 ring-2 ring-green-300' : 'border-green-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-green-700"
      />
      
      <div className="flex items-start gap-2">
        <div className="p-1.5 bg-white/20 rounded">
          <Play className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-white">{data.label}</p>
            <Badge variant="secondary" className="bg-white/20 text-white text-xs border-0">
              Action
            </Badge>
          </div>
          {data.integration && (
            <p className="text-xs text-green-100 mb-1">
              {data.integration}
            </p>
          )}
          {data.action && (
            <div className="flex items-center gap-1 text-xs text-green-100">
              <Settings className="h-3 w-3" />
              <span>{data.action}</span>
            </div>
          )}
          {hasConfig && (
            <div className="mt-2 pt-2 border-t border-white/20">
              <p className="text-xs text-green-100 opacity-90">
                {Object.keys(data.config!).length} field{Object.keys(data.config!).length !== 1 ? 's' : ''} configured
              </p>
            </div>
          )}
          {data.description && (
            <p className="text-xs text-green-100 mt-1 opacity-90">
              {data.description}
            </p>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-700"
      />
    </div>
  );
}

export default memo(ActionNode);

