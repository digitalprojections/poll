/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @author @ahmadfuzal
 * @date 2026-04-15
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  setDoc, 
  addDoc, 
  serverTimestamp,
  where,
  getDocs
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { telegramService } from '../services/telegramService';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';

interface PollContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isTgSigningIn: boolean;
  authError: string | null;
  polls: Poll[];
  createPoll: (pollData: Omit<Poll, 'id' | 'creatorId' | 'creatorName' | 'createdAt' | 'isActive'>) => Promise<string>;
  castVote: (pollId: string, optionId: string) => Promise<void>;
  getPollSummary: (pollId: string) => Promise<PollSummary>;
}

const PollContext = createContext<PollContextType | undefined>(undefined);

export function PollProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTgSigningIn, setIsTgSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);

  useEffect(() => {
    // 1. Initialize Telegram SDK immediately
    telegramService.init();

    // 2. Setup Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      
      // We only stop the general 'loading' if we're not currently doing a Telegram sign-in
      if (!isTgSigningIn) {
        setLoading(false);
      }
      
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        setDoc(userRef, {
          uid: u.uid,
          displayName: u.displayName,
          email: u.email,
          photoURL: u.photoURL,
          telegramId: telegramService.getUser()?.id?.toString() || null,
          updatedAt: Date.now()
        }, { merge: true }).catch(err => console.error('Error syncing user:', err));
      }
    });

    // 3. Handle Auto-Login for Telegram
    const handleTgAuth = async () => {
      // @ts-ignore
      const isTg = !!(window.Telegram?.WebApp?.initData);
      
      if (isTg && !auth.currentUser) {
        console.log('PollProvider: Telegram detected, starting auto-login...');
        setIsTgSigningIn(true);
        setAuthError(null);
        try {
          const functions = getFunctions();
          const tgAuth = httpsCallable<{ initData: string }, { token: string }>(functions, 'telegramAuth');
          // @ts-ignore
          const initData = window.Telegram?.WebApp?.initData || "";
          
          if (initData) {
            const result = await tgAuth({ initData });
            await signInWithCustomToken(auth, result.data.token);
          } else {
            setAuthError('Telegram InitData is empty. Are you running in a bot?');
          }
        } catch (err: any) {
          console.error('PollProvider: Telegram auto-login failed:', err);
          setAuthError(`Telegram Auth Failed: [${err.code}] ${err.message || 'Unknown Error'}`);
        } finally {
          setIsTgSigningIn(false);
          setLoading(false);
        }
      } else {
        if (!auth.currentUser) {
          setTimeout(() => setLoading(false), 500);
        }
      }
    };

    handleTgAuth();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'polls'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pollList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll));
      setPolls(pollList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'polls');
    });

    return () => unsubscribe();
  }, [user]);

  const createPoll = async (pollData: Omit<Poll, 'id' | 'creatorId' | 'creatorName' | 'createdAt' | 'isActive'>) => {
    if (!user) throw new Error('User not authenticated');

    const newPoll: Omit<Poll, 'id'> = {
      ...pollData,
      creatorId: user.uid,
      creatorName: user.displayName || 'Anonymous',
      createdAt: Date.now(),
      isActive: true
    };

    try {
      const docRef = await addDoc(collection(db, 'polls'), newPoll);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'polls');
      throw error;
    }
  };

  const castVote = async (pollId: string, optionId: string) => {
    if (!user) throw new Error('User not authenticated');

    const voteId = user.uid; // One vote per user per poll
    const voteRef = doc(db, 'polls', pollId, 'votes', voteId);

    const voteData: Vote = {
      id: voteId,
      pollId,
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      optionId,
      timestamp: Date.now()
    };

    try {
      await setDoc(voteRef, voteData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `polls/${pollId}/votes/${voteId}`);
      throw error;
    }
  };

  const getPollSummary = async (pollId: string): Promise<PollSummary> => {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) throw new Error('Poll not found');

    const votesRef = collection(db, 'polls', pollId, 'votes');
    const votesSnap = await getDocs(votesRef);
    const votes = votesSnap.docs.map(doc => doc.data() as Vote);

    const optionStats: Record<string, { voteCount: number; propertyTotals: Record<string, number> }> = {};
    const overallPropertyTotals: Record<string, number> = {};

    // Initialize stats for each option
    poll.options.forEach(opt => {
      optionStats[opt.id] = {
        voteCount: 0,
        propertyTotals: {}
      };
      poll.customProperties.forEach(prop => {
        optionStats[opt.id].propertyTotals[prop.name] = 0;
        overallPropertyTotals[prop.name] = 0;
      });
    });

    // Aggregate votes
    votes.forEach(vote => {
      const option = poll.options.find(o => o.id === vote.optionId);
      if (option) {
        optionStats[option.id].voteCount++;
        poll.customProperties.forEach(prop => {
          const val = option.customValues[prop.name] || 0;
          optionStats[option.id].propertyTotals[prop.name] += val;
          overallPropertyTotals[prop.name] += val;
        });
      }
    });

    return {
      pollId,
      totalVotes: votes.length,
      optionStats,
      overallPropertyTotals
    };
  };

  return (
    <PollContext.Provider value={{ user, loading, isTgSigningIn, authError, polls, createPoll, castVote, getPollSummary }}>
      {children}
    </PollContext.Provider>
  );
}

export function usePolls() {
  const context = useContext(PollContext);
  if (context === undefined) {
    throw new Error('usePolls must be used within a PollProvider');
  }
  return context;
}
