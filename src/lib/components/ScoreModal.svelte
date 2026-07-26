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
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
    <div class="card-theme w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto border-t sm:border border-white/80 shadow-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Round {match.roundNumber} • Match #{match.matchNumber}
          </span>
          <h3 class="text-lg font-bold text-slate-800 mt-0.5">
            Enter Match Score
          </h3>
        </div>
        <button 
          type="button"
          onclick={onClose}
          class="p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      <!-- Matchup Header -->
      <div class="grid grid-cols-2 gap-3 text-center py-2 bg-[#e0e5ec] rounded-xl p-3 border border-white/80 shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff]">
        <div class="space-y-1">
          <span class="text-xs text-slate-500 block uppercase font-bold">Team 1</span>
          <span class="font-bold text-sm md:text-base text-slate-800 line-clamp-2">
            {match.team1?.name || 'Waiting...'}
          </span>
          <button 
            type="button"
            onclick={() => quickWin('t1')}
            class="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 font-bold px-2 py-1 rounded cursor-pointer border border-emerald-500/30 mt-1"
          >
            Quick Win (2-0)
          </button>
        </div>
        <div class="space-y-1 border-l border-slate-300 pl-3">
          <span class="text-xs text-slate-500 block uppercase font-bold">Team 2</span>
          <span class="font-bold text-sm md:text-base text-slate-800 line-clamp-2">
            {match.team2?.name || 'Waiting...'}
          </span>
          <button 
            type="button"
            onclick={() => quickWin('t2')}
            class="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 font-bold px-2 py-1 rounded cursor-pointer border border-emerald-500/30 mt-1"
          >
            Quick Win (0-2)
          </button>
        </div>
      </div>

      {#if errorMsg}
        <div class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 text-xs font-bold text-center">
          {errorMsg}
        </div>
      {/if}

      <!-- Form -->
      <form onsubmit={handleSave} class="space-y-4">
        <div class="flex items-center justify-between text-xs text-slate-600 font-medium">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" bind:checked={useRaw} class="rounded text-emerald-600 focus:ring-emerald-500" />
            <span>Use raw text string (e.g. "21-19, 21-15")</span>
          </label>
        </div>

        {#if useRaw}
          <div class="space-y-2">
            <label for="raw-score-input" class="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              Raw Score Text
            </label>
            <input 
              id="raw-score-input"
              type="text" 
              bind:value={rawScoreInput} 
              placeholder="e.g. 21-15, 19-21, 21-18" 
              class="input-theme w-full px-4 py-3 rounded-xl font-mono text-base font-semibold text-slate-800"
            />
          </div>
        {:else}
          <div class="space-y-3">
            <div class="grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-500 uppercase">
              <span>Set</span>
              <span class="truncate">{match.team1?.name}</span>
              <span class="truncate">{match.team2?.name}</span>
            </div>

            <!-- Set 1 -->
            <div class="grid grid-cols-3 gap-2 items-center">
              <span class="text-sm font-bold text-slate-700 text-center">Set 1</span>
              <input type="number" bind:value={set1T1} placeholder="21" class="input-theme px-3 py-2 rounded-lg text-center font-mono font-bold text-base text-slate-800" />
              <input type="number" bind:value={set1T2} placeholder="15" class="input-theme px-3 py-2 rounded-lg text-center font-mono font-bold text-base text-slate-800" />
            </div>

            <!-- Set 2 -->
            <div class="grid grid-cols-3 gap-2 items-center">
              <span class="text-sm font-bold text-slate-700 text-center">Set 2</span>
              <input type="number" bind:value={set2T1} placeholder="21" class="input-theme px-3 py-2 rounded-lg text-center font-mono font-bold text-base text-slate-800" />
              <input type="number" bind:value={set2T2} placeholder="18" class="input-theme px-3 py-2 rounded-lg text-center font-mono font-bold text-base text-slate-800" />
            </div>

            <!-- Set 3 (Optional) -->
            <div class="grid grid-cols-3 gap-2 items-center">
              <span class="text-xs font-medium text-slate-500 text-center">Set 3 (Opt)</span>
              <input type="number" bind:value={set3T1} placeholder="—" class="input-theme px-3 py-2 rounded-lg text-center font-mono font-bold text-base text-slate-800" />
              <input type="number" bind:value={set3T2} placeholder="—" class="input-theme px-3 py-2 rounded-lg text-center font-mono font-bold text-base text-slate-800" />
            </div>
          </div>
        {/if}

        <div class="pt-4 border-t border-slate-200 flex items-center gap-3">
          <button 
            type="button" 
            onclick={onClose}
            class="btn-secondary flex-1 py-3 rounded-xl font-bold text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="btn-primary flex-1 py-3 rounded-xl font-bold text-sm cursor-pointer"
          >
            Save Score
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
