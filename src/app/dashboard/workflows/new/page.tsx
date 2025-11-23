"use client";

import { useState } from 'react';
import { WorkflowBuilder } from '@/ui/workflow/workflow-builder';
import { Button } from '@/ui/components/button';
import { useRouter } from 'next/navigation';

export default function NewWorkflowPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSave = async (workflow: any) => {
    setSaving(true);
    try {
      const response = await fetch('/api/dashboard/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });

      if (response.ok) {
        router.push('/dashboard/workflows');
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Workflow</h1>
          <p className="text-gray-600 mt-2">
            Build your automation workflow visually
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>

      <WorkflowBuilder onSave={handleSave} />
    </div>
  );
}

