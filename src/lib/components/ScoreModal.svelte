<script lang="ts">
  import type { Match } from '../types/tournament';

  let { 
    match, 
    onClose = () => {}, 
    onSave = () => {} 
  } = $props<{
    match: Match | null;
    onClose: () => void;
    onSave: (matchId: string, rawScore: string) => void;
  }>();

  let set1T1 = $state('21');
  let set1T2 = $state('15');
  let set2T1 = $state('21');
  let set2T2 = $state('18');
  let set3T1 = $state('');
  let set3T2 = $state('');
  let rawScoreInput = $state('');
  let useRaw = $state(false);
  let errorMsg = $state('');

  // Initialize with existing score if available
  $effect(() => {
    if (match && match.score) {
      rawScoreInput = match.score.raw;
      const sets = match.score.raw.split(',').map((s: string) => s.trim().split('-'));
      if (sets[0]) { set1T1 = sets[0][0] || ''; set1T2 = sets[0][1] || ''; }
      if (sets[1]) { set2T1 = sets[1][0] || ''; set2T2 = sets[1][1] || ''; }
      if (sets[2]) { set3T1 = sets[2][0] || ''; set3T2 = sets[2][1] || ''; }
    } else {
      set1T1 = '21'; set1T2 = '15';
      set2T1 = ''; set2T2 = '';
      set3T1 = ''; set3T2 = '';
      rawScoreInput = '';
    }
  });

  function handleSave(e: Event) {
    e.preventDefault();
    errorMsg = '';

    if (!match) return;

    let finalScoreString = '';
    if (useRaw) {
      finalScoreString = rawScoreInput.trim();
    } else {
      const sets: string[] = [];
      if (set1T1 && set1T2) sets.push(`${set1T1.trim()}-${set1T2.trim()}`);
      if (set2T1 && set2T2) sets.push(`${set2T1.trim()}-${set2T2.trim()}`);
      if (set3T1 && set3T2) sets.push(`${set3T1.trim()}-${set3T2.trim()}`);
      finalScoreString = sets.join(', ');
    }

    if (!finalScoreString) {
      errorMsg = 'Please enter a valid score (e.g., "21-15, 21-18").';
      return;
    }

    try {
      onSave(match.id, finalScoreString);
      onClose();
    } catch (err: any) {
      errorMsg = err.message || 'Failed to record score.';
    }
  }

  function quickWin(winner: 't1' | 't2') {
    if (winner === 't1') {
      set1T1 = '21'; set1T2 = '15';
      set2T1 = '21'; set2T2 = '18';
      set3T1 = ''; set3T2 = '';
    } else {
      set1T1 = '15'; set1T2 = '21';
      set2T1 = '18'; set2T2 = '21';
      set3T1 = ''; set3T2 = '';
    }
    useRaw = false;
  }
</script>

{#if match}
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
    <div class="card-theme w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto border-t sm:border border-white/20 shadow-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-[#10B981]">
            Round {match.roundNumber} • Match #{match.matchNumber}
          </span>
          <h3 class="text-lg font-bold text-white mt-0.5">
            Enter Match Score
          </h3>
        </div>
        <button 
          type="button"
          onclick={onClose}
          class="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      <!-- Matchup Header -->
      <div class="grid grid-cols-2 gap-3 text-center py-2 bg-black/30 rounded-xl p-3 border border-white/5">
        <div class="space-y-1">
          <span class="text-xs text-white/50 block uppercase font-semibold">Team 1</span>
          <span class="font-bold text-sm md:text-base text-white line-clamp-2">
            {match.team1?.name || 'Waiting...'}
          </span>
          <button 
            type="button"
            onclick={() => quickWin('t1')}
            class="text-[10px] bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] font-semibold px-2 py-1 rounded cursor-pointer border border-[#10B981]/30 mt-1"
          >
            Quick Win (2-0)
          </button>
        </div>
        <div class="space-y-1 border-l border-white/10 pl-3">
          <span class="text-xs text-white/50 block uppercase font-semibold">Team 2</span>
          <span class="font-bold text-sm md:text-base text-white line-clamp-2">
            {match.team2?.name || 'Waiting...'}
          </span>
          <button 
            type="button"
            onclick={() => quickWin('t2')}
            class="text-[10px] bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] font-semibold px-2 py-1 rounded cursor-pointer border border-[#10B981]/30 mt-1"
          >
            Quick Win (0-2)
          </button>
        </div>
      </div>

      {#if errorMsg}
        <div class="p-3 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] text-xs font-medium text-center">
          {errorMsg}
        </div>
      {/if}

      <!-- Form -->
      <form onsubmit={handleSave} class="space-y-4">
        <div class="flex items-center justify-between text-xs text-white/60">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" bind:checked={useRaw} class="rounded text-[#10B981] focus:ring-[#10B981]" />
            <span>Use raw text string (e.g. "21-19, 21-15")</span>
          </label>
        </div>

        {#if useRaw}
          <div class="space-y-2">
            <label for="raw-score-input" class="text-xs font-semibold uppercase tracking-wider text-white/70 block">
              Raw Score Text
            </label>
            <input 
              id="raw-score-input"
              type="text" 
              bind:value={rawScoreInput} 
              placeholder="e.g. 21-15, 19-21, 21-18" 
              class="input-theme w-full px-4 py-3 rounded-xl font-mono text-base"
            />
          </div>
        {:else}
          <div class="space-y-3">
            <div class="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-white/50 uppercase">
              <span>Set</span>
              <span class="truncate">{match.team1?.name}</span>
              <span class="truncate">{match.team2?.name}</span>
            </div>

            <!-- Set 1 -->
            <div class="grid grid-cols-3 gap-2 items-center">
              <span class="text-sm font-bold text-white/80 text-center">Set 1</span>
              <input type="number" bind:value={set1T1} placeholder="21" class="input-theme px-3 py-2 rounded-lg text-center font-mono font-bold text-base" />
              <input type="number" bind:value={set1T2} placeholder="15" class="input-theme px-3 py-2 rounded-lg text-center font-mono font-bold text-base" />
            </div>

            <!-- Set 2 -->
            <div class="grid grid-cols-3 gap-2 items-center">
              <span class="text-sm font-bold text-white/80 text-center">Set 2</span>
              <input type="number" bind:value={set2T1} placeholder="21" class="input-theme px-3 py-2 rounded-lg text-center font-mono font-bold text-base" />
              <input type="number" bind:value={set2T2} placeholder="18" class="input-theme px-3 py-2 rounded-lg text-center font-mono font-bold text-base" />
            </div>

            <!-- Set 3 (Optional) -->
            <div class="grid grid-cols-3 gap-2 items-center">
              <span class="text-xs font-normal text-white/50 text-center">Set 3 (Opt)</span>
              <input type="number" bind:value={set3T1} placeholder="—" class="input-theme px-3 py-2 rounded-lg text-center font-mono font-bold text-base text-white/70" />
              <input type="number" bind:value={set3T2} placeholder="—" class="input-theme px-3 py-2 rounded-lg text-center font-mono font-bold text-base text-white/70" />
            </div>
          </div>
        {/if}

        <div class="pt-4 border-t border-white/10 flex items-center gap-3">
          <button 
            type="button" 
            onclick={onClose}
            class="btn-secondary flex-1 py-3 rounded-xl font-semibold text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="btn-primary flex-1 py-3 rounded-xl font-bold text-sm cursor-pointer shadow-lg shadow-[#10B981]/20"
          >
            Save Score
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
