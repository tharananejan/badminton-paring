<script lang="ts">
  import type { TournamentState } from '../types/tournament';

  let { 
    savedTournaments = [], 
    onStartNew = () => {}, 
    onSelectTournament = () => {}, 
    onDeleteTournament = () => {} 
  } = $props<{
    savedTournaments: TournamentState[];
    onStartNew: (name: string) => void;
    onSelectTournament: (id: string) => void;
    onDeleteTournament: (id: string) => void;
  }>();

  let tournamentName = $state('');

  function handleCreate(e: Event) {
    e.preventDefault();
    const name = tournamentName.trim() || 'Badminton Championship';
    onStartNew(name);
  }

  function formatTypeLabel(type: string): string {
    switch (type) {
      case 'knockout': return 'Single Elimination';
      case 'double-knockout': return 'Double Elimination';
      case 'round-robin': return 'Round Robin';
      case 'swiss': return 'Swiss System';
      default: return type;
    }
  }

  function formatDate(ts: number): string {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
  <!-- Hero Section -->
  <div class="text-center space-y-3 pt-2 pb-4">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#26413C] border border-white/10 text-xs font-semibold text-[#10B981]">
      <span>Lightweight &amp; Client-Side</span>
    </div>
    <h2 class="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
      Tournament Pairing Engine
    </h2>
    <p class="text-sm md:text-base text-white/70 max-w-lg mx-auto leading-relaxed">
      Create tournament brackets instantly. No login required, works offline, and shares effortlessly across devices.
    </p>
  </div>

  <!-- Create Tournament Box -->
  <div class="card-theme rounded-2xl p-6 md:p-8 relative overflow-hidden">
    <div class="absolute top-0 right-0 w-48 h-48 bg-[#10B981]/5 rounded-full blur-3xl -z-0"></div>
    
    <div class="relative z-10 space-y-6">
      <div>
        <h3 class="text-xl font-bold text-white flex items-center gap-2">
          Start New Tournament
        </h3>
        <p class="text-sm text-white/60 mt-1">
          Enter your tournament name to begin adding teams and generating brackets.
        </p>
      </div>

      <form onsubmit={handleCreate} class="flex flex-col sm:flex-row gap-3">
        <input 
          type="text" 
          bind:value={tournamentName}
          placeholder="e.g. Summer Open 2026"
          class="input-theme flex-1 px-4 py-3.5 rounded-xl text-base font-medium placeholder:text-white/30"
        />
        <button 
          type="submit"
          class="btn-primary px-6 py-3.5 rounded-xl text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#10B981]/20"
        >
          <span>Add Teams</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </form>
    </div>
  </div>

  <!-- Existing Tournaments Section -->
  <div class="space-y-4 pt-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg md:text-xl font-bold text-white flex items-center gap-2">
        Saved Tournaments
        {#if savedTournaments.length > 0}
          <span class="text-xs bg-[#26413C] px-2.5 py-0.5 rounded-full border border-white/10 text-white/80">
            {savedTournaments.length}
          </span>
        {/if}
      </h3>
    </div>

    {#if savedTournaments.length === 0}
      <div class="card-theme rounded-2xl p-8 text-center border-dashed border-white/20">
        <p class="text-base font-semibold text-white/80">No existing tournaments found</p>
        <p class="text-xs text-white/50 mt-1 max-w-sm mx-auto">
          When you create a tournament, it will automatically save here so you can resume or manage it anytime.
        </p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each savedTournaments as tourney (tourney.id)}
          <div class="card-theme rounded-xl p-5 flex flex-col justify-between gap-4 relative group hover:border-[#10B981]/40">
            <div class="space-y-2">
              <div class="flex items-start justify-between gap-2">
                <span class="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-[#10B981] border border-[#10B981]/20">
                  {formatTypeLabel(tourney.type)}
                </span>
                <span class="text-[11px] text-white/50">
                  {formatDate(tourney.updatedAt)}
                </span>
              </div>
              <h4 class="font-bold text-lg text-white group-hover:text-[#10B981] transition-colors line-clamp-1">
                {tourney.name}
              </h4>
              <div class="flex items-center gap-3 text-xs text-white/60">
                <span class="flex items-center gap-1">
                  <strong class="text-white font-semibold">{tourney.teams?.length || 0}</strong> teams
                </span>
                <span>•</span>
                <span class="flex items-center gap-1">
                  {#if tourney.status === 'completed'}
                    <span class="w-2 h-2 rounded-full bg-[#10B981]"></span>
                    <span class="text-[#10B981] font-semibold">Completed</span>
                  {:else}
                    <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <span class="text-amber-400 font-semibold">In Progress</span>
                  {/if}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2 border-t border-white/10">
              <button 
                type="button"
                onclick={() => onSelectTournament(tourney.id)}
                class="btn-primary flex-1 py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Resume</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button 
                type="button"
                onclick={(e) => { e.stopPropagation(); onDeleteTournament(tourney.id); }}
                title="Delete Tournament"
                class="p-2 rounded-lg bg-black/30 hover:bg-[#EF4444]/20 text-white/60 hover:text-[#EF4444] border border-white/10 hover:border-[#EF4444]/40 transition-all cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
