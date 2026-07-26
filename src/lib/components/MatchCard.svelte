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
  <!-- Match Box (Modeled after Reference Image 3) -->
  <button 
    type="button"
    disabled={!isPlayable}
    onclick={() => isPlayable && onSelectMatch(match)}
    class="w-full text-left rounded-xl overflow-hidden border border-white/15 bg-[#26413C] shadow-md transition-all duration-200 {isPlayable ? 'hover:border-[#10B981]/60 hover:shadow-lg hover:shadow-black/50 cursor-pointer group active:scale-[0.99]' : 'opacity-70 cursor-default'}"
  >
    <!-- Team 1 Row -->
    <div class="flex items-center justify-between border-b border-white/10 {team1Won ? 'bg-[#10B981]/20 font-bold' : 'bg-black/20'}">
      <div class="flex items-center gap-2 px-3 py-2.5 min-w-0 flex-1">
        <span class="text-sm font-semibold {team1Won ? 'text-[#10B981]' : 'text-white'} truncate">
          {match.team1 ? match.team1.name : '— Waiting —'}
        </span>
      </div>
      <div class="px-3 py-2.5 bg-black/40 border-l border-white/10 text-center min-w-[40px] font-mono text-sm font-bold {team1Won ? 'text-[#10B981]' : 'text-white/80'}">
        {#if match.status === 'bye'}
          <span class="text-[10px] text-white/40 uppercase">Bye</span>
        {:else if match.score}
          {match.score.team1Sets}
        {:else}
          -
        {/if}
      </div>
    </div>

    <!-- Team 2 Row -->
    <div class="flex items-center justify-between {team2Won ? 'bg-[#10B981]/20 font-bold' : 'bg-black/20'}">
      <div class="flex items-center gap-2 px-3 py-2.5 min-w-0 flex-1">
        <span class="text-sm font-semibold {team2Won ? 'text-[#10B981]' : 'text-white'} truncate">
          {match.team2 ? match.team2.name : (match.status === 'bye' ? '(BYE)' : '— Waiting —')}
        </span>
      </div>
      <div class="px-3 py-2.5 bg-black/40 border-l border-white/10 text-center min-w-[40px] font-mono text-sm font-bold {team2Won ? 'text-[#10B981]' : 'text-white/80'}">
        {#if match.status === 'bye'}
          <span class="text-[10px] text-white/40 uppercase">Bye</span>
        {:else if match.score}
          {match.score.team2Sets}
        {:else}
          -
        {/if}
      </div>
    </div>
  </button>

  <!-- Match Status / Details Line below card (Modeled after Reference Image 3) -->
  <div class="flex items-center justify-between px-1 text-[11px] text-white/50">
    <div class="flex items-center gap-1.5 truncate">
      <span>Match #{match.matchNumber}</span>
      {#if match.score?.raw}
        <span>•</span>
        <span class="font-mono text-white/80 truncate">{match.score.raw}</span>
      {/if}
    </div>

    <div class="flex items-center gap-1 shrink-0">
      {#if match.status === 'completed'}
        <span class="inline-flex items-center gap-1 text-[#10B981] font-semibold">
          <span class="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
          Done
        </span>
      {:else if match.status === 'bye'}
        <span class="text-white/40">BYE</span>
      {:else if !isPlayable}
        <span class="text-white/40">Pending</span>
      {:else}
        <span class="text-amber-400 font-medium flex items-center gap-1 group-hover:text-[#10B981]">
          <span>Enter Score</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </span>
      {/if}
    </div>
  </div>
</div>
