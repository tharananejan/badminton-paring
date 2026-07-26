<script lang="ts">
  import type { TournamentType } from '../types/tournament';

  let { 
    teamsCount = 0, 
    onBack = () => {}, 
    onSelectFormat = () => {} 
  } = $props<{
    teamsCount: number;
    onBack: () => void;
    onSelectFormat: (format: TournamentType) => void;
  }>();

  const formats = [
    {
      id: 'round-robin' as TournamentType,
      title: 'Round Robin',
      description: 'Everyone plays with everyone, and the winner is determined by scores and standings.',
      icon: 'grid'
    },
    {
      id: 'knockout' as TournamentType,
      title: 'Single Elimination',
      description: 'Participants play one game each, and losers leave the tournament.',
      icon: 'single-bracket'
    },
    {
      id: 'double-knockout' as TournamentType,
      title: 'Double Elimination',
      description: "Something similar to single elimination, but there's a chance to get through to the finals via a lower bracket.",
      icon: 'double-bracket'
    },
    {
      id: 'swiss' as TournamentType,
      title: 'Swiss System',
      description: 'Players compete in several rounds, each time facing opponents with a similar win-loss record, and final rankings are based on total points.',
      icon: 'swiss-grid'
    }
  ];
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
      <span>Back to Team Setup ({teamsCount} teams)</span>
    </button>

    <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
      Choose tournament type:
    </h2>
    <p class="text-sm text-white/60">
      Select the pairing algorithm that best fits your schedule and competitive format.
    </p>
  </div>

  <!-- Format Cards List (Modeled after Reference Image 1) -->
  <div class="space-y-3.5 pt-2">
    {#each formats as format (format.id)}
      <button 
        type="button"
        onclick={() => onSelectFormat(format.id)}
        class="card-theme w-full rounded-2xl p-5 md:p-6 text-left flex items-center justify-between gap-4 group cursor-pointer hover:border-[#10B981]/50 hover:bg-[#26413C]/90 active:scale-[0.99] transition-all"
      >
        <div class="flex items-center gap-4 md:gap-5 min-w-0">
          <!-- Icon / Diagram illustration -->
          <div class="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-black/40 border border-white/10 group-hover:border-[#10B981]/40 flex items-center justify-center shrink-0 text-[#10B981] shadow-inner transition-colors">
            {#if format.icon === 'grid'}
              <!-- Round Robin Grid Icon -->
              <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3h4v4H3V3zm6 0h4v4H9V3zm6 0h4v4h-4V3zM3 9h4v4H3V9zm6 0h4v4H9V9zm6 0h4v4h-4V9zM3 15h4v4H3v-4zm6 0h4v4H9v-4zm6 0h4v4h-4v-4z" opacity="0.8"/>
              </svg>
            {:else if format.icon === 'single-bracket'}
              <!-- Single Elimination Bracket Icon -->
              <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h4v8H4M8 8h6m-6 12h4v-8H4M14 8v8m0-4h6"/>
              </svg>
            {:else if format.icon === 'double-bracket'}
              <!-- Double Elimination Icon -->
              <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 3h3v6H3M6 6h4m-4 12h3v-6H3M9 6v12m0-6h5M14 4h3v8h-3M17 8h4"/>
              </svg>
            {:else}
              <!-- Swiss System Icon -->
              <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
                <path d="M10 6h4M6 10v4M18 10v4M10 18h4" stroke-dasharray="2 2" stroke-width="1.5" opacity="0.7"/>
              </svg>
            {/if}
          </div>

          <!-- Text Details -->
          <div class="space-y-1 min-w-0">
            <h3 class="text-lg md:text-xl font-bold text-white group-hover:text-[#10B981] transition-colors">
              {format.title}
            </h3>
            <p class="text-xs md:text-sm text-white/60 leading-relaxed font-normal">
              {format.description}
            </p>
          </div>
        </div>

        <!-- Right Arrow (Reference Image 1 >) -->
        <div class="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#10B981] text-white/50 group-hover:text-[#070707] flex items-center justify-center shrink-0 font-bold transition-all group-hover:translate-x-1">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    {/each}
  </div>
</div>
