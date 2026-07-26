<script lang="ts">
  import type { TournamentState, Match, Round } from '../types/tournament';
  import MatchCard from './MatchCard.svelte';
  import BracketDiagram from './BracketDiagram.svelte';

  let { 
    tournamentState, 
    canUndo = false,
    onUndo = () => {},
    onSelectMatch = () => {}, 
    onRenameTeam = () => {}, 
    onShareLink = () => {}, 
    onExportJson = () => {}, 
    onDeleteTournament = () => {} 
  } = $props<{
    tournamentState: TournamentState;
    canUndo?: boolean;
    onUndo?: () => void;
    onSelectMatch: (match: Match) => void;
    onRenameTeam: (teamId: string, newName: string) => void;
    onShareLink: () => void;
    onExportJson: () => void;
    onDeleteTournament: () => void;
  }>();

  let activeTab = $state<'matches' | 'standings' | 'settings'>('matches');
  let matchViewMode = $state<'diagram' | 'list'>('diagram');
  let editingTeamId = $state<string | null>(null);
  let editTeamName = $state('');

  function startRename(id: string, currentName: string) {
    editingTeamId = id;
    editTeamName = currentName;
  }

  function saveRename(id: string) {
    const trimmed = editTeamName.trim();
    if (trimmed) {
      onRenameTeam(id, trimmed);
    }
    editingTeamId = null;
  }

  // Check if all playable matches in the current round (or all rounds so far) are completed
  let isCurrentRoundComplete = $derived(() => {
    if (!tournamentState.rounds || tournamentState.rounds.length === 0) return false;
    const currentR = tournamentState.rounds[tournamentState.rounds.length - 1];
    if (!currentR) return false;
    return currentR.matches.every((m: Match) => m.status === 'completed' || m.status === 'bye');
  });

  // Group rounds for display (filtering out BYE matches)
  let upperRounds = $derived(
    tournamentState.rounds
      .map((r: Round) => ({
        ...r,
        matches: r.matches.filter((m: Match) => m.status !== 'bye')
      }))
      .filter((r: Round) => (!r.bracket || r.bracket === 'winners' || r.bracket === 'grand-finals') && r.matches.length > 0)
  );
  let lowerRounds = $derived(
    tournamentState.rounds
      .map((r: Round) => ({
        ...r,
        matches: r.matches.filter((m: Match) => m.status !== 'bye')
      }))
      .filter((r: Round) => r.bracket === 'losers' && r.matches.length > 0)
  );

  function formatTypeLabel(type: string): string {
    switch (type) {
      case 'knockout': return 'Single Elimination';
      case 'double-knockout': return 'Double Elimination';
      case 'round-robin': return 'Round Robin';
      case 'swiss': return 'Swiss System';
      default: return type;
    }
  }
</script>

