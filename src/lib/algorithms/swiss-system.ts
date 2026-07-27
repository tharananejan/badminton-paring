import type { PairingAlgorithm } from './interface';
import type { Team, Round, Match, Standing } from '../types/tournament';

export const SwissSystemAlgorithm: PairingAlgorithm = {
  name: 'Swiss System',
  type: 'swiss',
  description: 'Players are paired in each round against opponents with a similar win/loss record without playing the same opponent twice.',

  generateFirstRound(teams: Team[]): Round[] {
    const matches: Match[] = [];
    let matchNumber = 1;

    for (let i = 0; i < teams.length; i += 2) {
      const team1 = teams[i];
      const team2 = teams[i + 1];

      if (!team2) {
        matches.push({
          id: `swiss-r1-m${matchNumber}`,
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
          id: `swiss-r1-m${matchNumber}`,
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
      name: 'Round 1',
      matches,
      bracket: 'winners'
    }];
  },

  generateNextRound(currentRounds: Round[], teams: Team[]): Round[] {
    const lastRound = currentRounds[currentRounds.length - 1];
    if (!lastRound) return this.generateFirstRound(teams);

    // Check if unfinished
    const unfinished = lastRound.matches.some(m => m.status === 'pending' || m.status === 'in-progress');
    if (unfinished) return currentRounds;

    // Check if we reached max rounds: generally ceil(log2(N)) or at most N-1
    const maxRounds = Math.min(teams.length - 1, Math.max(3, Math.ceil(Math.log2(teams.length))));
    if (lastRound.roundNumber >= maxRounds) {
      return currentRounds; // Tournament finished
    }

    // Get current standings to sort players by record
    const standings = this.calculateStandings(currentRounds, teams);
    const sortedTeams = standings.map(s => s.team);

    // Track past matchups and byes
    const pastMatchups = new Set<string>();
    const receivedBye = new Set<string>();

    for (const round of currentRounds) {
      for (const match of round.matches) {
        if (match.status === 'bye' && match.team1) {
          receivedBye.add(match.team1.id);
        } else if (match.team1 && match.team2) {
          const id1 = match.team1.id;
          const id2 = match.team2.id;
          pastMatchups.add(`${id1}|${id2}`);
          pastMatchups.add(`${id2}|${id1}`);
        }
      }
    }

    const nextRoundNum = lastRound.roundNumber + 1;
    const matches: Match[] = [];
    let matchNumber = 1;

    const unpaired = [...sortedTeams];

    // If odd number of teams, assign bye to lowest ranked team that hasn't had a bye
    if (unpaired.length % 2 !== 0) {
      let byeIndex = -1;
      for (let i = unpaired.length - 1; i >= 0; i--) {
        if (!receivedBye.has(unpaired[i].id)) {
          byeIndex = i;
          break;
        }
      }
      if (byeIndex === -1) byeIndex = unpaired.length - 1;

      const [byeTeam] = unpaired.splice(byeIndex, 1);
      matches.push({
        id: `swiss-r${nextRoundNum}-m${matchNumber++}`,
        roundNumber: nextRoundNum,
        matchNumber: matches.length + 1,
        team1: byeTeam,
        team2: undefined,
        status: 'bye',
        winner: byeTeam,
        bracket: 'winners'
      });
    }

    // Pair remaining players from top down
    while (unpaired.length >= 2) {
      const t1 = unpaired.shift()!;
      let bestOpponentIndex = -1;

      // Find highest ranked player who hasn't played t1 yet
      for (let i = 0; i < unpaired.length; i++) {
        const t2 = unpaired[i];
        if (!pastMatchups.has(`${t1.id}|${t2.id}`)) {
          bestOpponentIndex = i;
          break;
        }
      }

      // If all have played before, fallback to adjacent
      if (bestOpponentIndex === -1) {
        bestOpponentIndex = 0;
      }

      const [t2] = unpaired.splice(bestOpponentIndex, 1);
      matches.push({
        id: `swiss-r${nextRoundNum}-m${matchNumber++}`,
        roundNumber: nextRoundNum,
        matchNumber: matches.length + 1,
        team1: t1,
        team2: t2,
        status: 'pending',
        bracket: 'winners'
      });
    }

    const newRound: Round = {
      roundNumber: nextRoundNum,
      name: `Round ${nextRoundNum}`,
      matches,
      bracket: 'winners'
    };

    return [...currentRounds, newRound];
  },

  calculateStandings(rounds: Round[], teams: Team[]): Standing[] {
    const statsMap = new Map<string, { played: number; won: number; lost: number; pointsDiff: number; setsDiff: number }>();

    for (const team of teams) {
      statsMap.set(team.id, { played: 0, won: 0, lost: 0, pointsDiff: 0, setsDiff: 0 });
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
              else s.lost++;
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
    const maxRounds = Math.min(teams.length - 1, Math.max(3, Math.ceil(Math.log2(teams.length))));
    const lastRound = rounds[rounds.length - 1];
    if (lastRound.roundNumber >= maxRounds) {
      return lastRound.matches.every(m => m.status === 'completed' || m.status === 'bye');
    }
    return false;
  }
};
