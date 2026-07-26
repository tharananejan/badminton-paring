import type { Team, Round, Standing, TournamentType } from '../types/tournament';

export interface PairingAlgorithm {
  name: string;
  type: TournamentType;
  description: string;
  /**
   * Generate the initial round(s) when the tournament starts.
   */
  generateFirstRound(teams: Team[]): Round[];

  /**
   * Generate or update the next round(s) based on completed matches in existing rounds.
   * Returns new rounds if created, or updated existing rounds.
   */
  generateNextRound(currentRounds: Round[], teams: Team[]): Round[];

  /**
   * Calculate current rankings / standings based on match results so far.
   */
  calculateStandings(rounds: Round[], teams: Team[]): Standing[];

  /**
   * Check if the tournament has concluded (all required matches completed and winners determined).
   */
  isFinished(rounds: Round[], teams: Team[]): boolean;
}
