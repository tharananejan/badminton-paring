<script lang="ts">
  import type { TournamentState, Match, Round } from '../types/tournament';
  import MatchCard from './MatchCard.svelte';

  let { 
    tournamentState, 
    onSelectMatch = () => {}, 
    onAdvanceRound = () => {}, 
    onRenameTeam = () => {}, 
    onShareLink = () => {}, 
    onExportJson = () => {}, 
    onDeleteTournament = () => {} 
  } = $props<{
    tournamentState: TournamentState;
    onSelectMatch: (match: Match) => void;
    onAdvanceRound: () => void;
    onRenameTeam: (teamId: string, newName: string) => void;
    onShareLink: () => void;
    onExportJson: () => void;
    onDeleteTournament: () => void;
  }>();

  let activeTab = $state<'matches' | 'standings' | 'settings'>('matches');
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

  // Group rounds for display
  let upperRounds = $derived(
    tournamentState.rounds.filter((r: Round) => !r.bracket || r.bracket === 'winners' || r.bracket === 'grand-finals')
  );
  let lowerRounds = $derived(
    tournamentState.rounds.filter((r: Round) => r.bracket === 'losers')
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
  <div class="card-theme rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden border-l-4 border-l-[#10B981]">
    <div class="space-y-1">
      <div class="flex items-center gap-2">
        <span class="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-[#10B981] border border-[#10B981]/20">
          {formatTypeLabel(tournamentState.type)}
        </span>
        {#if tournamentState.status === 'completed'}
          <span class="inline-flex items-center gap-1 text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full border border-[#10B981]/30">
            Tournament Completed
          </span>
        {:else}
          <span class="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
            Round {tournamentState.currentRound} in Progress
          </span>
        {/if}
      </div>
      <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
        {tournamentState.name}
      </h2>
    </div>

    <div class="flex items-center gap-2 shrink-0">
      <button 
        type="button" 
        onclick={onShareLink}
        class="btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:border-[#10B981]/40"
      >
        <span>Share Link</span>
      </button>
      <button 
        type="button" 
        onclick={() => activeTab = 'settings'}
        class="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
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
  <div class="flex border-b border-white/15 gap-2 overflow-x-auto no-scrollbar">
    <button 
      type="button"
      onclick={() => activeTab = 'matches'}
      class="px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap {activeTab === 'matches' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-white/60 hover:text-white'}"
    >
      <span>Bracket &amp; Matches</span>
      <span class="text-xs bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
        {tournamentState.rounds.reduce((acc: number, r: Round) => acc + r.matches.length, 0)}
      </span>
    </button>

    <button 
      type="button"
      onclick={() => activeTab = 'standings'}
      class="px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap {activeTab === 'standings' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-white/60 hover:text-white'}"
    >
      <span>Standings</span>
    </button>

    <button 
      type="button"
      onclick={() => activeTab = 'settings'}
      class="px-5 py-3 font-bold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap {activeTab === 'settings' ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-white/60 hover:text-white'}"
    >
      <span>Teams &amp; Settings</span>
    </button>
  </div>

  <!-- TAB 1: BRACKETS & MATCHES -->
  {#if activeTab === 'matches'}
    <div class="space-y-8 animate-fade-in">
      <!-- Advance Round Button Bar -->
      {#if tournamentState.status !== 'completed' && isCurrentRoundComplete()}
        <div class="p-5 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div class="space-y-0.5 text-center sm:text-left">
            <h4 class="font-bold text-base text-[#10B981] flex items-center justify-center sm:justify-start gap-1.5">
              Current Round Matches Completed!
            </h4>
            <p class="text-xs text-white/80">
              All scores recorded. Advance to generate the next round matchups.
            </p>
          </div>
          <button 
            type="button" 
            onclick={onAdvanceRound}
            class="btn-primary px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer shrink-0 shadow-lg"
          >
            <span>Advance to Next Round →</span>
          </button>
        </div>
      {/if}

      <!-- Upper / Main Bracket Rounds -->
      <div class="space-y-6">
        {#each upperRounds as round (round.roundNumber)}
          <div class="space-y-3">
            <div class="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 class="text-base md:text-lg font-bold text-white flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-[#10B981]"></span>
                {round.name}
              </h3>
              <span class="text-xs text-white/50">
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
        <div class="space-y-6 pt-6 border-t-2 border-dashed border-white/15">
          <div class="flex items-center gap-2">
            <div>
              <h3 class="text-lg font-bold text-amber-400">Lower Bracket (Elimination Bracket)</h3>
              <p class="text-xs text-white/60">One loss leaves players here; a second loss eliminates them.</p>
            </div>
          </div>

          {#each lowerRounds as round (round.roundNumber)}
            <div class="space-y-3">
              <div class="flex items-center justify-between border-b border-white/10 pb-2">
                <h4 class="text-sm md:text-base font-bold text-white/90 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                  {round.name}
                </h4>
                <span class="text-xs text-white/50">
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

  <!-- TAB 2: STANDINGS -->
  {:else if activeTab === 'standings'}
    <div class="card-theme rounded-2xl overflow-hidden animate-fade-in">
      <div class="p-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 class="font-bold text-lg text-white">Standings &amp; Leaderboard</h3>
          <p class="text-xs text-white/50">Rankings updated automatically after every match completion.</p>
        </div>
        <span class="text-xs bg-black/40 px-3 py-1 rounded-full border border-white/10 text-white/80">
          {tournamentState.standings.length} Teams
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-black/40 text-[11px] font-bold uppercase tracking-wider text-white/50 border-b border-white/10">
              <th class="py-3.5 px-4 text-center w-12">Rank</th>
              <th class="py-3.5 px-4">Team</th>
              <th class="py-3.5 px-4 text-center">Played</th>
              <th class="py-3.5 px-4 text-center text-[#10B981]">Won</th>
              <th class="py-3.5 px-4 text-center text-[#EF4444]">Lost</th>
              <th class="py-3.5 px-4 text-center">Sets Diff</th>
              <th class="py-3.5 px-4 text-center">Pts Diff</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-sm font-medium">
            {#each tournamentState.standings as standing, idx (standing.team.id)}
              <tr class="hover:bg-white/5 transition-colors {idx === 0 && standing.won > 0 ? 'bg-[#10B981]/10 font-bold' : ''}">
                <td class="py-3.5 px-4 text-center font-mono font-bold {idx === 0 ? 'text-[#10B981]' : 'text-white/60'}">
                  {standing.rank || idx + 1}
                </td>
                <td class="py-3.5 px-4 text-white font-semibold">
                  {standing.team.name}
                </td>
                <td class="py-3.5 px-4 text-center font-mono text-white/80">{standing.played}</td>
                <td class="py-3.5 px-4 text-center font-mono font-bold text-[#10B981]">{standing.won}</td>
                <td class="py-3.5 px-4 text-center font-mono text-white/60">{standing.lost}</td>
                <td class="py-3.5 px-4 text-center font-mono {standing.setsDifference > 0 ? 'text-[#10B981]' : standing.setsDifference < 0 ? 'text-[#EF4444]' : 'text-white/50'}">
                  {standing.setsDifference > 0 ? `+${standing.setsDifference}` : standing.setsDifference}
                </td>
                <td class="py-3.5 px-4 text-center font-mono {standing.pointsDifference > 0 ? 'text-[#10B981]' : standing.pointsDifference < 0 ? 'text-[#EF4444]' : 'text-white/50'}">
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
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            Rename Participants
          </h3>
          <p class="text-xs text-white/60">
            Renaming a team here will immediately update all past and future bracket fixtures and leaderboard standings.
          </p>
        </div>

        <div class="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {#each tournamentState.teams as team, idx (team.id)}
            <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/30 border border-white/5">
              <span class="w-6 h-6 rounded-full bg-[#26413C] text-white/60 font-mono text-xs flex items-center justify-center font-bold shrink-0">
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
                    class="input-theme px-3 py-1.5 rounded-lg text-sm flex-1 font-medium text-white"
                  />
                  <button 
                    type="submit"
                    class="bg-[#10B981] text-[#070707] px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Save
                  </button>
                  <button 
                    type="button"
                    onclick={() => editingTeamId = null}
                    class="text-xs text-white/60 px-2 py-1 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              {:else}
                <span class="text-sm md:text-base font-medium text-white flex-1 truncate">
                  {team.name}
                </span>
                <button 
                  type="button"
                  onclick={() => startRename(team.id, team.name)}
                  class="text-xs bg-white/10 hover:bg-white/20 text-white font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
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
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            Share &amp; Export
          </h3>
          <p class="text-xs text-white/60">
            Share this live tournament with players on any device via a compressed URL link, or backup as JSON.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button 
            type="button" 
            onclick={onShareLink}
            class="btn-primary py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <span>Copy Shareable Link</span>
          </button>
          <button 
            type="button" 
            onclick={onExportJson}
            class="btn-secondary py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Export Backup JSON</span>
          </button>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="card-theme rounded-2xl p-5 md:p-6 border-[#EF4444]/30 space-y-4 bg-[#EF4444]/5">
        <div>
          <h3 class="text-lg font-bold text-[#EF4444] flex items-center gap-2">
            Danger Zone
          </h3>
          <p class="text-xs text-white/60">
            Deleting this tournament will permanently erase all recorded scores, fixtures, and standings from your storage.
          </p>
        </div>

        <button 
          type="button" 
          onclick={onDeleteTournament}
          class="bg-[#EF4444] hover:bg-[#DC2626] text-white py-3 px-6 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-lg shadow-[#EF4444]/20"
        >
          Permanently Delete Tournament
        </button>
      </div>
    </div>
  {/if}
</div>
