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
import { Poll, PollSummary, Vote } from '../types/poll';

interface PollContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isTgSigningIn: boolean;
  authError: string | null;
  polls: Poll[];
  createPoll: (pollData: Omit<Poll, 'id' | 'creatorId' | 'creatorName' | 'createdAt' | 'isActive' | 'accessCode' | 'isPrivate'>) => Promise<string>;
  subscribeToPoll: (pollId: string, accessCode: string) => Promise<void>;
  castVote: (pollId: string, selections: Vote['selections']) => Promise<void>;
  getPollSummary: (pollId: string) => Promise<PollSummary>;
  deletePoll: (pollId: string) => Promise<void>;
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
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!isTgSigningIn) {
        setLoading(false);
      }

      if (u) {
        const tgUser = telegramService.getUser();
        const photoURL = tgUser?.photo_url || u.photoURL;
        const displayName = u.displayName || (tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : null);

        // Sync with Firestore
        const userRef = doc(db, 'users', u.uid);
        setDoc(userRef, {
          uid: u.uid,
          displayName: displayName,
          email: u.email,
          photoURL: photoURL,
          telegramId: tgUser?.id?.toString() || null,
          username: tgUser?.username || null,
          updatedAt: Date.now()
        }, { merge: true }).catch(err => console.error('Error syncing user:', err));

        // Update Auth profile if photo is missing or changed
        if (photoURL && u.photoURL !== photoURL) {
          import('firebase/auth').then(({ updateProfile }) => {
            updateProfile(u, { photoURL }).catch(err => console.error('Error updating profile photo:', err));
          });
        }
      }
    });

    const handleTgAuth = async () => {
      if (telegramService.isTelegram() && !auth.currentUser) {
        console.log('PollProvider: Telegram detected, starting auto-login...');
        setIsTgSigningIn(true);
        setAuthError(null);
        try {
          // @ts-ignore
          const initData = window.Telegram?.WebApp?.initData;
          if (!initData) {
            throw new Error('Telegram InitData is missing.');
          }

          // Use the explicit region 'us-central1' as confirmed by the user
          const functions = getFunctions(undefined, 'us-central1');
          const tgAuth = httpsCallable<{ initData: string }, { token: string }>(functions, 'telegramAuth');

          const result = await tgAuth({ initData });
          await signInWithCustomToken(auth, result.data.token);
          console.log('PollProvider: Telegram authentication successful');
        } catch (err: any) {
          console.error('PollProvider: Telegram auto-login failed:', err);
          let message = err.message || 'Unknown Error';
          if (err.code === 'functions/internal') {
            message = 'Cloud Function returned an internal error. Check Firebase logs for telegramAuth.';
          }
          setAuthError(`Telegram Auth Failed: ${message}`);
        } finally {
          setIsTgSigningIn(false);
          setLoading(false);
        }
      } else {
        if (!auth.currentUser) {
          setLoading(false);
        }
      }
    };


    handleTgAuth();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setPolls([]);
      return;
    }

    // Get user profile first to get subscribedPollIds
    const userRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userRef, (userDoc) => {
      const userData = userDoc.data();
      const subscribedIds = userData?.subscribedPollIds || [];

      // Query: Created by me
      const qCreated = query(collection(db, 'polls'), where('creatorId', '==', user.uid), orderBy('createdAt', 'desc'));
      
      const unsubscribePolls = onSnapshot(qCreated, (snapshot) => {
        const createdPolls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll));
        
        // Fetch subscribed polls manually (since 'in' queries have 10-item limits and we want real-time)
        // For simplicity and since it's a small app, we'll combine them in the state
        // In a real app, you'd use a better subscription strategy
        setPolls(createdPolls);
        
        // Fetch additional subscribed polls
        if (subscribedIds.length > 0) {
          // Note: In a production app, we'd handle batches of 10 for 'in' keyword
          const qSubscribed = query(collection(db, 'polls'), where('__name__', 'in', subscribedIds.slice(0, 10)));
          getDocs(qSubscribed).then(subSnap => {
            const subPolls = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll));
            setPolls(prev => {
              const combined = [...prev, ...subPolls];
              // De-duplicate
              return Array.from(new Map(combined.map(p => [p.id, p])).values())
                .sort((a, b) => b.createdAt - a.createdAt);
            });
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'polls');
      });

      return () => unsubscribePolls();
    });

    return () => unsubUser();
  }, [user]);

  const createPoll = async (pollData: any) => {
    if (!user) throw new Error('User not authenticated');

    const tgUser = telegramService.getUser();
    const resolvedName = user.displayName || 
      (tgUser?.username ? `@${tgUser.username}` : null) ||
      (tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : null) ||
      'Anonymous';

    // Generate a unique access code (short hash)
    const accessCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const newPoll: Omit<Poll, 'id'> = {
      ...pollData,
      creatorId: user.uid,
      creatorName: resolvedName,
      createdAt: Date.now(),
      isActive: true,
      isPrivate: true, // All polls are private now
      accessCode
    };

    try {
      const docRef = await addDoc(collection(db, 'polls'), newPoll);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'polls');
      throw error;
    }
  };

  const subscribeToPoll = async (pollId: string, accessCode: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const functions = getFunctions(undefined, 'us-central1');
      const joinFunc = httpsCallable<{ pollId: string; accessCode: string }, { success: boolean }>(functions, 'joinPoll');
      
      await joinFunc({ pollId, accessCode });
    } catch (error: any) {
      console.error('Failed to subscribe:', error);
      throw new Error(error.message || 'Failed to authorize access to this poll.');
    }
  };

  const castVote = async (pollId: string, selections: Vote['selections']) => {
    if (!user) throw new Error('User not authenticated');

    const voteId = user.uid;
    const voteRef = doc(db, 'polls', pollId, 'votes', voteId);

    const tgUser = telegramService.getUser();
    const resolvedName = user.displayName || 
      (tgUser?.username ? `@${tgUser.username}` : null) ||
      (tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : null) ||
      'Anonymous';

    const voteData: Vote = {
      id: voteId,
      pollId,
      userId: user.uid,
      userName: resolvedName,
      selections,
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

    const optionStats: PollSummary['optionStats'] = {};

    // Initialize stats for each option
    const overallPropertyTotals: Record<string, number> = {};
    
    poll.options.forEach(opt => {
      const propertyTotals: Record<string, number> = {};
      opt.properties.forEach(p => {
        propertyTotals[p.label] = 0;
        overallPropertyTotals[p.label] = 0;
      });

      optionStats[opt.id] = {
        voteCount: 0,
        propertyTotals
      };
    });

    // Aggregate votes
    votes.forEach(vote => {
      Object.entries(vote.selections || {}).forEach(([optId, values]) => {
        if (optionStats[optId]) {
          optionStats[optId].voteCount++;
          Object.entries(values).forEach(([propLabel, val]) => {
            if (optionStats[optId].propertyTotals[propLabel] !== undefined) {
              optionStats[optId].propertyTotals[propLabel] += val;
              overallPropertyTotals[propLabel] += val;
            }
          });
        }
      });
    });

    return {
      pollId,
      totalVotes: votes.length,
      optionStats,
      overallPropertyTotals,
      votes
    };
  };

  const deletePoll = async (pollId: string) => {
    if (!user) throw new Error('User not authenticated');

    const pollRef = doc(db, 'polls', pollId);
    const votesRef = collection(db, 'polls', pollId, 'votes');
    const votesSnap = await getDocs(votesRef);

    if (!votesSnap.empty) {
      throw new Error('Cannot delete a poll that has already received votes.');
    }

    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(pollRef);
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `polls/${pollId}`);
       throw error;
    }
  };


  return (
    <PollContext.Provider value={{ user, loading, isTgSigningIn, authError, polls, createPoll, subscribeToPoll, castVote, getPollSummary, deletePoll }}>
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
