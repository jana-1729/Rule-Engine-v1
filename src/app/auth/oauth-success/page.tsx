'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/ui/components/card';

/**
 * OAuth Success Page
 * 
 * This page is shown after a successful OAuth callback.
 * It displays a success message and redirects the user back to their original page.
 */
export default function OAuthSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(3);
  
  const connected = searchParams.get('connected') === 'true';
  const integration = searchParams.get('integration');
  const connectionId = searchParams.get('connectionId');
  const redirect = searchParams.get('redirect') || '/dashboard/integrations';
  const error = searchParams.get('error');

  useEffect(() => {
    if (!connected || error) return;

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to the original page
          const redirectUrl = new URL(redirect, window.location.origin);
          redirectUrl.searchParams.set('connected', 'true');
          if (integration) redirectUrl.searchParams.set('integration', integration);
          if (connectionId) redirectUrl.searchParams.set('connectionId', connectionId);
          
          router.push(redirectUrl.pathname + redirectUrl.search);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [connected, error, redirect, integration, connectionId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Connection Failed
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {error === 'access_denied' 
                  ? 'You denied access to the integration.'
                  : 'There was an error connecting the integration.'}
              </p>
              <button
                onClick={() => router.push(redirect)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go Back
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              {countdown > 0 ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Integration Connected!
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Your integration has been successfully connected.
            </p>
            {countdown > 0 ? (
              <p className="text-sm text-gray-500">
                Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Redirecting now...
              </p>
            )}
            <button
              onClick={() => {
                const redirectUrl = new URL(redirect, window.location.origin);
                redirectUrl.searchParams.set('connected', 'true');
                if (integration) redirectUrl.searchParams.set('integration', integration);
                if (connectionId) redirectUrl.searchParams.set('connectionId', connectionId);
                router.push(redirectUrl.pathname + redirectUrl.search);
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Continue Now
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

