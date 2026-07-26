import type { Score, Team } from '../types/tournament';

/**
 * Parses a score string such as "21-4, 15-8" or "21-19" or "21:15 18:21 21:19".
 * Determines set winners and total points to declare who won the match.
 */
export function parseScore(rawScore: string, team1?: Team, team2?: Team): Score {
  const cleanScore = rawScore.trim();
  let team1Sets = 0;
  let team2Sets = 0;
  let team1Points = 0;
  let team2Points = 0;

  // Split by comma or multiple spaces into set tokens
  const setTokens = cleanScore.split(/[,;\s]+/).filter(Boolean);

  for (const token of setTokens) {
    // Match two numbers separated by dash, colon, or slash (e.g. 21-4, 21:4, 21/4)
    const match = token.match(/^(\d+)[-:/](\d+)$/);
    if (match) {
      const p1 = parseInt(match[1], 10);
      const p2 = parseInt(match[2], 10);
      team1Points += p1;
      team2Points += p2;
      if (p1 > p2) {
        team1Sets += 1;
      } else if (p2 > p1) {
        team2Sets += 1;
      }
    }
  }

  // If no dashed format was found, try checking if rawScore is just two numbers (e.g. "21 19")
  if (setTokens.length === 2 && team1Sets === 0 && team2Sets === 0) {
    const p1 = parseInt(setTokens[0], 10);
    const p2 = parseInt(setTokens[1], 10);
    if (!isNaN(p1) && !isNaN(p2)) {
      team1Points = p1;
      team2Points = p2;
      if (p1 > p2) team1Sets = 1;
      else if (p2 > p1) team2Sets = 1;
    }
  }

  let winnerId: string | undefined = undefined;
  if (team1 && team2) {
    if (team1Sets > team2Sets) {
      winnerId = team1.id;
    } else if (team2Sets > team1Sets) {
      winnerId = team2.id;
    } else if (team1Points > team2Points) {
      // Fallback to total points if sets are equal
      winnerId = team1.id;
    } else if (team2Points > team1Points) {
      winnerId = team2.id;
    }
  }

  return {
    raw: cleanScore,
    team1Sets,
    team2Sets,
    team1Points,
    team2Points,
    winnerId
  };
}
