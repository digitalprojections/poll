/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @author @ahmadfuzal
 * @date 2026-04-15
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { usePolls } from '../context/PollContext';
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

export default function PollSubscribe() {
  const { pollId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { subscribeToPoll, user, loading } = usePolls();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const code = searchParams.get('code');

  useEffect(() => {
    if (loading || !user || !pollId || !code) return;

    const performSubscription = async () => {
      try {
        await subscribeToPoll(pollId, code);
        setStatus('success');
        // Auto redirect after short delay
        setTimeout(() => navigate(`/vote/${pollId}`), 2000);
      } catch (err: any) {
        console.error('Subscription failed:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Failed to authorize access to this poll.');
      }
    };

    performSubscription();
  }, [pollId, code, user, loading, subscribeToPoll, navigate]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 sophisticated-card text-center space-y-6">
        <ShieldCheck className="w-12 h-12 text-accent mx-auto" />
        <h2 className="text-2xl font-serif">Authentication Required</h2>
        <p className="text-text-secondary text-sm">Please sign in to access this private assessment.</p>
        <button onClick={() => navigate('/login')} className="btn-primary w-full">Go to Login</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 sophisticated-card text-center space-y-8 py-12">
      {status === 'loading' && (
        <>
          <Loader2 className="w-12 h-12 text-accent mx-auto animate-spin" />
          <h2 className="text-2xl font-serif">Verifying Protocol...</h2>
          <p className="text-text-secondary text-sm">Validating your access code for this private assessment.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-serif text-green-500">Access Granted</h2>
          <p className="text-text-secondary text-sm">You have been subscribed to this assessment. Redirecting to terminal...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-serif text-red-500">Access Denied</h2>
          <p className="text-text-secondary text-sm">{errorMessage}</p>
          <button onClick={() => navigate('/')} className="btn-secondary w-full">Return to Dashboard</button>
        </>
      )}
    </div>
  );
}
