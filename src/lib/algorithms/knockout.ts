import type { PairingAlgorithm } from './interface';
import type { Team, Round, Match, Standing } from '../types/tournament';

export const KnockoutAlgorithm: PairingAlgorithm = {
  name: 'Single Elimination (Knockout)',
  type: 'knockout',
  description: 'Standard single-elimination bracket. Losers are immediately eliminated, winners advance until one champion remains.',

  generateFirstRound(teams: Team[]): Round[] {
    let P = 2;
    while (P < teams.length) {
      P *= 2;
    }

    const numByes = P - teams.length;
    const matches: Match[] = [];
    let matchNumber = 1;
    let teamIdx = 0;

    for (let b = 0; b < numByes; b++) {
      const team = teams[teamIdx++];
      matches.push({
        id: `r1-m${matchNumber}`,
        roundNumber: 1,
        matchNumber: matchNumber++,
        team1: team,
        team2: undefined,
        status: 'bye',
        winner: team,
        bracket: 'winners'
      });
    }

    while (teamIdx < teams.length) {
      const team1 = teams[teamIdx++];
      const team2 = teams[teamIdx++];
      matches.push({
        id: `r1-m${matchNumber}`,
        roundNumber: 1,
        matchNumber: matchNumber++,
        team1,
        team2,
        status: 'pending',
        bracket: 'winners'
      });
    }

    return [{
      roundNumber: 1,
      name: 'Round 1',
      matches,
      bracket: 'winners'
    }];
  },

  generateNextRound(currentRounds: Round[], teams: Team[]): Round[] {
    const lastRound = currentRounds[currentRounds.length - 1];
    if (!lastRound) return this.generateFirstRound(teams);

    // Check if last round has any unfinished matches
    const unfinished = lastRound.matches.some(m => m.status === 'pending' || m.status === 'in-progress');
    if (unfinished) {
      return currentRounds; // Can't generate next round yet
    }

    // Collect winners from the last round
    const winners: Team[] = [];
    for (const match of lastRound.matches) {
      if (match.winner) {
        winners.push(match.winner);
      }
    }

    // If only 1 winner remains, tournament is complete!
    if (winners.length <= 1) {
      return currentRounds;
    }

    const nextRoundNum = lastRound.roundNumber + 1;
    const matches: Match[] = [];
    let matchNumber = 1;

    for (let i = 0; i < winners.length; i += 2) {
      const team1 = winners[i];
      const team2 = winners[i + 1];

      if (!team2) {
        matches.push({
          id: `r${nextRoundNum}-m${matchNumber}`,
          roundNumber: nextRoundNum,
          matchNumber: matchNumber++,
          team1,
          team2: undefined,
          status: 'bye',
          winner: team1,
          bracket: 'winners'
        });
      } else {
        matches.push({
          id: `r${nextRoundNum}-m${matchNumber}`,
          roundNumber: nextRoundNum,
          matchNumber: matchNumber++,
          team1,
          team2,
          status: 'pending',
          bracket: 'winners'
        });
      }
    }

    const roundName = winners.length <= 2 ? 'Finals' : winners.length <= 4 ? 'Semi-Finals' : winners.length <= 8 ? 'Quarter-Finals' : `Round ${nextRoundNum}`;

    const newRound: Round = {
      roundNumber: nextRoundNum,
      name: roundName,
      matches,
      bracket: 'winners'
    };

    return [...currentRounds, newRound];
  },

  calculateStandings(rounds: Round[], teams: Team[]): Standing[] {
    const statsMap = new Map<string, { played: number; won: number; lost: number; pointsDiff: number; setsDiff: number; lastRoundReached: number }>();

    for (const team of teams) {
      statsMap.set(team.id, { played: 0, won: 0, lost: 0, pointsDiff: 0, setsDiff: 0, lastRoundReached: 0 });
    }

    for (const round of rounds) {
      for (const match of round.matches) {
        if (match.status === 'completed' || match.status === 'bye') {
          if (match.team1 && statsMap.has(match.team1.id)) {
            const s = statsMap.get(match.team1.id)!;
            s.lastRoundReached = Math.max(s.lastRoundReached, round.roundNumber);
            if (match.status === 'completed') {
              s.played++;
              if (match.score) {
                s.pointsDiff += (match.score.team1Points - match.score.team2Points);
                s.setsDiff += (match.score.team1Sets - match.score.team2Sets);
              }
              if (match.winner?.id === match.team1.id) s.won++;
              else s.lost++;
            } else if (match.status === 'bye') {
              s.won++;
            }
          }
          if (match.team2 && statsMap.has(match.team2.id)) {
            const s = statsMap.get(match.team2.id)!;
            s.lastRoundReached = Math.max(s.lastRoundReached, round.roundNumber);
            if (match.status === 'completed') {
              s.played++;
              if (match.score) {
                s.pointsDiff += (match.score.team2Points - match.score.team1Points);
                s.setsDiff += (match.score.team2Sets - match.score.team1Sets);
              }
              if (match.winner?.id === match.team2.id) s.won++;
              else s.lost++;
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

    // Sort by wins, then setsDiff, then pointsDifference
    standings.sort((a, b) => {
      if (b.won !== a.won) return b.won - a.won;
      if (b.setsDifference !== a.setsDifference) return b.setsDifference - a.setsDifference;
      return b.pointsDifference - a.pointsDifference;
    });

    standings.forEach((s, idx) => { s.rank = idx + 1; });
    return standings;
  },

  isFinished(rounds: Round[], teams: Team[]): boolean {
    if (rounds.length === 0) return false;
    const lastRound = rounds[rounds.length - 1];
    // Finished if last round has exactly 1 match and it is completed/bye
    if (lastRound.matches.length === 1) {
      const m = lastRound.matches[0];
      return m.status === 'completed' || m.status === 'bye';
    }
    return false;
  }
};
