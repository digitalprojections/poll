/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @author @ahmadfuzal
 * @date 2026-04-15
 */

export type PollType = 'single-select' | 'multi-select';


export interface PollOption {
  id: string;
  text: string;
  /**
   * Custom numeric metrics for this specific option.
   */
  properties: {
    label: string;
    value: number;
    unit?: string;
  }[];
}

export interface CustomProperty {
  label: string;
  value: number;
  unit?: string;
  name: string; // Internal key
}

export interface Poll {
  id: string;
  question: string;
  type: PollType;
  description?: string;
  creatorId: string;
  creatorName: string;
  createdAt: number;
  options: PollOption[];
  isActive: boolean;
  customProperties?: { label: string; unit?: string; name: string }[];
}

export interface Vote {
  id: string;
  pollId: string;
  userId: string;
  userName: string;
  selections: Record<string, Record<string, number>>;
  timestamp: number;
}

export interface PollSummary {
  pollId: string;
  totalVotes: number;
  optionStats: Record<string, {
    voteCount: number;
    propertyTotals: Record<string, number>;
  }>;
  overallPropertyTotals: Record<string, number>;
  votes: Vote[];
}

