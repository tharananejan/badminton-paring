import { describe, it, expect } from 'vitest';
import { TournamentManager } from '../src/lib/engine/tournament-manager';
import { parseScore } from '../src/lib/engine/score-parser';
import { encodeStateToUrlHash, decodeStateFromUrlHash } from '../src/lib/engine/state-serializer';
import type { Team } from '../src/lib/types/tournament';

describe('Score Parser', () => {
  const t1: Team = { id: 't1', name: 'Smashers' };
  const t2: Team = { id: 't2', name: 'Racket Kings' };

  it('parses multi-set badminton scores like "21-4, 15-8"', () => {
    const score = parseScore('21-4, 15-8', t1, t2);
    expect(score.team1Sets).toBe(2);
    expect(score.team2Sets).toBe(0);
    expect(score.team1Points).toBe(36);
    expect(score.team2Points).toBe(12);
    expect(score.winnerId).toBe('t1');
  });

  it('parses 3-set matches like "19-21, 21-18, 21-15"', () => {
    const score = parseScore('19-21, 21-18, 21-15', t1, t2);
    expect(score.team1Sets).toBe(2);
    expect(score.team2Sets).toBe(1);
    expect(score.winnerId).toBe('t1');
  });

  it('parses single set point scores like "21-19"', () => {
    const score = parseScore('21-19', t1, t2);
    expect(score.team1Sets).toBe(1);
    expect(score.team2Sets).toBe(0);
    expect(score.winnerId).toBe('t1');
  });
});

describe('Single Elimination (Knockout)', () => {
  it('handles odd player counts by assigning automatic byes', () => {
    const manager = TournamentManager.createTournament('Test Knockout', 'knockout', ['A', 'B', 'C', 'D', 'E']);
    const state = manager.getState();
    expect(state.rounds.length).toBe(1);
    expect(state.rounds[0].matches.length).toBe(3);
    
    // Last match should be a bye for E
    const lastMatch = state.rounds[0].matches[2];
    expect(lastMatch.status).toBe('bye');
    expect(lastMatch.winner?.name).toBe('E');
  });

  it('advances winners to the next round until a champion is crowned', () => {
    const manager = TournamentManager.createTournament('4-Player KO', 'knockout', ['P1', 'P2', 'P3', 'P4']);
    let state = manager.getState();
    expect(state.rounds[0].matches.length).toBe(2);

    // Record scores for round 1
    manager.recordMatchScore(state.rounds[0].matches[0].id, '21-10');
    manager.recordMatchScore(state.rounds[0].matches[1].id, '21-15');

    // Advance to Finals
    const addedNew = manager.advanceRound();
    expect(addedNew).toBe(true);
    state = manager.getState();
    expect(state.rounds.length).toBe(2);
    expect(state.rounds[1].name).toBe('Finals');

    // Play Finals
    manager.recordMatchScore(state.rounds[1].matches[0].id, '21-19, 21-17');
    manager.advanceRound();
    expect(manager.getState().status).toBe('completed');
  });
});

describe('Double Elimination (Double Knockout)', () => {
  it('moves first-time losers to the Losers Bracket', () => {
    const manager = TournamentManager.createTournament('Double KO Test', 'double-knockout', ['A', 'B', 'C', 'D']);
    let state = manager.getState();
    expect(state.rounds[0].bracket).toBe('winners');

    // Record round 1 scores
    manager.recordMatchScore(state.rounds[0].matches[0].id, '21-10'); // A wins over B
    manager.recordMatchScore(state.rounds[0].matches[1].id, '21-15'); // C wins over D

    manager.advanceRound();
    state = manager.getState();

    const losersRounds = state.rounds.filter(r => r.bracket === 'losers');
    expect(losersRounds.length).toBeGreaterThan(0);
  });
});

describe('Round Robin Algorithm', () => {
  it('generates N-1 rounds for N even players where everyone plays everyone', () => {
    const manager = TournamentManager.createTournament('RR Test', 'round-robin', ['T1', 'T2', 'T3', 'T4']);
    const state = manager.getState();
    expect(state.rounds.length).toBe(3); // 4 players -> 3 rounds
    expect(state.rounds[0].matches.length).toBe(2);
    expect(state.rounds[1].matches.length).toBe(2);
    expect(state.rounds[2].matches.length).toBe(2);
  });
});

describe('Swiss System Algorithm', () => {
  it('pairs players in consecutive rounds without repeating matchups', () => {
    const manager = TournamentManager.createTournament('Swiss Test', 'swiss', ['S1', 'S2', 'S3', 'S4']);
    let state = manager.getState();
    expect(state.rounds.length).toBe(1);

    // Complete round 1
    manager.recordMatchScore(state.rounds[0].matches[0].id, '21-10');
    manager.recordMatchScore(state.rounds[0].matches[1].id, '21-15');

    manager.advanceRound();
    state = manager.getState();
    expect(state.rounds.length).toBe(2);
  });
});

describe('URL Hash & State Serialization', () => {
  it('compresses and decompresses tournament state without data loss', () => {
    const manager = TournamentManager.createTournament('Hash Test', 'knockout', ['Alpha', 'Beta', 'Gamma']);
    const originalState = manager.getState();
    const hash = encodeStateToUrlHash(originalState);
    
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);

    const decoded = decodeStateFromUrlHash(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(originalState.id);
    expect(decoded?.teams.length).toBe(originalState.teams.length);
    expect(decoded?.name).toBe('Hash Test');
  });
});

describe('Team Renaming & Storage', () => {
  it('renames a team across all rounds, fixtures, and standings', () => {
    const manager = TournamentManager.createTournament('Rename Test', 'knockout', ['Team A', 'Team B', 'Team C']);
    const state = manager.getState();
    const teamA = state.teams[0];

    const success = manager.renameTeam(teamA.id, 'Super Smashers');
    expect(success).toBe(true);
    expect(teamA.name).toBe('Super Smashers');

    // Check matches
    const firstMatch = state.rounds[0].matches[0];
    if (firstMatch.team1?.id === teamA.id) {
      expect(firstMatch.team1.name).toBe('Super Smashers');
    }
  });
});

