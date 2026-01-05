import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardHeader } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { Zap, Settings, CheckCircle2, AlertCircle, Link as LinkIcon } from 'lucide-react';

export interface TriggerNodeData {
  label: string;
  integration?: {
    id: string;
    slug: string;
    name: string;
    logo: string;
  };
  event?: string;
  configured: boolean;
  connected?: boolean;
  filters?: any[];
}

export const TriggerNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as TriggerNodeData;
  const isConfigured = nodeData.configured;
  const isConnected = nodeData.connected;
  
  return (
    <div className={`min-w-[280px] ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <Card className={`border-2 ${selected ? 'border-blue-500 shadow-lg' : 'border-blue-300'} bg-white`}>
        <CardHeader className="pb-3 pt-4 px-4 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500 rounded-md">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm text-gray-900">TRIGGER</span>
            </div>
            {isConfigured ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-3 pb-4 px-4 space-y-3">
          {nodeData.integration ? (
            <>
              {/* Integration Info */}
              <div className="flex items-center gap-3">
                {nodeData.integrations.logo && (
                  <img 
                    src={nodeData.integrations.logo} 
                    alt={nodeData.integrations.name}
                    className="w-10 h-10 rounded-lg object-contain border border-gray-200"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base text-gray-900 truncate">
                    {nodeData.integrations.name}
                  </p>
                  {nodeData.event && (
                    <p className="text-xs text-gray-600 truncate">
                      {nodeData.event}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center gap-2 pt-1">
                {isConnected ? (
                  <Badge variant="default" className="text-xs gap-1 bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-700 bg-amber-50">
                    <LinkIcon className="h-3 w-3" />
                    Not Connected
                  </Badge>
                )}
                
                {nodeData.filters && nodeData.filters.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {nodeData.filters.length} {nodeData.filters.length === 1 ? 'filter' : 'filters'}
                  </Badge>
                )}
              </div>
              
              {/* Configure Button */}
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2 text-xs"
              >
                <Settings className="h-3 w-3" />
                {isConfigured ? 'Reconfigure' : 'Configure'}
              </Button>
            </>
          ) : (
            <>
              {/* Not Configured State */}
              <div className="text-center py-4">
                <Zap className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">
                  Select an integration to trigger this workflow
                </p>
                <Button size="sm" variant="default" className="gap-2">
                  <Settings className="h-3 w-3" />
                  Configure Trigger
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';
