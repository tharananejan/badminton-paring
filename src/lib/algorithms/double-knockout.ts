import type { PairingAlgorithm } from './interface';
import type { Team, Round, Match, Standing } from '../types/tournament';

export const DoubleKnockoutAlgorithm: PairingAlgorithm = {
  name: 'Double Elimination (Double Knockout)',
  type: 'double-knockout',
  description: 'Players must lose twice to be eliminated. Features a Winners Bracket, Losers (Redemption) Bracket, and Grand Finals.',

  generateFirstRound(teams: Team[]): Round[] {
    const matches: Match[] = [];
    let matchNumber = 1;

    for (let i = 0; i < teams.length; i += 2) {
      const team1 = teams[i];
      const team2 = teams[i + 1];

      if (!team2) {
        matches.push({
          id: `w-r1-m${matchNumber}`,
          roundNumber: 1,
          matchNumber: matchNumber++,
          team1,
          team2: undefined,
          status: 'bye',
          winner: team1,
          bracket: 'winners'
        });
      } else {
        matches.push({
          id: `w-r1-m${matchNumber}`,
          roundNumber: 1,
          matchNumber: matchNumber++,
          team1,
          team2,
          status: 'pending',
          bracket: 'winners'
        });
      }
    }

    return [{
      roundNumber: 1,
      name: 'Winners Round 1',
      matches,
      bracket: 'winners'
    }];
  },

  generateNextRound(currentRounds: Round[], teams: Team[]): Round[] {
    const lastRound = currentRounds[currentRounds.length - 1];
    if (!lastRound) return this.generateFirstRound(teams);

    const unfinished = lastRound.matches.some(m => m.status === 'pending' || m.status === 'in-progress');
    if (unfinished) return currentRounds;

    // Separate all completed matches across all rounds by bracket
    const winnersBracketMatches = currentRounds.flatMap(r => r.matches.filter(m => m.bracket === 'winners'));
    const losersBracketMatches = currentRounds.flatMap(r => r.matches.filter(m => m.bracket === 'losers'));
    const finalsMatches = currentRounds.flatMap(r => r.matches.filter(m => m.bracket === 'grand-finals'));

    if (finalsMatches.length > 0) {
      // Grand finals has been generated. If finished, nothing more.
      return currentRounds;
    }

    // Find active teams remaining in Winners Bracket (winners of latest winners round)
    const latestWinnersRoundNum = Math.max(...winnersBracketMatches.map(m => m.roundNumber), 0);
    const latestWinnersRoundMatches = winnersBracketMatches.filter(m => m.roundNumber === latestWinnersRoundNum);
    const activeWinnersBracketTeams = latestWinnersRoundMatches
      .map(m => m.winner)
      .filter((t): t is Team => t !== undefined);

    // Find all losers from latest Winners Bracket round who just dropped down
    const newLosersFromWinners = latestWinnersRoundMatches
      .map(m => (m.status === 'completed' && m.winner ? (m.winner.id === m.team1?.id ? m.team2 : m.team1) : undefined))
      .filter((t): t is Team => t !== undefined);

    // Find active teams remaining in Losers Bracket
    const latestLosersRoundNum = Math.max(...losersBracketMatches.map(m => m.roundNumber), 0);
    const latestLosersRoundMatches = losersBracketMatches.filter(m => m.roundNumber === latestLosersRoundNum);
    
    let activeLosersBracketTeams: Team[] = [];
    if (latestLosersRoundNum === 0) {
      // No losers rounds yet -> active losers are just those who lost in Winners Round 1
      activeLosersBracketTeams = [...newLosersFromWinners];
    } else {
      // Winners of latest losers round + any new losers from winners bracket
      const winnersOfLosers = latestLosersRoundMatches
        .map(m => m.winner)
        .filter((t): t is Team => t !== undefined);
      
      activeLosersBracketTeams = [...winnersOfLosers, ...newLosersFromWinners];
    }

    // Check if we are ready for Grand Finals (1 player in Winners, 1 player in Losers, and no pending losers matches needed)
    if (activeWinnersBracketTeams.length === 1 && activeLosersBracketTeams.length === 1 && newLosersFromWinners.length === 0) {
      const nextRoundNum = lastRound.roundNumber + 1;
      const grandFinalsRound: Round = {
        roundNumber: nextRoundNum,
        name: 'Grand Finals',
        bracket: 'grand-finals',
        matches: [{
          id: `gf-r${nextRoundNum}-m1`,
          roundNumber: nextRoundNum,
          matchNumber: 1,
          team1: activeWinnersBracketTeams[0], // Winners bracket champ
          team2: activeLosersBracketTeams[0],  // Losers bracket champ
          status: 'pending',
          bracket: 'grand-finals'
        }]
      };
      return [...currentRounds, grandFinalsRound];
    }

    // Otherwise, generate the next round(s) needed.
    const newRoundsToAdd: Round[] = [];
    const nextRoundNum = lastRound.roundNumber + 1;

    // 1. Can we generate another Winners Bracket round?
    if (activeWinnersBracketTeams.length >= 2) {
      const matches: Match[] = [];
      let matchNumber = 1;
      const nextWRoundNum = latestWinnersRoundNum + 1;

      for (let i = 0; i < activeWinnersBracketTeams.length; i += 2) {
        const t1 = activeWinnersBracketTeams[i];
        const t2 = activeWinnersBracketTeams[i + 1];
        if (!t2) {
          matches.push({
            id: `w-r${nextWRoundNum}-m${matchNumber++}`,
            roundNumber: nextWRoundNum,
            matchNumber: matches.length + 1,
            team1: t1,
            team2: undefined,
            status: 'bye',
            winner: t1,
            bracket: 'winners'
          });
        } else {
          matches.push({
            id: `w-r${nextWRoundNum}-m${matchNumber++}`,
            roundNumber: nextWRoundNum,
            matchNumber: matches.length + 1,
            team1: t1,
            team2: t2,
            status: 'pending',
            bracket: 'winners'
          });
        }
      }
      newRoundsToAdd.push({
        roundNumber: nextRoundNum,
        name: `Winners Round ${nextWRoundNum}`,
        bracket: 'winners',
        matches
      });
    }

    // 2. Can we generate a Losers Bracket round?
    if (activeLosersBracketTeams.length >= 2) {
      const matches: Match[] = [];
      let matchNumber = 1;
      const nextLRoundNum = latestLosersRoundNum + 1;
      const roundNumForThis = newRoundsToAdd.length > 0 ? nextRoundNum + 1 : nextRoundNum;

      for (let i = 0; i < activeLosersBracketTeams.length; i += 2) {
        const t1 = activeLosersBracketTeams[i];
        const t2 = activeLosersBracketTeams[i + 1];
        if (!t2) {
          matches.push({
            id: `l-r${nextLRoundNum}-m${matchNumber++}`,
            roundNumber: nextLRoundNum,
            matchNumber: matches.length + 1,
            team1: t1,
            team2: undefined,
            status: 'bye',
            winner: t1,
            bracket: 'losers'
          });
        } else {
          matches.push({
            id: `l-r${nextLRoundNum}-m${matchNumber++}`,
            roundNumber: nextLRoundNum,
            matchNumber: matches.length + 1,
            team1: t1,
            team2: t2,
            status: 'pending',
            bracket: 'losers'
          });
        }
      }
      newRoundsToAdd.push({
        roundNumber: roundNumForThis,
        name: `Losers Round ${nextLRoundNum}`,
        bracket: 'losers',
        matches
      });
    }

    if (newRoundsToAdd.length === 0) {
      return currentRounds;
    }

    return [...currentRounds, ...newRoundsToAdd];
  },

  calculateStandings(rounds: Round[], teams: Team[]): Standing[] {
    const statsMap = new Map<string, { played: number; won: number; lost: number; pointsDiff: number; setsDiff: number; isEliminated: boolean }>();

    for (const team of teams) {
      statsMap.set(team.id, { played: 0, won: 0, lost: 0, pointsDiff: 0, setsDiff: 0, isEliminated: false });
    }

    for (const round of rounds) {
      for (const match of round.matches) {
        if (match.status === 'completed' || match.status === 'bye') {
          if (match.team1 && statsMap.has(match.team1.id)) {
            const s = statsMap.get(match.team1.id)!;
            if (match.status === 'completed') {
              s.played++;
              if (match.score) {
                s.pointsDiff += (match.score.team1Points - match.score.team2Points);
                s.setsDiff += (match.score.team1Sets - match.score.team2Sets);
              }
              if (match.winner?.id === match.team1.id) s.won++;
              else {
                s.lost++;
                if (s.lost >= 2) s.isEliminated = true;
              }
            } else if (match.status === 'bye') {
              s.won++;
            }
          }
          if (match.team2 && statsMap.has(match.team2.id)) {
            const s = statsMap.get(match.team2.id)!;
            if (match.status === 'completed') {
              s.played++;
              if (match.score) {
                s.pointsDiff += (match.score.team2Points - match.score.team1Points);
                s.setsDiff += (match.score.team2Sets - match.score.team1Sets);
              }
              if (match.winner?.id === match.team2.id) s.won++;
              else {
                s.lost++;
                if (s.lost >= 2) s.isEliminated = true;
              }
            }
          }
        }
      }
    }

    const standings: Standing[] = teams.map(team => {
      const s = statsMap.get(team.id)!;
      return {
        team,
        played: s.played,
        won: s.won,
        lost: s.lost,
        pointsDifference: s.pointsDiff,
        setsDifference: s.setsDiff,
        rank: 0
      };
    });

    standings.sort((a, b) => {
      const sA = statsMap.get(a.team.id)!;
      const sB = statsMap.get(b.team.id)!;
      if (sA.isEliminated !== sB.isEliminated) return sA.isEliminated ? 1 : -1;
      if (b.won !== a.won) return b.won - a.won;
      if (b.setsDifference !== a.setsDifference) return b.setsDifference - a.setsDifference;
      return b.pointsDifference - a.pointsDifference;
    });

    standings.forEach((s, idx) => { s.rank = idx + 1; });
    return standings;
  },

  isFinished(rounds: Round[], teams: Team[]): boolean {
    const finalsRound = rounds.find(r => r.bracket === 'grand-finals');
    if (finalsRound) {
      return finalsRound.matches.every(m => m.status === 'completed' || m.status === 'bye');
    }
    return false;
  }
};
