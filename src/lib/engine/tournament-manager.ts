import type { TournamentState, TournamentType, Team, Match, Round } from '../types/tournament';
import { getAlgorithm } from '../algorithms';
import { parseScore } from './score-parser';
import { saveStateToLocalStorage, deleteTournamentFromLocalStorage } from './state-serializer';

export class TournamentManager {
  private state: TournamentState;

  constructor(state: TournamentState) {
    this.state = state;
  }

  static createTournament(name: string, type: TournamentType, teamNames: string[]): TournamentManager {
    const teams: Team[] = teamNames.map((tName, idx) => ({
      id: `team-${idx + 1}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      name: tName.trim(),
      seed: idx + 1
    }));

    const algo = getAlgorithm(type);
    const initialRounds = algo.generateFirstRound(teams);
    const standings = algo.calculateStandings(initialRounds, teams);

    const state: TournamentState = {
      id: `tourney-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || 'Badminton Tournament',
      type,
      status: 'in-progress',
      teams,
      rounds: initialRounds,
      standings,
      currentRound: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const manager = new TournamentManager(state);
    manager.sync();
    return manager;
  }

  getState(): TournamentState {
    return this.state;
  }

  /**
   * Rename a team across all rounds, matches, and standings.
   */
  renameTeam(teamId: string, newName: string): boolean {
    const trimmed = newName.trim();
    if (!trimmed) return false;

    const team = this.state.teams.find(t => t.id === teamId);
    if (!team) return false;

    team.name = trimmed;

    // Update in rounds and matches
    for (const round of this.state.rounds) {
      for (const match of round.matches) {
        if (match.team1?.id === teamId) match.team1.name = trimmed;
        if (match.team2?.id === teamId) match.team2.name = trimmed;
        if (match.winner?.id === teamId) match.winner.name = trimmed;
        if (match.loser?.id === teamId) match.loser.name = trimmed;
      }
    }

    // Update in standings
    for (const standing of this.state.standings) {
      if (standing.team.id === teamId) {
        standing.team.name = trimmed;
      }
    }

    this.sync();
    return true;
  }

  /**
   * Delete this tournament from storage.
   */
  deleteTournament(): boolean {
    return deleteTournamentFromLocalStorage(this.state.id);
  }

  /**
   * Find a match by its unique ID across all rounds.
   */
  findMatch(matchId: string): { match: Match; round: Round } | null {
    for (const round of this.state.rounds) {
      for (const match of round.matches) {
        if (match.id === matchId) {
          return { match, round };
        }
      }
    }
    return null;
  }

  /**
   * Record match score (e.g. "21-4, 15-8" or "21-19") and decide winner.
   */
  recordMatchScore(matchId: string, rawScore: string): Match | null {
    const found = this.findMatch(matchId);
    if (!found) {
      throw new Error(`Match with ID "${matchId}" not found.`);
    }

    const { match } = found;
    if (match.status === 'bye') {
      throw new Error(`Cannot record score for a BYE match.`);
    }
    if (!match.team1 || !match.team2) {
      throw new Error(`Match is not ready yet (waiting for previous round winners).`);
    }

    const score = parseScore(rawScore, match.team1, match.team2);
    match.score = score;
    match.status = 'completed';

    if (score.winnerId === match.team1.id) {
      match.winner = match.team1;
      match.loser = match.team2;
    } else if (score.winnerId === match.team2.id) {
      match.winner = match.team2;
      match.loser = match.team1;
    } else {
      // Fallback if score tie: default to team 1 or keep pending
      match.winner = match.team1;
      match.loser = match.team2;
    }

    this.updateStandingsAndStatus();
    this.sync();
    return match;
  }

  /**
   * Check if current round matches are completed, and if so, generate the next round.
   */
  advanceRound(): boolean {
    const algo = getAlgorithm(this.state.type);
    
    // Check if finished
    if (algo.isFinished(this.state.rounds, this.state.teams)) {
      this.state.status = 'completed';
      this.sync();
      return false;
    }

    const initialRoundCount = this.state.rounds.length;
    const updatedRounds = algo.generateNextRound(this.state.rounds, this.state.teams);
    this.state.rounds = updatedRounds;
    
    const newRoundCount = this.state.rounds.length;
    if (newRoundCount > initialRoundCount) {
      this.state.currentRound = newRoundCount;
    }

    this.updateStandingsAndStatus();
    this.sync();
    return newRoundCount > initialRoundCount;
  }

  private updateStandingsAndStatus(): void {
    const algo = getAlgorithm(this.state.type);
    this.state.standings = algo.calculateStandings(this.state.rounds, this.state.teams);
    
    if (algo.isFinished(this.state.rounds, this.state.teams)) {
      this.state.status = 'completed';
    } else {
      this.state.status = 'in-progress';
    }
  }

  /**
   * Sync state timestamp and save to localStorage if in browser.
   */
  private sync(): void {
    this.state.updatedAt = Date.now();
    saveStateToLocalStorage(this.state);
  }
}
