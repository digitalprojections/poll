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
import { Poll, Vote, PollSummary } from '../types/poll';
import { telegramService } from '../services/telegramService';

interface PollContextType {
  user: FirebaseUser | null;
  loading: boolean;
  polls: Poll[];
  createPoll: (pollData: Omit<Poll, 'id' | 'creatorId' | 'creatorName' | 'createdAt' | 'isActive'>) => Promise<string>;
  castVote: (pollId: string, optionId: string) => Promise<void>;
  getPollSummary: (pollId: string) => Promise<PollSummary>;
}

const PollContext = createContext<PollContextType | undefined>(undefined);

export function PollProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [polls, setPolls] = useState<Poll[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      
      // If user is logged in, sync with Firestore
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
    <PollContext.Provider value={{ user, loading, polls, createPoll, castVote, getPollSummary }}>
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
