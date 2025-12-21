"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { Check, Zap, Send, Plus, Search, Edit, Trash } from 'lucide-react';

interface Action {
  id: string;
  name: string;
  description: string;
}

interface Integration {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo?: string;
  icon?: string;
}

interface ActionConfiguratorProps {
  integration: Integration;
  actions: Action[];
  selectedAction: string;
  onSelectAction: (actionId: string) => void;
  error?: string;
}

const actionIcons: Record<string, any> = {
  send_message: Send,
  create_channel: Plus,
  get_user: Search,
  create_page: Plus,
  query_database: Search,
  update_page: Edit,
  get_page: Search,
  append_row: Plus,
  update_row: Edit,
  get_rows: Search,
  create_sheet: Plus,
};

export function ActionConfigurator({
  integration,
  actions,
  selectedAction,
  onSelectAction,
  error,
}: ActionConfiguratorProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
            {(integration.logo || integration.icon) ? (
              <img 
                src={integration.logo || integration.icon} 
                alt={integration.name}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <span className="text-2xl">🔌</span>
            )}
          </div>
          <div>
            <CardTitle>Select Action for {integration.name}</CardTitle>
            <CardDescription>
              Choose what action this workflow will perform
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action) => {
            const isSelected = selectedAction === action.id;
            const Icon = actionIcons[action.id] || Zap;
            
            return (
              <button
                key={action.id}
                onClick={() => onSelectAction(action.id)}
                className={`relative p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="font-semibold text-gray-900 mb-1">
                      {action.name}
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {action.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {actions.length === 0 && (
          <div className="text-center py-8">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <div className="text-gray-500">
              No actions available for this integration
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

