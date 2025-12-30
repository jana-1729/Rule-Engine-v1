'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { X, Settings } from 'lucide-react';
import { Button } from '@/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { TriggerConfigPanel } from './trigger-config-panel';
import { ActionConfigPanel } from './action-config-panel';
import { ConditionConfigPanel } from './condition-config-panel';

interface WorkflowConfigSidebarProps {
  node: Node | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: any) => void;
  onDelete: (nodeId: string) => void;
}

export function WorkflowConfigSidebar({
  node,
  onClose,
  onUpdate,
  onDelete,
}: WorkflowConfigSidebarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (node) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [node]);

  if (!node) return null;

  const handleUpdate = (data: any) => {
    onUpdate(node.id, data);
  };

  const handleDelete = () => {
    onDelete(node.id);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Configure {node.type ? node.type.charAt(0).toUpperCase() + node.type.slice(1) : 'Node'}
                </h2>
                <p className="text-sm text-gray-500">
                  {String(node.data?.label || 'Node')}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-200"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {node.type === 'trigger' && (
              <TriggerConfigPanel
                node={node}
                onUpdate={handleUpdate}
              />
            )}
            {node.type === 'action' && (
              <ActionConfigPanel
                node={node}
                onUpdate={handleUpdate}
              />
            )}
            {node.type === 'condition' && (
              <ConditionConfigPanel
                node={node}
                onUpdate={handleUpdate}
              />
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50 space-y-3">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Validation will happen in individual panels
                  onClose();
                }}
                className="flex-1"
              >
                Apply Changes
              </Button>
            </div>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="w-full"
            >
              Delete Node
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

