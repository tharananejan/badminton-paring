import prompts from 'prompts';
import { TournamentManager } from '../lib/engine/tournament-manager';
import { encodeStateToUrlHash, exportStateToJson } from '../lib/engine/state-serializer';
import type { TournamentType, Match } from '../lib/types/tournament';

function formatMatch(m: Match): string {
  const t1 = m.team1 ? m.team1.name : '(Waiting/TBD)';
  const t2 = m.team2 ? m.team2.name : '(BYE/TBD)';
  const scoreStr = m.score ? `[Score: ${m.score.raw}]` : '';
  const winnerStr = m.winner ? ` -> Winner: ${m.winner.name}` : '';
  return `[${m.id}] ${t1} vs ${t2} | Status: ${m.status.toUpperCase()} ${scoreStr}${winnerStr}`;
}

async function runCli() {
  console.log('\n==================================================');
  console.log('🏸 BADMINTON TOURNAMENT PAIRING - CLI TESTER 🏸');
  console.log('==================================================\n');

  const setupAnswers = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'Tournament Name:',
      initial: 'Smash Open 2026'
    },
    {
      type: 'select',
      name: 'type',
      message: 'Select Pairing Algorithm:',
      choices: [
        { title: 'Single Elimination (Knockout)', value: 'knockout' },
        { title: 'Double Elimination (Double Knockout)', value: 'double-knockout' },
        { title: 'Round Robin (Everyone plays everyone)', value: 'round-robin' },
        { title: 'Swiss System (Similar win/loss record matching)', value: 'swiss' }
      ]
    },
    {
      type: 'text',
      name: 'teams',
      message: 'Enter team names (comma-separated):',
      initial: 'Smashers, Court Kings, Feather Hitters, Net Masters, Shuttle Warriors, Racket Legends'
    }
  ]);

  if (!setupAnswers.type || !setupAnswers.teams) {
    console.log('Aborted setup.');
    return;
  }

  const teamNames = setupAnswers.teams.split(',').map((s: string) => s.trim()).filter(Boolean);
  const manager = TournamentManager.createTournament(setupAnswers.name, setupAnswers.type as TournamentType, teamNames);

  console.log(`\n✅ Created "${setupAnswers.name}" with ${teamNames.length} teams using [${setupAnswers.type}] algorithm.`);

  while (manager.getState().status !== 'completed') {
    const state = manager.getState();
    const currentRoundNum = state.currentRound;
    
    // Find active rounds (or display current round)
    const activeRounds = state.rounds.filter(r => r.roundNumber === currentRoundNum || r.matches.some(m => m.status === 'pending'));

    console.log('\n--------------------------------------------------');
    console.log(`Current Progress: Round ${currentRoundNum} of ${state.rounds.length} | Status: ${state.status.toUpperCase()}`);
    console.log('--------------------------------------------------');

    const pendingMatches: Match[] = [];

    for (const round of activeRounds) {
      console.log(`\n--- ${round.name} (${round.bracket?.toUpperCase() || 'MAIN'}) ---`);
      for (const match of round.matches) {
        console.log(formatMatch(match));
        if (match.status === 'pending' && match.team1 && match.team2) {
          pendingMatches.push(match);
        }
      }
    }

    if (pendingMatches.length === 0) {
      console.log('\nAll ready matches in this round are completed!');
      const { advance } = await prompts({
        type: 'confirm',
        name: 'advance',
        message: 'Advance to the next round?',
        initial: true
      });
      if (advance) {
        const generatedNew = manager.advanceRound();
        if (!generatedNew && manager.getState().status === 'completed') {
          console.log('\n🏆 TOURNAMENT COMPLETED! 🏆');
          break;
        }
      } else {
        break;
      }
      continue;
    }

    const actionChoices = [
      ...pendingMatches.map(m => ({
        title: `Score Match: ${m.team1?.name} vs ${m.team2?.name} [${m.id}]`,
        value: m.id
      })),
      { title: '⚡ Auto-simulate all remaining matches in this round with realistic scores', value: 'SIMULATE_ALL' },
      { title: '❌ Exit CLI', value: 'EXIT' }
    ];

    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: 'Select action:',
      choices: actionChoices
    });

    if (action === 'EXIT' || !action) {
      break;
    }

    if (action === 'SIMULATE_ALL') {
      for (const m of pendingMatches) {
        const p1 = Math.floor(Math.random() * 8) + 14; // 14 to 21
        const p2 = p1 === 21 ? Math.floor(Math.random() * 8) + 12 : 21;
        const simScore = `${p1}-${p2}`;
        console.log(`Simulating ${m.team1?.name} vs ${m.team2?.name} -> Score: ${simScore}`);
        manager.recordMatchScore(m.id, simScore);
      }
      continue;
    }

    // Manual scoring
    const selectedMatch = pendingMatches.find(m => m.id === action);
    if (selectedMatch) {
      const { scoreStr } = await prompts({
        type: 'text',
        name: 'scoreStr',
        message: `Enter score for ${selectedMatch.team1?.name} vs ${selectedMatch.team2?.name} (e.g. "21-15" or "21-4, 15-8"):`,
        initial: '21-18'
      });
      if (scoreStr) {
        try {
          const updated = manager.recordMatchScore(selectedMatch.id, scoreStr);
          console.log(`✅ Score recorded! Winner: ${updated?.winner?.name}`);
        } catch (err: any) {
          console.error(`❌ Error recording score: ${err.message}`);
        }
      }
    }
  }

  const finalState = manager.getState();
  console.log('\n==================================================');
  console.log('🏆 FINAL TOURNAMENT STANDINGS 🏆');
  console.log('==================================================');
  console.log('Rank | Team Name          | Played | Won | Lost | Sets Diff | Points Diff');
  console.log('-------------------------------------------------------------------------');
  for (const s of finalState.standings) {
    const namePad = s.team.name.padEnd(18).substring(0, 18);
    console.log(` #${String(s.rank).padEnd(3)} | ${namePad} | ${String(s.played).padEnd(6)} | ${String(s.won).padEnd(3)} | ${String(s.lost).padEnd(4)} | ${String(s.setsDifference).padEnd(9)} | ${s.pointsDifference}`);
  }

  console.log('\n🔗 URL STATE ENCODING (lz-string compressed hash):');
  const urlHash = encodeStateToUrlHash(finalState);
  console.log(`https://badminton-app.vercel.app/#${urlHash}`);
  console.log(`(Hash Length: ${urlHash.length} characters - opening this link anywhere instantly restores this exact tournament state!)`);

  console.log('\n📦 JSON BACKUP SAMPLE (first 500 chars):');
  console.log(exportStateToJson(finalState).substring(0, 500) + '\n...\n');
  console.log('==================================================\n');
}

runCli().catch(err => console.error(err));
