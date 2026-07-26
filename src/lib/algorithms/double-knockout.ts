import type { PairingAlgorithm } from './interface';
import type { Team, Round, Match, Standing } from '../types/tournament';

export const DoubleKnockoutAlgorithm: PairingAlgorithm = {
  name: 'Double Elimination (Double Knockout)',
  type: 'double-knockout',
  description: 'Players must lose twice to be eliminated. Features a Winners Bracket, Losers (Redemption) Bracket, and Grand Finals.',

  generateFirstRound(teams: Team[]): Round[] {
    let P = 2;
    while (P < teams.length) {
      P *= 2;
    }

    const numByes = P - teams.length;
    const matches: Match[] = [];
    let matchNumber = 1;
    let teamIdx = 0;

    // First, create BYE matches for top seeds
    for (let b = 0; b < numByes; b++) {
      const team = teams[teamIdx++];
      matches.push({
        id: `w-r1-m${matchNumber}`,
        roundNumber: 1,
        matchNumber: matchNumber++,
        team1: team,
        team2: undefined,
        status: 'bye',
        winner: team,
        bracket: 'winners'
      });
    }

    // Next, pair remaining teams into real matches
    while (teamIdx < teams.length) {
      const team1 = teams[teamIdx++];
      const team2 = teams[teamIdx++];
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

    const hasUnfinishedMatches = currentRounds.some(r =>
      r.matches.some(m => m.status === 'pending' || m.status === 'in-progress')
    );
    if (hasUnfinishedMatches) {
      return currentRounds;
    }

    const winnersRounds = currentRounds.filter(r => r.bracket === 'winners');
    const losersRounds = currentRounds.filter(r => r.bracket === 'losers');
    const grandFinalsRounds = currentRounds.filter(r => r.bracket === 'grand-finals');

    if (grandFinalsRounds.length > 0) {
      return currentRounds;
    }

    const latestWRound = winnersRounds[winnersRounds.length - 1];
    const activeWinners: Team[] = latestWRound
      ? latestWRound.matches.map(m => m.winner).filter((t): t is Team => t !== undefined)
      : [];

    const teamsInLosersBracket = new Set<string>();
    for (const r of losersRounds) {
      for (const m of r.matches) {
        if (m.team1) teamsInLosersBracket.add(m.team1.id);
        if (m.team2) teamsInLosersBracket.add(m.team2.id);
      }
    }

    const newWLosers: Team[] = [];
    for (const r of winnersRounds) {
      for (const m of r.matches) {
        if ((m.status === 'completed' || m.status === 'bye') && m.loser) {
          if (!teamsInLosersBracket.has(m.loser.id)) {
            newWLosers.push(m.loser);
          }
        }
      }
    }

    const latestLRound = losersRounds.length > 0 ? losersRounds[losersRounds.length - 1] : null;
    const latestLWinners: Team[] = latestLRound
      ? latestLRound.matches.map(m => m.winner).filter((t): t is Team => t !== undefined)
      : [];

    if (activeWinners.length === 1 && latestLWinners.length === 1 && newWLosers.length === 0) {
      const nextRoundNum = lastRound.roundNumber + 1;
      const grandFinalsRound: Round = {
        roundNumber: nextRoundNum,
        name: 'Grand Finals',
        bracket: 'grand-finals',
        matches: [{
          id: `gf-r${nextRoundNum}-m1`,
          roundNumber: nextRoundNum,
          matchNumber: 1,
          team1: activeWinners[0],
          team2: latestLWinners[0],
          status: 'pending',
          bracket: 'grand-finals'
        }]
      };
      return [...currentRounds, grandFinalsRound];
    }

    const newRoundsToAdd: Round[] = [];
    let nextRoundNum = lastRound.roundNumber + 1;

    if (activeWinners.length >= 2) {
      const nextWRoundNum = winnersRounds.length + 1;
      const matches: Match[] = [];
      let matchNumber = 1;

      for (let i = 0; i < activeWinners.length; i += 2) {
        const t1 = activeWinners[i];
        const t2 = activeWinners[i + 1];
        if (!t2) {
          matches.push({
            id: `w-r${nextWRoundNum}-m${matchNumber}`,
            roundNumber: nextWRoundNum,
            matchNumber: matchNumber++,
            team1: t1,
            team2: undefined,
            status: 'bye',
            winner: t1,
            bracket: 'winners'
          });
        } else {
          matches.push({
            id: `w-r${nextWRoundNum}-m${matchNumber}`,
            roundNumber: nextWRoundNum,
            matchNumber: matchNumber++,
            team1: t1,
            team2: t2,
            status: 'pending',
            bracket: 'winners'
          });
        }
      }
      newRoundsToAdd.push({
        roundNumber: nextRoundNum++,
        name: `Winners Round ${nextWRoundNum}`,
        bracket: 'winners',
        matches
      });
    }

    const nextLRoundNum = losersRounds.length + 1;

    if (nextLRoundNum === 1) {
      if (newWLosers.length >= 1) {
        const matches: Match[] = [];
        let matchNumber = 1;

        for (let i = 0; i < newWLosers.length; i += 2) {
          const t1 = newWLosers[i];
          const t2 = newWLosers[i + 1];
          if (!t2) {
            matches.push({
              id: `l-r1-m${matchNumber}`,
              roundNumber: 1,
              matchNumber: matchNumber++,
              team1: t1,
              team2: undefined,
              status: 'bye',
              winner: t1,
              bracket: 'losers'
            });
          } else {
            matches.push({
              id: `l-r1-m${matchNumber}`,
              roundNumber: 1,
              matchNumber: matchNumber++,
              team1: t1,
              team2: t2,
              status: 'pending',
              bracket: 'losers'
            });
          }
        }
        newRoundsToAdd.push({
          roundNumber: nextRoundNum++,
          name: 'Losers Round 1',
          bracket: 'losers',
          matches
        });
      }
    } else if (nextLRoundNum % 2 === 0) {
      if (latestLWinners.length > 0 && newWLosers.length > 0) {
        const matches: Match[] = [];
        let matchNumber = 1;

        // Pair lower bracket winners vs incoming drop-down losers in natural bracket order
        const pairedWLosers = [...newWLosers].reverse();
        const count = Math.max(latestLWinners.length, pairedWLosers.length);

        for (let i = 0; i < count; i++) {
          const t1 = latestLWinners[i];
          const t2 = pairedWLosers[i];

          if (!t1 || !t2) {
            const soloTeam = t1 || t2;
            matches.push({
              id: `l-r${nextLRoundNum}-m${matchNumber}`,
              roundNumber: nextLRoundNum,
              matchNumber: matchNumber++,
              team1: soloTeam,
              team2: undefined,
              status: 'bye',
              winner: soloTeam,
              bracket: 'losers'
            });
          } else {
            matches.push({
              id: `l-r${nextLRoundNum}-m${matchNumber}`,
              roundNumber: nextLRoundNum,
              matchNumber: matchNumber++,
              team1: t1,
              team2: t2,
              status: 'pending',
              bracket: 'losers'
            });
          }
        }
        newRoundsToAdd.push({
          roundNumber: nextRoundNum++,
          name: `Losers Round ${nextLRoundNum}`,
          bracket: 'losers',
          matches
        });
      }
    } else {
      // Odd Losers Round (L3, L5...): Pair previous LB winners among themselves
      if (latestLWinners.length >= 1) {
        const matches: Match[] = [];
        let matchNumber = 1;

        for (let i = 0; i < latestLWinners.length; i += 2) {
          const t1 = latestLWinners[i];
          const t2 = latestLWinners[i + 1];

          if (!t2) {
            matches.push({
              id: `l-r${nextLRoundNum}-m${matchNumber}`,
              roundNumber: nextLRoundNum,
              matchNumber: matchNumber++,
              team1: t1,
              team2: undefined,
              status: 'bye',
              winner: t1,
              bracket: 'losers'
            });
          } else {
            matches.push({
              id: `l-r${nextLRoundNum}-m${matchNumber}`,
              roundNumber: nextLRoundNum,
              matchNumber: matchNumber++,
              team1: t1,
              team2: t2,
              status: 'pending',
              bracket: 'losers'
            });
          }
        }
        newRoundsToAdd.push({
          roundNumber: nextRoundNum++,
          name: `Losers Round ${nextLRoundNum}`,
          bracket: 'losers',
          matches
        });
      }
    }

    if (newRoundsToAdd.length === 0) {
      return currentRounds;
    }

    return [...currentRounds, ...newRoundsToAdd];
  },

  calculateStandings(rounds: Round[], teams: Team[]): Standing[] {
    const statsMap = new Map<string, { played: number; won: number; lost: number; pointsDiff: number; setsDiff: number; highestRoundReached: number }>();

    for (const team of teams) {
      statsMap.set(team.id, { played: 0, won: 0, lost: 0, pointsDiff: 0, setsDiff: 0, highestRoundReached: 0 });
    }

    for (const round of rounds) {
      for (const match of round.matches) {
        if (match.status === 'completed' || match.status === 'bye') {
          if (match.team1 && statsMap.has(match.team1.id)) {
            const s = statsMap.get(match.team1.id)!;
            s.highestRoundReached = Math.max(s.highestRoundReached, round.roundNumber);
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
            s.highestRoundReached = Math.max(s.highestRoundReached, round.roundNumber);
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
      const sA = statsMap.get(a.team.id)!;
      const sB = statsMap.get(b.team.id)!;
      // Sort by fewest losses first (0 loss champ, 1 loss runner-up, 2 losses eliminated)
      if (sA.lost !== sB.lost) return sA.lost - sB.lost;
      // Then by highest round reached
      if (sB.highestRoundReached !== sA.highestRoundReached) return sB.highestRoundReached - sA.highestRoundReached;
      // Then by wins
      if (b.won !== a.won) return b.won - a.won;
      // Then by sets diff and points diff
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

