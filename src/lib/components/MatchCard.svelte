<script lang="ts">
  import type { Match } from '../types/tournament';

  let { 
    match, 
    onSelectMatch = () => {} 
  } = $props<{
    match: Match;
    onSelectMatch?: (match: Match) => void;
  }>();

  let isPlayable = $derived(
    match.status !== 'bye' && match.team1 !== undefined && match.team2 !== undefined
  );

  let team1Won = $derived(match.winner?.id === match.team1?.id && match.status === 'completed');
  let team2Won = $derived(match.winner?.id === match.team2?.id && match.status === 'completed');
</script>

<div class="space-y-1.5 min-w-[220px] sm:min-w-[240px] max-w-full">
  <!-- Match Box (Neomorphism Light Style) -->
  <button 
    type="button"
    disabled={!isPlayable}
    onclick={() => isPlayable && onSelectMatch(match)}
    class="w-full text-left rounded-xl overflow-hidden border border-white/80 bg-[#e0e5ec] shadow-[6px_6px_14px_#bebebe,-6px_-6px_14px_#ffffff] transition-all duration-200 {isPlayable ? 'hover:shadow-[8px_8px_18px_#b8b8b8,-8px_-8px_18px_#ffffff] cursor-pointer group active:scale-[0.99]' : 'opacity-70 cursor-default'}"
  >
    <!-- Team 1 Row -->
    <div class="flex items-center justify-between border-b border-slate-200/80 {team1Won ? 'bg-emerald-500/15 font-bold' : 'bg-slate-500/5'}">
      <div class="flex items-center gap-2 px-3 py-2.5 min-w-0 flex-1">
        <span class="text-sm font-semibold {team1Won ? 'text-emerald-700 font-extrabold' : 'text-slate-800'} truncate">
          {match.team1 ? match.team1.name : '— Waiting —'}
        </span>
      </div>
      <div class="px-3 py-2.5 bg-slate-200/50 border-l border-slate-200/80 text-center min-w-[40px] font-mono text-sm font-bold {team1Won ? 'text-emerald-700 font-extrabold' : 'text-slate-700'}">
        {#if match.status === 'bye'}
          <span class="text-[10px] text-slate-400 uppercase">Bye</span>
        {:else if match.score}
          {match.score.team1Sets}
        {:else}
          -
        {/if}
      </div>
    </div>

    <!-- Team 2 Row -->
    <div class="flex items-center justify-between {team2Won ? 'bg-emerald-500/15 font-bold' : 'bg-slate-500/5'}">
      <div class="flex items-center gap-2 px-3 py-2.5 min-w-0 flex-1">
        <span class="text-sm font-semibold {team2Won ? 'text-emerald-700 font-extrabold' : 'text-slate-800'} truncate">
          {match.team2 ? match.team2.name : '— Waiting —'}
        </span>
      </div>
      <div class="px-3 py-2.5 bg-slate-200/50 border-l border-slate-200/80 text-center min-w-[40px] font-mono text-sm font-bold {team2Won ? 'text-emerald-700 font-extrabold' : 'text-slate-700'}">
        {#if match.status === 'bye'}
          <span class="text-[10px] text-slate-400 uppercase">Bye</span>
        {:else if match.score}
          {match.score.team2Sets}
        {:else}
          -
        {/if}
      </div>
    </div>
  </button>

  <!-- Match Status / Details Line below card -->
  <div class="flex items-center justify-between px-1 text-[11px] text-slate-500 font-medium">
    <div class="flex items-center gap-1.5 truncate">
      <span>Match #{match.matchNumber}</span>
      {#if match.score?.raw}
        <span>•</span>
        <span class="font-mono text-slate-700 font-semibold truncate">{match.score.raw}</span>
      {/if}
    </div>

    <div class="flex items-center gap-1 shrink-0">
      {#if match.status === 'completed'}
        <span class="inline-flex items-center gap-1 text-emerald-600 font-bold">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Done
        </span>
      {:else if match.status === 'bye'}
        <span class="text-slate-400 font-semibold">BYE</span>
      {:else if !isPlayable}
        <span class="text-slate-400 font-semibold">Pending</span>
      {:else}
        <span class="text-amber-600 font-bold flex items-center gap-1 group-hover:text-emerald-600">
          <span>Enter Score</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </span>
      {/if}
    </div>
  </div>
</div>
