import type { PairingAlgorithm } from './interface';
import type { Team, Round, Match, Standing } from '../types/tournament';

export const RoundRobinAlgorithm: PairingAlgorithm = {
  name: 'Round Robin',
  type: 'round-robin',
  description: 'Every team plays against every other team once. Standings are determined by total wins, set difference, and points difference.',

  generateFirstRound(teams: Team[]): Round[] {
    const rounds: Round[] = [];
    const n = teams.length;
    if (n < 2) return [];

    // If odd number of teams, add a dummy null for byes
    const isOdd = n % 2 !== 0;
    const numSlots = isOdd ? n + 1 : n;
    const slots: (Team | null)[] = [...teams];
    if (isOdd) slots.push(null);

    const totalRounds = numSlots - 1;
    const half = numSlots / 2;

    for (let r = 0; r < totalRounds; r++) {
      const matches: Match[] = [];
      let matchNum = 1;

      for (let i = 0; i < half; i++) {
        const t1 = slots[i];
        const t2 = slots[numSlots - 1 - i];

        if (!t1 && !t2) continue;

        if (!t1 || !t2) {
          // One of them is null -> Bye match for the other
          const activeTeam = t1 || t2!;
          matches.push({
            id: `rr-r${r + 1}-m${matchNum}`,
            roundNumber: r + 1,
            matchNumber: matchNum++,
            team1: activeTeam,
            team2: undefined,
            status: 'bye',
            winner: activeTeam,
            bracket: 'winners'
          });
        } else {
          matches.push({
            id: `rr-r${r + 1}-m${matchNum}`,
            roundNumber: r + 1,
            matchNumber: matchNum++,
            team1: t1,
            team2: t2,
            status: 'pending',
            bracket: 'winners'
          });
        }
      }

      rounds.push({
        roundNumber: r + 1,
        name: `Round ${r + 1}`,
        matches,
        bracket: 'winners'
      });

      // Rotate slots: keep slots[0] fixed, rotate slots[1..end] clockwise
      const last = slots.pop()!;
      slots.splice(1, 0, last);
    }

    return rounds;
  },

  generateNextRound(currentRounds: Round[], teams: Team[]): Round[] {
    // Round robin generates all rounds upfront in generateFirstRound
    return currentRounds;
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
    // Finished when every match in every round is completed or a bye
    return rounds.every(round =>
      round.matches.every(match => match.status === 'completed' || match.status === 'bye')
    );
  }
};
