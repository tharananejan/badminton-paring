<script lang="ts">
  let { 
    tournamentName = '', 
    initialTeams = [], 
    onBack = () => {}, 
    onNext = () => {} 
  } = $props<{
    tournamentName: string;
    initialTeams?: string[];
    onBack: () => void;
    onNext: (teams: string[]) => void;
  }>();

  let teams = $state<string[]>(['Team 1', 'Team 2', 'Team 3']);
  let newTeamInput = $state('');
  let editingIdx = $state<number | null>(null);
  let editText = $state('');

  $effect(() => {
    if (initialTeams && initialTeams.length > 0) {
      teams = [...initialTeams];
    }
  });

  function handleAdd(e?: Event) {
    if (e) e.preventDefault();
    const trimmed = newTeamInput.trim();
    if (trimmed) {
      teams = [...teams, trimmed];
      newTeamInput = '';
    }
  }

  function handleRemove(idx: number) {
    teams = teams.filter((_, i) => i !== idx);
    if (editingIdx === idx) editingIdx = null;
  }

  function startEdit(idx: number, name: string) {
    editingIdx = idx;
    editText = name;
  }

  function saveEdit(idx: number) {
    const trimmed = editText.trim();
    if (trimmed) {
      teams[idx] = trimmed;
      teams = [...teams];
    }
    editingIdx = null;
  }

  function populateSamples() {
    teams = [
      'Smashers Pro',
      'Racket Kings',
      'Feather Shuttles',
      'Court Masters',
      'Net Ninjas',
      'Smash Bros',
      'Ace Aviators',
      'Drop Shot Divas'
    ];
  }

  let canProceed = $derived(teams.length >= 3);
</script>

<div class="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
  <!-- Header -->
  <div class="space-y-2">
    <button 
      type="button" 
      onclick={onBack}
      class="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer mb-2"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      <span>Back to Tournament Name</span>
    </button>
    <div class="flex items-center justify-between gap-4">
      <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
        Team names
      </h2>
      <button 
        type="button"
        onclick={populateSamples}
        class="text-xs bg-white/10 hover:bg-white/20 text-[#10B981] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-[#10B981]/30 flex items-center gap-1"
      >
        <span>Quick Fill 8 Teams</span>
      </button>
    </div>
    <p class="text-sm text-white/60">
      Adding participants for <strong class="text-white font-medium">{tournamentName || 'Badminton Tournament'}</strong>
    </p>
  </div>

  <!-- Add Team Input Bar -->
  <form onsubmit={handleAdd} class="flex gap-2">
    <input 
      type="text"
      bind:value={newTeamInput}
      placeholder="Type team or player name..."
      class="input-theme flex-1 px-4 py-3 rounded-xl text-base font-medium placeholder:text-white/30"
    />
    <button 
      type="submit"
      class="btn-primary px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-1 cursor-pointer"
    >
      <span>+ Add</span>
    </button>
  </form>

  <!-- Team List Box (Modeled after Reference Image 2) -->
  <div class="card-theme rounded-2xl p-5 md:p-6 space-y-4">
    <div class="flex items-center justify-between border-b border-white/10 pb-3">
      <span class="text-xs font-bold uppercase tracking-wider text-white/50">
        Participants List ({teams.length})
      </span>
      <span class="text-xs font-medium {canProceed ? 'text-[#10B981]' : 'text-amber-400'}">
        {canProceed ? '✓ Minimum requirement met' : `Add ${3 - teams.length} more to proceed`}
      </span>
    </div>

    <div class="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {#each teams as team, idx (idx)}
        <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/20 transition-all group">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <span class="w-6 h-6 rounded-full bg-[#26413C] text-white/70 font-mono text-xs flex items-center justify-center font-bold shrink-0">
              {idx + 1}
            </span>

            {#if editingIdx === idx}
              <form 
                onsubmit={(e) => { e.preventDefault(); saveEdit(idx); }} 
                class="flex items-center gap-2 flex-1"
              >
                <input 
                  type="text" 
                  bind:value={editText}
                  class="input-theme px-3 py-1 rounded-lg text-sm flex-1 font-medium text-white"
                />
                <button 
                  type="submit"
                  class="bg-[#10B981] text-[#070707] px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Save
                </button>
              </form>
            {:else}
              <button 
                type="button"
                onclick={() => startEdit(idx, team)}
                class="text-base font-medium text-white truncate cursor-pointer hover:text-[#10B981] transition-colors flex-1 text-left bg-transparent border-0 p-0"
                title="Click to rename"
              >
                {team}
              </button>
            {/if}
          </div>

          <div class="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            {#if editingIdx !== idx}
              <button 
                type="button" 
                onclick={() => startEdit(idx, team)}
                title="Rename team"
                class="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            {/if}

            <button 
              type="button" 
              onclick={() => handleRemove(idx)}
              title="Remove team"
              class="p-1.5 rounded-lg hover:bg-[#EF4444]/20 text-white/60 hover:text-[#EF4444] transition-colors cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>

    <div class="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/50 italic">
      <span>Press ↵ or click Add to append</span>
      <span>Click any name to rename</span>
    </div>
  </div>

  <p class="text-xs text-white/60 text-center max-w-md mx-auto leading-relaxed">
    Minimum 3 participants required. You can rename, add, or remove teams at any point later during the tournament.
  </p>

  <!-- Action Bar -->
  <div class="pt-4 flex items-center justify-end gap-3">
    <button 
      type="button"
      onclick={onBack}
      class="btn-secondary px-5 py-3.5 rounded-xl text-sm font-semibold cursor-pointer"
    >
      Cancel
    </button>
    <button 
      type="button"
      disabled={!canProceed}
      onclick={() => onNext(teams)}
      class="btn-primary px-8 py-3.5 rounded-xl text-base font-bold flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none shadow-lg {canProceed ? 'shadow-[#10B981]/20' : ''}"
    >
      <span>Choose Format</span>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </button>
  </div>
</div>
