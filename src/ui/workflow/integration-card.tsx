"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import { IntegrationMetadata } from "@/integrations/types";
import { Plug, CheckCircle } from "lucide-react";

interface IntegrationCardProps {
  integration: IntegrationMetadata;
  isConnected?: boolean;
  onConnect?: () => void;
  onConfigure?: () => void;
}

export function IntegrationCard({ 
  integration, 
  isConnected = false,
  onConnect,
  onConfigure
}: IntegrationCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Plug className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {integration.category}
                </Badge>
                {isConnected && (
                  <Badge variant="success" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <CardDescription className="mt-2">
          {integration.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            v{integration.version} • {integration.authType}
          </div>
          {isConnected ? (
            <Button size="sm" variant="outline" onClick={onConfigure}>
              Configure
            </Button>
          ) : (
            <Button size="sm" onClick={onConnect}>
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

