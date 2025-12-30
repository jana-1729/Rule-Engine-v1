'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/components/card';
import { Label } from '@/ui/components/label';
import { Input } from '@/ui/components/input';
import { Button } from '@/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/components/select';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';

interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface ConditionConfigPanelProps {
  node: Node;
  onUpdate: (data: any) => void;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

export function ConditionConfigPanel({ node, onUpdate }: ConditionConfigPanelProps) {
  const [conditions, setConditions] = useState<Condition[]>([
    {
      id: '1',
      field: '',
      operator: 'equals',
      value: '',
    },
  ]);
  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>('AND');

  useEffect(() => {
    // Load existing configuration
    const nodeData = node.data as any;
    if (nodeData.field) {
      setConditions([{
        id: '1',
        field: nodeData.field,
        operator: nodeData.operator || 'equals',
        value: nodeData.value || '',
      }]);
    }
  }, [node]);

  const addCondition = () => {
    const newCondition: Condition = {
      id: Date.now().toString(),
      field: '',
      operator: 'equals',
      value: '',
    };
    setConditions([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter(c => c.id !== id));
      updateNode(conditions.filter(c => c.id !== id));
    }
  };

  const updateCondition = (id: string, field: keyof Condition, value: string) => {
    const newConditions = conditions.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    );
    setConditions(newConditions);
    updateNode(newConditions);
  };

  const updateNode = (currentConditions: Condition[]) => {
    const firstCondition = currentConditions[0];
    const isConfigured = currentConditions.every(c => c.field && c.value);
    
    onUpdate({
      field: firstCondition.field,
      operator: firstCondition.operator,
      value: firstCondition.value,
      conditions: currentConditions,
      conditionCount: currentConditions.length,
      logicOperator,
      configured: isConfigured,
      label: isConfigured 
        ? `If ${firstCondition.field} ${firstCondition.operator} ${firstCondition.value}`
        : 'Condition',
    });
  };

  const isConfigured = conditions.every(c => c.field && c.value);

  return (
    <div className="space-y-6">
      {/* Logic Operator */}
      {conditions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logic Operator</CardTitle>
            <CardDescription>
              How should multiple conditions be evaluated?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={logicOperator === 'AND' ? 'default' : 'outline'}
                onClick={() => {
                  setLogicOperator('AND');
                  updateNode(conditions);
                }}
                className="flex-1"
              >
                AND (All must match)
              </Button>
              <Button
                variant={logicOperator === 'OR' ? 'default' : 'outline'}
                onClick={() => {
                  setLogicOperator('OR');
                  updateNode(conditions);
                }}
                className="flex-1"
              >
                OR (Any must match)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conditions</CardTitle>
          <CardDescription>
            Define when this branch should be taken
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {conditions.map((condition, index) => (
            <div key={condition.id} className="space-y-3 p-4 border-2 border-gray-200 rounded-lg">
              {/* Condition Number */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  Condition {index + 1}
                </span>
                {conditions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(condition.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Field */}
              <div>
                <Label htmlFor={`field-${condition.id}`} className="text-xs">
                  Field
                </Label>
                <Input
                  id={`field-${condition.id}`}
                  type="text"
                  placeholder="e.g., status, priority, assignee"
                  value={condition.field}
                  onChange={(e) => updateCondition(condition.id, 'field', e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Operator */}
              <div>
                <Label htmlFor={`operator-${condition.id}`} className="text-xs">
                  Operator
                </Label>
                <Select
                  value={condition.operator}
                  onValueChange={(value) => updateCondition(condition.id, 'operator', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value */}
              {condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty' && (
                <div>
                  <Label htmlFor={`value-${condition.id}`} className="text-xs">
                    Value
                  </Label>
                  <Input
                    id={`value-${condition.id}`}
                    type="text"
                    placeholder="Enter value to compare"
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          ))}

          {/* Add Condition Button */}
          <Button
            variant="outline"
            onClick={addCondition}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Another Condition
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Condition Preview</CardTitle>
          <CardDescription>
            How your condition will be evaluated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm">
            {conditions.map((condition, index) => (
              <div key={condition.id}>
                {index > 0 && (
                  <div className="text-blue-600 font-semibold my-2">
                    {logicOperator}
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-white border rounded">
                    {condition.field || 'field'}
                  </span>
                  <span className="text-blue-600 font-semibold">
                    {OPERATORS.find(op => op.value === condition.operator)?.label || condition.operator}
                  </span>
                  {condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty' && (
                    <span className="px-2 py-1 bg-white border rounded">
                      {condition.value || 'value'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      {isConfigured && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">
                  Condition Configured
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  {conditions.length} condition(s) will be evaluated using <strong>{logicOperator}</strong> logic
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

