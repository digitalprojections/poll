/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @author @ahmadfuzal
 * @date 2026-04-15
 */

export interface CustomProperty {
  name: string;
  label: string;
  unit?: string;
}

export interface PollOption {
  id: string;
  text: string;
  /**
   * Custom integer values associated with this option.
   * Key is the property name, value is the integer.
   */
  customValues: Record<string, number>;
}

export interface Poll {
  id: string;
  question: string;
  description?: string;
  creatorId: string;
  creatorName: string;
  createdAt: number;
  customProperties: CustomProperty[];
  options: PollOption[];
  isActive: boolean;
}

export interface Vote {
  id: string;
  pollId: string;
  userId: string;
  userName: string;
  optionId: string;
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
}
