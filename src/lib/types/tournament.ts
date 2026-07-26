export interface Team {
  id: string;
  name: string;
  seed?: number;
}

export type MatchStatus = 'pending' | 'in-progress' | 'completed' | 'bye';

export interface Score {
  raw: string; // e.g., "21-4, 15-8" or "21-19"
  team1Sets: number;
  team2Sets: number;
  team1Points: number;
  team2Points: number;
  winnerId?: string;
}

export interface Match {
  id: string;
  roundNumber: number;
  matchNumber: number;
  team1?: Team; // undefined if waiting for previous match winner
  team2?: Team; // undefined if waiting or bye
  score?: Score;
  status: MatchStatus;
  winner?: Team;
  loser?: Team;
  bracket?: 'winners' | 'losers' | 'grand-finals';
  nextMatchId?: string; // ID of match winner advances to
  nextLoserMatchId?: string; // ID of match loser advances to (for double knockout)
}

export interface Round {
  roundNumber: number;
  name: string;
  matches: Match[];
  bracket?: 'winners' | 'losers' | 'grand-finals';
}

export type TournamentStatus = 'setup' | 'in-progress' | 'completed';

export type TournamentType = 'knockout' | 'double-knockout' | 'round-robin' | 'swiss';

export interface Standing {
  team: Team;
  played: number;
  won: number;
  lost: number;
  pointsDifference: number;
  setsDifference: number;
  rank: number;
}

export interface TournamentState {
  id: string;
  name: string;
  type: TournamentType;
  status: TournamentStatus;
  teams: Team[];
  rounds: Round[];
  standings: Standing[];
  currentRound: number;
  createdAt: number;
  updatedAt: number;
}
