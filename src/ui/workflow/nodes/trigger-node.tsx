"use client";

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Badge } from '@/ui/components/badge';
import { Zap, Clock } from 'lucide-react';

/**
 * TriggerNode Component
 * 
 * Visual node for workflow triggers
 */

export interface TriggerNodeData extends Record<string, unknown> {
  label: string;
  integration?: string;
  event?: string;
  description?: string;
}

function TriggerNode({ data, selected }: NodeProps<Node<TriggerNodeData>>) {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 border-2 min-w-[200px] ${
        selected ? 'border-blue-700 ring-2 ring-blue-300' : 'border-blue-400'
      }`}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-700"
      />
      
      <div className="flex items-start gap-2">
        <div className="p-1.5 bg-white/20 rounded">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-white">{data.label}</p>
            <Badge variant="secondary" className="bg-white/20 text-white text-xs border-0">
              Trigger
            </Badge>
          </div>
          {data.integration && (
            <p className="text-xs text-blue-100 mb-1">
              {data.integration}
            </p>
          )}
          {data.event && (
            <div className="flex items-center gap-1 text-xs text-blue-100">
              <Clock className="h-3 w-3" />
              <span>{data.event}</span>
            </div>
          )}
          {data.description && (
            <p className="text-xs text-blue-100 mt-1 opacity-90">
              {data.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(TriggerNode);

