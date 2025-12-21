"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/components/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/components/alert-dialog';
import { Trash2, Power, PowerOff } from 'lucide-react';

interface WorkflowActionsProps {
  workflowId: string;
  enabled: boolean;
}

export function WorkflowActions({ workflowId, enabled }: WorkflowActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      const response = await fetch(`/api/dashboard/workflows/${workflowId}/toggle`, {
        method: 'PATCH',
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to toggle workflow status');
      }
    } catch (error) {
      console.error('Error toggling workflow:', error);
      alert('An error occurred');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/dashboard/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/workflows');
      } else {
        alert('Failed to delete workflow');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('An error occurred');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button
          variant={enabled ? "outline" : "default"}
          onClick={handleToggleStatus}
          disabled={isToggling}
        >
          {isToggling ? (
            'Updating...'
          ) : enabled ? (
            <>
              <PowerOff className="w-4 h-4 mr-2" />
              Disable
            </>
          ) : (
            <>
              <Power className="w-4 h-4 mr-2" />
              Enable
            </>
          )}
        </Button>

        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone.
              All execution history will be preserved, but the workflow configuration will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Workflow'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

