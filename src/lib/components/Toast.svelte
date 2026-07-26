<script lang="ts">
  let { 
    message = '', 
    type = 'info',
    onClose = () => {} 
  } = $props<{
    message: string;
    type?: 'success' | 'info' | 'error';
    onClose?: () => void;
  }>();

  let bgClass = $derived(
    type === 'success' ? 'bg-emerald-600 text-white shadow-[4px_4px_10px_#bebebe]' :
    type === 'error' ? 'bg-rose-600 text-white shadow-[4px_4px_10px_#bebebe]' :
    'bg-[#e0e5ec] text-slate-800 border border-white/80 shadow-[6px_6px_14px_#bebebe,-6px_-6px_14px_#ffffff]'
  );
</script>

{#if message}
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
    <div class="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm {bgClass} min-w-[240px] max-w-[90vw] justify-between">
      <span>{message}</span>
      <button 
        type="button" 
        onclick={onClose} 
        class="opacity-70 hover:opacity-100 font-bold ml-2 focus:outline-none cursor-pointer"
      >
        ✕
      </button>
    </div>
  </div>
{/if}
