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
    type === 'success' ? 'bg-[#10B981] text-[#070707]' :
    type === 'error' ? 'bg-[#EF4444] text-white' :
    'bg-[#26413C] text-white border border-white/20'
  );
</script>

{#if message}
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
    <div class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl font-medium text-sm {bgClass} min-w-[240px] max-w-[90vw] justify-between">
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
