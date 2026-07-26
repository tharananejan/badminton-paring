<script lang="ts">
  let { 
    activeTournamentName = '', 
    onHome = () => {}, 
    onShare = () => {}, 
    onDelete = () => {},
    showTournamentActions = false 
  } = $props<{
    activeTournamentName?: string;
    onHome?: () => void;
    onShare?: () => void;
    onDelete?: () => void;
    showTournamentActions?: boolean;
  }>();
</script>

<header class="sticky top-0 z-40 bg-[#e0e5ec]/90 backdrop-blur-md border-b border-white/60 px-4 py-3 shadow-[0_4px_10px_#bebebe]">
  <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
    <div></div>

    {#if activeTournamentName}
      <div class="hidden sm:flex items-center gap-2 bg-[#e0e5ec] px-3.5 py-1.5 rounded-full border border-white/80 shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff] max-w-[200px] md:max-w-[300px]">
        <span class="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
        <span class="text-xs font-semibold text-slate-800 truncate">{activeTournamentName}</span>
      </div>
    {/if}

    <div class="flex items-center gap-2.5">
      {#if showTournamentActions}
        <button 
          type="button" 
          onclick={onShare}
          title="Share Tournament Link"
          class="p-2 rounded-xl bg-[#e0e5ec] hover:bg-[#e6ebf2] border border-white/80 text-slate-700 hover:text-[#10B981] shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span class="hidden md:inline">Share</span>
        </button>

        <button 
          type="button" 
          onclick={onDelete}
          title="Delete Tournament"
          class="p-2 rounded-xl bg-[#e0e5ec] hover:bg-rose-50 border border-white/80 text-slate-700 hover:text-[#EF4444] shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span class="hidden md:inline">Delete</span>
        </button>
      {/if}

      <button 
        type="button" 
        onclick={onHome}
        title="All Tournaments"
        class="p-2 rounded-xl bg-[#e0e5ec] hover:bg-[#e6ebf2] border border-white/80 text-slate-700 hover:text-slate-900 shadow-[4px_4px_8px_#bebebe,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#bebebe,inset_-2px_-2px_4px_#ffffff] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span class="hidden md:inline">Tournaments</span>
      </button>
    </div>
  </div>
  {#if activeTournamentName}
    <div class="sm:hidden mt-2 pt-2 border-t border-slate-300 flex items-center justify-between">
      <div class="flex items-center gap-2 overflow-hidden">
        <span class="w-2 h-2 rounded-full bg-[#10B981] shrink-0 animate-pulse"></span>
        <span class="text-xs font-semibold text-slate-800 truncate">{activeTournamentName}</span>
      </div>
    </div>
  {/if}
</header>