<div class="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-24">
  <!-- Tournament Title Banner -->
  <div class="card-theme rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden border-l-4 border-l-emerald-500">
    <div class="space-y-1">
      <div class="flex items-center gap-2">
        <span class="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
          {formatTypeLabel(tournamentState.type)}
        </span>
        {#if tournamentState.status === 'completed'}
          <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            Tournament Completed
          </span>
        {:else}
          <span class="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
            Round {tournamentState.currentRound} in Progress
          </span>
        {/if}
      </div>
      <h2 class="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
        {tournamentState.name}
      </h2>
    </div>

    <div class="flex items-center gap-2 shrink-0">
      <button 
        type="button" 
        disabled={!canUndo}
        onclick={() => canUndo && onUndo()}
        class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 {canUndo ? 'bg-amber-500/15 text-amber-900 border border-amber-500/40 shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#bebebe] cursor-pointer hover:bg-amber-500/25' : 'bg-slate-300/40 text-slate-400 border border-slate-300/50 cursor-not-allowed opacity-60'}"
        title={canUndo ? 'Undo last score entry and revert pairings' : 'No match score to undo yet'}
      >
        <svg class="w-3.5 h-3.5 {canUndo ? 'text-amber-700' : 'text-slate-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6" />
        </svg>
        <span>Undo Score</span>
      </button>
      <button 
        type="button" 
        onclick={onShareLink}
        class="btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
      >
        <span>Share Link</span>
      </button>
      <button 
        type="button" 
        onclick={() => activeTab = 'settings'}
        class="p-2.5 rounded-xl bg-[#e0e5ec] text-slate-700 border border-white/80 shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff] transition-colors cursor-pointer"
        title="Tournament Settings & Teams"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Mobile/Desktop Tab Bar -->
  <div class="flex border-b border-slate-300 gap-2 overflow-x-auto no-scrollbar">
    <button 
      type="button"
      onclick={() => activeTab = 'matches'}
      class="px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap {activeTab === 'matches' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'}"
    >
      <span>Bracket &amp; Matches</span>
      <span class="text-xs bg-[#e0e5ec] px-2 py-0.5 rounded-full border border-white/80 text-slate-700 font-bold shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
        {tournamentState.rounds.reduce((acc: number, r: Round) => acc + r.matches.length, 0)}
      </span>
    </button>

    <button 
      type="button"
      onclick={() => activeTab = 'standings'}
      class="px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap {activeTab === 'standings' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'}"
    >
      <span>Standings</span>
    </button>

    <button 
      type="button"
      onclick={() => activeTab = 'settings'}
      class="px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap {activeTab === 'settings' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'}"
    >
      <span>Teams &amp; Settings</span>
    </button>
  </div>

  <!-- TAB 1: BRACKETS & MATCHES -->
  {#if activeTab === 'matches'}
    <div class="space-y-6 animate-fade-in">

      <!-- Bracket View Mode Switcher for Knockout & Double Knockout -->
      {#if tournamentState.type === 'knockout' || tournamentState.type === 'double-knockout'}
        <div class="flex items-center justify-between gap-3 bg-[#e0e5ec] p-2 rounded-2xl border border-white/80 shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff]">
          <span class="text-xs font-extrabold text-slate-700 uppercase tracking-wider px-2">View Format:</span>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              onclick={() => matchViewMode = 'diagram'}
              class="px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 {matchViewMode === 'diagram' ? 'bg-emerald-600 text-white shadow-[2px_2px_5px_#bebebe]' : 'text-slate-600 hover:text-slate-900 bg-[#e0e5ec] border border-white/70 shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]'}"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12H4z" />
              </svg>
              <span>Visual Bracket</span>
            </button>
            <button
              type="button"
              onclick={() => matchViewMode = 'list'}
              class="px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 {matchViewMode === 'list' ? 'bg-emerald-600 text-white shadow-[2px_2px_5px_#bebebe]' : 'text-slate-600 hover:text-slate-900 bg-[#e0e5ec] border border-white/70 shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]'}"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>List Cards</span>
            </button>
          </div>
        </div>
      {/if}

      {#if (tournamentState.type === 'knockout' || tournamentState.type === 'double-knockout') && matchViewMode === 'diagram'}
        <!-- VISUAL BRACKET DIAGRAM -->
        <BracketDiagram {tournamentState} {onSelectMatch} />
      {:else}
        <!-- LIST CARDS VIEW -->
        <div class="space-y-8">
          <!-- Upper / Main Bracket Rounds -->
          <div class="space-y-6">
            {#each upperRounds as round (round.roundNumber)}
              <div class="space-y-3">
                <div class="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 class="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {round.name}
                  </h3>
                  <span class="text-xs text-slate-500 font-medium">
                    {round.matches.filter((m: Match) => m.status === 'completed').length} / {round.matches.length} finished
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {#each round.matches as match (match.id)}
                    <MatchCard {match} {onSelectMatch} />
                  {/each}
                </div>
              </div>
            {/each}
          </div>

          <!-- Lower Bracket Rounds -->
          {#if lowerRounds.length > 0}
            <div class="space-y-6 pt-6 border-t-2 border-dashed border-slate-300">
              <div class="flex items-center gap-2">
                <div>
                  <h3 class="text-lg font-bold text-amber-700">Lower Bracket (Elimination Bracket)</h3>
                  <p class="text-xs text-slate-600 font-medium">One loss leaves players here; a second loss eliminates them.</p>
                </div>
              </div>

              {#each lowerRounds as round (round.roundNumber)}
                <div class="space-y-3">
                  <div class="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 class="text-sm md:text-base font-bold text-slate-800 flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                      {round.name}
                    </h4>
                    <span class="text-xs text-slate-500 font-medium">
                      {round.matches.filter((m: Match) => m.status === 'completed').length} / {round.matches.length} finished
                    </span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {#each round.matches as match (match.id)}
                      <MatchCard {match} {onSelectMatch} />
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>

  <!-- TAB 2: STANDINGS -->
  {:else if activeTab === 'standings'}
    <div class="card-theme rounded-2xl overflow-hidden animate-fade-in">
      <div class="p-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 class="font-bold text-lg text-slate-800">Standings &amp; Leaderboard</h3>
          <p class="text-xs text-slate-500 font-medium">Rankings updated automatically after every match completion.</p>
        </div>
        <span class="text-xs bg-[#e0e5ec] px-3 py-1 rounded-full border border-white/80 text-slate-700 font-bold shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
          {tournamentState.standings.length} Teams
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-200/60 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-300">
              <th class="py-3.5 px-4 text-center w-12">Rank</th>
              <th class="py-3.5 px-4">Team</th>
              <th class="py-3.5 px-4 text-center">Played</th>
              <th class="py-3.5 px-4 text-center text-emerald-700">Won</th>
              <th class="py-3.5 px-4 text-center text-rose-600">Lost</th>
              <th class="py-3.5 px-4 text-center">Sets Diff</th>
              <th class="py-3.5 px-4 text-center">Pts Diff</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 text-sm font-medium">
            {#each tournamentState.standings as standing, idx (standing.team.id)}
              <tr class="hover:bg-slate-100/50 transition-colors {idx === 0 && standing.won > 0 ? 'bg-emerald-500/10 font-bold' : ''}">
                <td class="py-3.5 px-4 text-center font-mono font-bold {idx === 0 ? 'text-emerald-700 font-extrabold' : 'text-slate-600'}">
                  {standing.rank || idx + 1}
                </td>
                <td class="py-3.5 px-4 text-slate-800 font-semibold">
                  {standing.team.name}
                </td>
                <td class="py-3.5 px-4 text-center font-mono text-slate-700">{standing.played}</td>
                <td class="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">{standing.won}</td>
                <td class="py-3.5 px-4 text-center font-mono text-slate-600">{standing.lost}</td>
                <td class="py-3.5 px-4 text-center font-mono {standing.setsDifference > 0 ? 'text-emerald-700 font-bold' : standing.setsDifference < 0 ? 'text-rose-600' : 'text-slate-500'}">
                  {standing.setsDifference > 0 ? `+${standing.setsDifference}` : standing.setsDifference}
                </td>
                <td class="py-3.5 px-4 text-center font-mono {standing.pointsDifference > 0 ? 'text-emerald-700 font-bold' : standing.pointsDifference < 0 ? 'text-rose-600' : 'text-slate-500'}">
                  {standing.pointsDifference > 0 ? `+${standing.pointsDifference}` : standing.pointsDifference}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

  <!-- TAB 3: TEAMS & SETTINGS -->
  {:else if activeTab === 'settings'}
    <div class="space-y-6 animate-fade-in">
      <!-- Rename Teams Box -->
      <div class="card-theme rounded-2xl p-5 md:p-6 space-y-4">
        <div>
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            Rename Participants
          </h3>
          <p class="text-xs text-slate-600 font-medium">
            Renaming a team here will immediately update all past and future bracket fixtures and leaderboard standings.
          </p>
        </div>

        <div class="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
          {#each tournamentState.teams as team, idx (team.id)}
            <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#e0e5ec] border border-white/70 shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
              <span class="w-6 h-6 rounded-full bg-[#e0e5ec] text-slate-700 font-mono text-xs flex items-center justify-center font-bold shrink-0 shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff]">
                {idx + 1}
              </span>

              {#if editingTeamId === team.id}
                <form 
                  onsubmit={(e) => { e.preventDefault(); saveRename(team.id); }} 
                  class="flex items-center gap-2 flex-1"
                >
                  <input 
                    type="text" 
                    bind:value={editTeamName}
                    class="input-theme px-3 py-1.5 rounded-lg text-sm flex-1 font-semibold text-slate-800"
                  />
                  <button 
                    type="submit"
                    class="btn-primary px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Save
                  </button>
                  <button 
                    type="button"
                    onclick={() => editingTeamId = null}
                    class="text-xs text-slate-600 font-semibold px-2 py-1 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              {:else}
                <span class="text-sm md:text-base font-semibold text-slate-800 flex-1 truncate">
                  {team.name}
                </span>
                <button 
                  type="button"
                  onclick={() => startRename(team.id, team.name)}
                  class="btn-secondary text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold"
                >
                  Rename
                </button>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Share & Storage Actions -->
      <div class="card-theme rounded-2xl p-5 md:p-6 space-y-4">
        <div>
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            Share &amp; Export
          </h3>
          <p class="text-xs text-slate-600 font-medium">
            Share this live tournament with players on any device via a compressed URL link, or backup as JSON.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button 
            type="button" 
            onclick={onShareLink}
            class="btn-primary py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Copy Shareable Link</span>
          </button>
          <button 
            type="button" 
            onclick={onExportJson}
            class="btn-secondary py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Export Backup JSON</span>
          </button>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="card-theme rounded-2xl p-5 md:p-6 border-rose-300 space-y-4 bg-rose-500/5">
        <div>
          <h3 class="text-lg font-bold text-rose-600 flex items-center gap-2">
            Danger Zone
          </h3>
          <p class="text-xs text-slate-600 font-medium">
            Deleting this tournament will permanently erase all recorded scores, fixtures, and standings from your storage.
          </p>
        </div>

        <button 
          type="button" 
          onclick={onDeleteTournament}
          class="bg-rose-600 hover:bg-rose-700 text-white py-3 px-6 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#991b1b]"
        >
          Permanently Delete Tournament
        </button>
      </div>
    </div>
  {/if}
</div>
