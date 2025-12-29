'use client';

import { useState } from 'react';
import { AIMappingButton } from './ai-mapping-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Sparkles, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from './button';

interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  confidence: number;
  reasoning: string;
}

interface MappingSuggestion {
  mappings: FieldMapping[];
  overallConfidence: number;
  warnings: string[];
}

interface AIMappingPanelProps {
  sourceIntegration: string;
  targetIntegration: string;
  sourceSchema: Record<string, any>;
  targetSchema: Record<string, any>;
  onApplyMappings: (mappings: FieldMapping[]) => void;
}

/**
 * AI Mapping Panel Component
 * Beautiful, interactive panel for AI-powered field mapping
 * 
 * Features:
 * - Visual mapping display
 * - Confidence scores
 * - Warnings and suggestions
 * - One-click apply
 * - Clean, modern design
 */
export function AIMappingPanel({
  sourceIntegration,
  targetIntegration,
  sourceSchema,
  targetSchema,
  onApplyMappings,
}: AIMappingPanelProps) {
  const [suggestion, setSuggestion] = useState<MappingSuggestion | null>(null);

  const handleMappingGenerated = (data: MappingSuggestion) => {
    setSuggestion(data);
  };

  const handleApply = () => {
    if (suggestion) {
      onApplyMappings(suggestion.mappings);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">AI Field Mapping</CardTitle>
          </div>
          <AIMappingButton
            sourceSchema={sourceSchema}
            targetSchema={targetSchema}
            context={`Mapping from ${sourceIntegration} to ${targetIntegration}`}
            onMappingGenerated={handleMappingGenerated}
          />
        </div>
        <CardDescription>
          Let AI intelligently suggest field mappings between {sourceIntegration} and {targetIntegration}
        </CardDescription>
      </CardHeader>

      {suggestion && (
        <CardContent className="space-y-4">
          {/* Overall Confidence */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Overall Confidence</span>
            </div>
            <Badge className={getConfidenceColor(suggestion.overallConfidence)}>
              {getConfidenceLabel(suggestion.overallConfidence)} ({(suggestion.overallConfidence * 100).toFixed(0)}%)
            </Badge>
          </div>

          {/* Warnings */}
          {suggestion.warnings.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-yellow-800 font-medium text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Warnings</span>
              </div>
              <ul className="space-y-1 text-sm text-yellow-700">
                {suggestion.warnings.map((warning, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mappings */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">
              Suggested Mappings ({suggestion.mappings.length})
            </h4>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {suggestion.mappings.map((mapping, i) => (
                <div
                  key={i}
                  className="p-3 bg-white border rounded-lg hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <code className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono">
                        {mapping.sourceField}
                      </code>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <code className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-mono">
                        {mapping.targetField}
                      </code>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getConfidenceColor(mapping.confidence)}`}
                    >
                      {(mapping.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>

                  {mapping.transformation && (
                    <div className="mb-2 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      <span className="font-medium">Transform:</span> {mapping.transformation}
                    </div>
                  )}

                  <p className="text-xs text-gray-600">{mapping.reasoning}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleApply}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Apply All Mappings
            </Button>
          </div>
        </CardContent>
      )}

      {!suggestion && (
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Click "AI Suggest Mappings" to get started</p>
            <p className="text-xs mt-1">AI will analyze both schemas and suggest intelligent mappings</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

