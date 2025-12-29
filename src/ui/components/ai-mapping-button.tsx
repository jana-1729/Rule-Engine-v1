'use client';

import { useState } from 'react';
import { Button } from './button';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AIMappingButtonProps {
  sourceSchema: Record<string, any>;
  targetSchema: Record<string, any>;
  context?: string;
  onMappingGenerated: (mappings: any) => void;
  disabled?: boolean;
}

/**
 * AI Mapping Button Component
 * Beautiful, animated button that triggers AI-powered field mapping
 * 
 * Features:
 * - Loading states with animation
 * - Success/error feedback
 * - Confidence score display
 * - Clean, modern design
 */
export function AIMappingButton({
  sourceSchema,
  targetSchema,
  context,
  onMappingGenerated,
  disabled = false,
}: AIMappingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setStatus('idle');
    setError(null);

    try {
      const response = await fetch('/api/v1/ai/suggest-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSchema,
          targetSchema,
          context,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        onMappingGenerated(data.data);
        
        // Reset success status after 2 seconds
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        setStatus('error');
        setError(data.error || 'Failed to generate mappings');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Network error');
      console.error('Failed to generate mappings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleClick}
        disabled={loading || disabled}
        variant={status === 'success' ? 'default' : 'outline'}
        size="sm"
        className={`
          gap-2 transition-all duration-200
          ${status === 'success' ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}
          ${status === 'error' ? 'border-red-300 text-red-600' : ''}
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Mapped!</span>
          </>
        ) : status === 'error' ? (
          <>
            <AlertCircle className="w-4 h-4" />
            <span>Try Again</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>AI Suggest Mappings</span>
          </>
        )}
      </Button>

      {error && (
        <p className="text-xs text-red-600 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}

