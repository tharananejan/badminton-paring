<script lang="ts">
  import type { TournamentState, Match, Round } from '../types/tournament';
  import { onMount } from 'svelte';

  let { 
    tournamentState, 
    onSelectMatch = () => {} 
  } = $props<{
    tournamentState: TournamentState;
    onSelectMatch: (match: Match) => void;
  }>();

  let zoomLevel = $state<number>(1);
  let activeRoundIndex = $state<number>(0);
  let scrollContainer = $state<HTMLDivElement | null>(null);
  let diagramCanvas = $state<HTMLDivElement | null>(null);
  let svgOverlay = $state<SVGSVGElement | null>(null);
  let pathLines = $state<Array<{ path: string; active: boolean }>>([]);

  // Separate rounds into Upper / Main Bracket vs Lower Bracket (filtering out BYE matches and BYE rounds)
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

  let allRounds = $derived([...upperRounds, ...lowerRounds]);

  function zoomIn() {
    zoomLevel = Math.min(zoomLevel + 0.15, 1.5);
  }

  function zoomOut() {
    zoomLevel = Math.max(zoomLevel - 0.15, 0.6);
  }

  function resetZoom() {
    zoomLevel = 1;
  }

  function scrollToRound(idx: number) {
    activeRoundIndex = idx;
    if (!scrollContainer) return;
    const colElement = scrollContainer.querySelector(`[data-round-index="${idx}"]`);
    if (colElement) {
      colElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  // Draw connecting SVG paths between round match cards
  function updateConnectingLines() {
    if (!diagramCanvas || !svgOverlay) return;

    const newPaths: Array<{ path: string; active: boolean }> = [];
    const containerRect = diagramCanvas.getBoundingClientRect();

    // Map match element positions by match ID
    const matchPositions = new Map<string, { rect: DOMRect; isCompleted: boolean }>();
    allRounds.forEach(r => {
      r.matches.forEach(m => {
        const el = diagramCanvas?.querySelector(`[data-match-id="${m.id}"]`);
        if (el) {
          matchPositions.set(m.id, {
            rect: el.getBoundingClientRect(),
            isCompleted: m.status === 'completed'
          });
        }
      });
    });

    // Helper to draw smooth step line between source right and target left
    const addLine = (srcId: string, dstId: string) => {
      const src = matchPositions.get(srcId);
      const dst = matchPositions.get(dstId);
      if (src && dst) {
        const x1 = (src.rect.right - containerRect.left) / zoomLevel;
        const y1 = (src.rect.top + src.rect.height / 2 - containerRect.top) / zoomLevel;

        const x2 = (dst.rect.left - containerRect.left) / zoomLevel;
        const y2 = (dst.rect.top + dst.rect.height / 2 - containerRect.top) / zoomLevel;

        const midX = x1 + (x2 - x1) / 2;

        const pathStr = `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
        newPaths.push({ path: pathStr, active: src.isCompleted });
      }
    };

    // 1. Connect Upper Rounds
    for (let rIdx = 0; rIdx < upperRounds.length - 1; rIdx++) {
      const currentRound = upperRounds[rIdx];
      const nextRound = upperRounds[rIdx + 1];

      currentRound.matches.forEach((currMatch, mIdx) => {
        let dstMatchId = currMatch.nextMatchId;
        
        // Find match in next round where winner (or team1/team2) is assigned
        if (!dstMatchId) {
          const winnerId = currMatch.winner?.id;
          if (winnerId) {
            const foundNext = nextRound.matches.find(m => m.team1?.id === winnerId || m.team2?.id === winnerId);
            if (foundNext) dstMatchId = foundNext.id;
          }
        }

        // Fallback to standard bracket index mapping if match not found yet
        if (!dstMatchId) {
          const nextMatchIdx = Math.floor(mIdx / 2);
          const nextMatch = nextRound.matches[nextMatchIdx];
          if (nextMatch) dstMatchId = nextMatch.id;
        }

        if (dstMatchId) {
          addLine(currMatch.id, dstMatchId);
        }
      });
    }

    // 2. Connect Lower Rounds
    for (let rIdx = 0; rIdx < lowerRounds.length - 1; rIdx++) {
      const currentRound = lowerRounds[rIdx];
      const nextRound = lowerRounds[rIdx + 1];

      currentRound.matches.forEach((currMatch, mIdx) => {
        let dstMatchId = currMatch.nextMatchId;
        if (!dstMatchId) {
          const winnerId = currMatch.winner?.id;
          if (winnerId) {
            const foundNext = nextRound.matches.find(m => m.team1?.id === winnerId || m.team2?.id === winnerId);
            if (foundNext) dstMatchId = foundNext.id;
          }
        }

        if (!dstMatchId) {
          const nextMatchIdx = Math.min(mIdx, nextRound.matches.length - 1);
          const nextMatch = nextRound.matches[nextMatchIdx];
          if (nextMatch) dstMatchId = nextMatch.id;
        }

        if (dstMatchId) {
          addLine(currMatch.id, dstMatchId);
        }
      });
    }

    pathLines = newPaths;
  }

  $effect(() => {
    // Explicitly read tournamentState and zoomLevel to register Svelte reactivity dependencies
    const _state = tournamentState;
    const _zoom = zoomLevel;

    // Immediately trigger line calculations and schedule a second frame to ensure DOM layout settles
    updateConnectingLines();
    const t1 = setTimeout(() => updateConnectingLines(), 60);
    const t2 = setTimeout(() => updateConnectingLines(), 250);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  });

  onMount(() => {
    const handleResize = () => updateConnectingLines();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });
</script>

<div class="space-y-4">
  <!-- Controls Bar: Quick-Jump Pills (Mobile friendly) + Zoom controls -->
  <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#e0e5ec] p-3 rounded-2xl border border-white/80 shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff]">
    
    <!-- Quick Jump Round Navigation Bar -->
    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1">
      <span class="text-[11px] font-bold uppercase text-slate-500 mr-1 shrink-0">Rounds:</span>
      {#each allRounds as round, idx (round.roundNumber + '-' + (round.bracket || 'main'))}
        <button
          type="button"
          onclick={() => scrollToRound(idx)}
          class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 {activeRoundIndex === idx ? 'bg-emerald-600 text-white shadow-[2px_2px_5px_#bebebe]' : 'bg-[#e0e5ec] text-slate-700 border border-white/80 shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff] hover:text-slate-900'}"
        >
          {round.name}
        </button>
      {/each}
    </div>

    <!-- Zoom Controls -->
    <div class="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-auto">
      <span class="text-xs font-bold text-slate-600 mr-1">{Math.round(zoomLevel * 100)}%</span>
      <button
        type="button"
        onclick={zoomOut}
        class="w-8 h-8 rounded-xl bg-[#e0e5ec] text-slate-700 font-bold text-base flex items-center justify-center border border-white/80 shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#bebebe] cursor-pointer"
        title="Zoom Out"
      >
        -
      </button>
      <button
        type="button"
        onclick={resetZoom}
        class="px-2.5 h-8 rounded-xl bg-[#e0e5ec] text-slate-700 font-bold text-xs flex items-center justify-center border border-white/80 shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#bebebe] cursor-pointer"
        title="Reset Zoom"
      >
        Reset
      </button>
      <button
        type="button"
        onclick={zoomIn}
        class="w-8 h-8 rounded-xl bg-[#e0e5ec] text-slate-700 font-bold text-base flex items-center justify-center border border-white/80 shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#bebebe] cursor-pointer"
        title="Zoom In"
      >
        +
      </button>
    </div>
  </div>

  <!-- Bracket Scroll Canvas Outer Container -->
  <div 
    bind:this={scrollContainer}
    class="w-full overflow-x-auto overflow-y-hidden rounded-2xl border border-slate-300 bg-[#e0e5ec]/60 p-4 sm:p-6 shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff] relative scroll-smooth touch-pan-x"
  >
    <!-- Scalable Canvas inner -->
    <div 
      bind:this={diagramCanvas}
      style="transform: scale({zoomLevel}); transform-origin: top left; transition: transform 0.15s ease-out;"
      class="inline-flex flex-col gap-10 min-w-max relative pb-6 pr-6"
    >
      <!-- SVG Overlay for Connecting Bracket Lines -->
      <svg 
        bind:this={svgOverlay}
        class="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
      >
        {#each pathLines as line}
          <path 
            d={line.path} 
            fill="none" 
            stroke={line.active ? '#10b981' : '#94a3b8'} 
            stroke-width={line.active ? '2.5' : '2'} 
            stroke-linecap="round"
            stroke-linejoin="round"
            class="transition-colors duration-300"
          />
        {/each}
      </svg>

      <!-- UPPER / MAIN BRACKET -->
      <div class="flex items-stretch gap-12 relative z-20">
        {#each upperRounds as round, rIdx (round.roundNumber + '-upper')}
          <div 
            data-round-index={rIdx}
            class="flex flex-col min-w-[240px] max-w-[260px] space-y-4"
          >
            <!-- Round Header Title -->
            <div class="text-center py-2 px-3 rounded-xl bg-[#e0e5ec] border border-white/80 shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff]">
              <h4 class="text-sm font-extrabold text-slate-800 tracking-tight">{round.name}</h4>
            </div>

            <!-- Matches Column with Equal Spacing -->
            <div class="flex-1 flex flex-col justify-around gap-6 py-2">
              {#each round.matches as match (match.id)}
                {@const isPlayable = match.status !== 'bye' && match.team1 !== undefined && match.team2 !== undefined}
                {@const team1Won = match.winner?.id === match.team1?.id && match.status === 'completed'}
                {@const team2Won = match.winner?.id === match.team2?.id && match.status === 'completed'}

                <div 
                  data-match-id={match.id}
                  class="space-y-1 my-auto"
                >
                  <button 
                    type="button"
                    disabled={!isPlayable}
                    onclick={() => isPlayable && onSelectMatch(match)}
                    class="w-full text-left rounded-xl overflow-hidden border border-white/90 bg-[#e0e5ec] shadow-[5px_5px_12px_#bebebe,-5px_-5px_12px_#ffffff] transition-all duration-200 {isPlayable ? 'hover:shadow-[7px_7px_16px_#b8b8b8,-7px_-7px_16px_#ffffff] cursor-pointer group active:scale-[0.98]' : 'opacity-85 cursor-default'}"
                  >
                    <!-- Team 1 Row -->
                    <div class="flex items-center justify-between border-b border-slate-200/90 {team1Won ? 'bg-emerald-500/20 font-bold' : 'bg-slate-500/5'}">
                      <div class="flex items-center gap-2 px-3 py-2 min-w-0 flex-1">
                        {#if team1Won}
                          <span class="w-1.5 h-3 bg-emerald-500 rounded-full shrink-0"></span>
                        {/if}
                        <span class="text-xs sm:text-sm font-semibold {team1Won ? 'text-emerald-700 font-extrabold' : 'text-slate-800'} truncate">
                          {match.team1 ? match.team1.name : '— Waiting —'}
                        </span>
                      </div>
                      <div class="px-2.5 py-2 bg-slate-200/60 border-l border-slate-200/90 text-center min-w-[36px] font-mono text-xs sm:text-sm font-bold {team1Won ? 'text-emerald-700 font-extrabold' : 'text-slate-700'}">
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
                    <div class="flex items-center justify-between {team2Won ? 'bg-emerald-500/20 font-bold' : 'bg-slate-500/5'}">
                      <div class="flex items-center gap-2 px-3 py-2 min-w-0 flex-1">
                        {#if team2Won}
                          <span class="w-1.5 h-3 bg-emerald-500 rounded-full shrink-0"></span>
                        {/if}
                        <span class="text-xs sm:text-sm font-semibold {team2Won ? 'text-emerald-700 font-extrabold' : 'text-slate-800'} truncate">
                          {match.team2 ? match.team2.name : '— Waiting —'}
                        </span>
                      </div>
                      <div class="px-2.5 py-2 bg-slate-200/60 border-l border-slate-200/90 text-center min-w-[36px] font-mono text-xs sm:text-sm font-bold {team2Won ? 'text-emerald-700 font-extrabold' : 'text-slate-700'}">
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

                  <!-- Card Footer Label -->
                  <div class="flex items-center justify-between px-1 text-[10px] text-slate-500 font-medium">
                    <span>Match #{match.matchNumber}</span>
                    {#if match.status === 'completed'}
                      <span class="text-emerald-600 font-bold">Finished</span>
                    {:else if isPlayable}
                      <span class="text-amber-600 font-bold">Tap to Score</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <!-- LOWER BRACKET (If Double Knockout) -->
      {#if lowerRounds.length > 0}
        <div class="pt-6 border-t-2 border-dashed border-slate-300 space-y-4">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/30 text-xs font-bold">
              Lower Bracket (Elimination Bracket)
            </span>
          </div>

          <div class="flex items-stretch gap-12 relative z-20">
            {#each lowerRounds as round, rIdx (round.roundNumber + '-lower')}
              <div 
                data-round-index={upperRounds.length + rIdx}
                class="flex flex-col min-w-[240px] max-w-[260px] space-y-4"
              >
                <!-- Round Header Title -->
                <div class="text-center py-2 px-3 rounded-xl bg-[#e0e5ec] border border-amber-300/60 shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff]">
                  <h4 class="text-sm font-extrabold text-amber-800 tracking-tight">{round.name}</h4>
                </div>

                <!-- Matches Column -->
                <div class="flex-1 flex flex-col justify-around gap-6 py-2">
                  {#each round.matches as match (match.id)}
                    {@const isPlayable = match.status !== 'bye' && match.team1 !== undefined && match.team2 !== undefined}
                    {@const team1Won = match.winner?.id === match.team1?.id && match.status === 'completed'}
                    {@const team2Won = match.winner?.id === match.team2?.id && match.status === 'completed'}

                    <div 
                      data-match-id={match.id}
                      class="space-y-1 my-auto"
                    >
                      <button 
                        type="button"
                        disabled={!isPlayable}
                        onclick={() => isPlayable && onSelectMatch(match)}
                        class="w-full text-left rounded-xl overflow-hidden border border-white/90 bg-[#e0e5ec] shadow-[5px_5px_12px_#bebebe,-5px_-5px_12px_#ffffff] transition-all duration-200 {isPlayable ? 'hover:shadow-[7px_7px_16px_#b8b8b8,-7px_-7px_16px_#ffffff] cursor-pointer group active:scale-[0.98]' : 'opacity-85 cursor-default'}"
                      >
                        <!-- Team 1 Row -->
                        <div class="flex items-center justify-between border-b border-slate-200/90 {team1Won ? 'bg-emerald-500/20 font-bold' : 'bg-slate-500/5'}">
                          <div class="flex items-center gap-2 px-3 py-2 min-w-0 flex-1">
                            {#if team1Won}
                              <span class="w-1.5 h-3 bg-emerald-500 rounded-full shrink-0"></span>
                            {/if}
                            <span class="text-xs sm:text-sm font-semibold {team1Won ? 'text-emerald-700 font-extrabold' : 'text-slate-800'} truncate">
                              {match.team1 ? match.team1.name : '— Waiting —'}
                            </span>
                          </div>
                          <div class="px-2.5 py-2 bg-slate-200/60 border-l border-slate-200/90 text-center min-w-[36px] font-mono text-xs sm:text-sm font-bold {team1Won ? 'text-emerald-700 font-extrabold' : 'text-slate-700'}">
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
                        <div class="flex items-center justify-between {team2Won ? 'bg-emerald-500/20 font-bold' : 'bg-slate-500/5'}">
                          <div class="flex items-center gap-2 px-3 py-2 min-w-0 flex-1">
                            {#if team2Won}
                              <span class="w-1.5 h-3 bg-emerald-500 rounded-full shrink-0"></span>
                            {/if}
                            <span class="text-xs sm:text-sm font-semibold {team2Won ? 'text-emerald-700 font-extrabold' : 'text-slate-800'} truncate">
                              {match.team2 ? match.team2.name : '— Waiting —'}
                            </span>
                          </div>
                          <div class="px-2.5 py-2 bg-slate-200/60 border-l border-slate-200/90 text-center min-w-[36px] font-mono text-xs sm:text-sm font-bold {team2Won ? 'text-emerald-700 font-extrabold' : 'text-slate-700'}">
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

                      <div class="flex items-center justify-between px-1 text-[10px] text-slate-500 font-medium">
                        <span>Match #{match.matchNumber}</span>
                        {#if match.status === 'completed'}
                          <span class="text-emerald-600 font-bold">Finished</span>
                        {:else if isPlayable}
                          <span class="text-amber-600 font-bold">Tap to Score</span>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
