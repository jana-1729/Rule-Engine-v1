'use client';

import { WorkflowCanvas } from '@/ui/workflow/builder/workflow-canvas';

export default function NewVisualWorkflowPage() {
  const handleSave = async (nodes: any[], edges: any[], name: string) => {
    console.log('Saving workflow:', { name, nodes, edges });
    
    // TODO: Implement actual save logic
    // This will be connected to the workflow API
    
    return Promise.resolve();
  };

  const handleTest = () => {
    console.log('Testing workflow');
    
    // TODO: Implement test logic
  };

  return (
    <WorkflowCanvas
      onSave={handleSave}
      onTest={handleTest}
    />
  );
}

