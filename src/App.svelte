<script lang="ts">
  import { onMount } from 'svelte';
  import type { TournamentState, TournamentType, Match } from './lib/types/tournament';
  import { TournamentManager } from './lib/engine/tournament-manager';
  import { 
    encodeStateToUrlHash, 
    decodeStateFromUrlHash, 
    loadStateFromLocalStorage, 
    getAllTournamentsFromLocalStorage, 
    deleteTournamentFromLocalStorage, 
    setActiveTournamentId,
    exportStateToJson 
  } from './lib/engine/state-serializer';

  import Navbar from './lib/components/Navbar.svelte';
  import Toast from './lib/components/Toast.svelte';
  import HomeView from './lib/components/HomeView.svelte';
  import TeamSetupView from './lib/components/TeamSetupView.svelte';
  import FormatSelectView from './lib/components/FormatSelectView.svelte';
  import TournamentView from './lib/components/TournamentView.svelte';
  import ScoreModal from './lib/components/ScoreModal.svelte';

  let view = $state<'home' | 'teams' | 'format' | 'tournament'>('home');
  let activeTournamentName = $state('');
  let tempTeams = $state<string[]>([]);
  let activeManager = $state<TournamentManager | null>(null);
  let activeState = $state<TournamentState | null>(null);
  let savedTournaments = $state<TournamentState[]>([]);
  let selectedMatch = $state<Match | null>(null);
  let toastMsg = $state('');
  let toastType = $state<'success' | 'info' | 'error'>('info');

  function showToast(msg: string, type: 'success' | 'info' | 'error' = 'info') {
    toastMsg = msg;
    toastType = type;
    setTimeout(() => {
      if (toastMsg === msg) toastMsg = '';
    }, 4000);
  }

  function refreshState() {
    if (activeManager) {
      // Create a clean shallow copy to trigger Svelte 5 reactivity
      activeState = { ...activeManager.getState() };
      savedTournaments = getAllTournamentsFromLocalStorage();
    } else {
      activeState = null;
      savedTournaments = getAllTournamentsFromLocalStorage();
    }
  }

  onMount(() => {
    savedTournaments = getAllTournamentsFromLocalStorage();

    // Check if URL hash contains shared tournament state
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const decoded = decodeStateFromUrlHash(hash);
      if (decoded) {
        activeManager = new TournamentManager(decoded);
        setActiveTournamentId(decoded.id);
        refreshState();
        view = 'tournament';
        showToast('Tournament loaded from shared link!', 'success');
      }
    } else {
      // Check if there is an active saved tournament in localStorage
      const lastActive = loadStateFromLocalStorage();
      if (lastActive) {
        activeManager = new TournamentManager(lastActive);
        refreshState();
        view = 'tournament';
      }
    }

    // Listen for URL hash changes (if user pastes a share link while app is open)
    const handleHashChange = () => {
      const newHash = window.location.hash;
      if (newHash && newHash.length > 1) {
        const decoded = decodeStateFromUrlHash(newHash);
        if (decoded) {
          activeManager = new TournamentManager(decoded);
          setActiveTournamentId(decoded.id);
          refreshState();
          view = 'tournament';
          showToast('Loaded shared tournament!', 'success');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  });

  // Navigation / Workflow handlers
  function handleHome() {
    selectedMatch = null;
    savedTournaments = getAllTournamentsFromLocalStorage();
    view = 'home';
  }

  function handleStartNew(name: string) {
    activeTournamentName = name;
    tempTeams = ['Team 1', 'Team 2', 'Team 3', 'Team 4'];
    view = 'teams';
  }

  function handleSelectTournament(id: string) {
    const tourney = savedTournaments.find(t => t.id === id);
    if (tourney) {
      activeManager = new TournamentManager(tourney);
      setActiveTournamentId(id);
      refreshState();
      view = 'tournament';
      showToast(`Resumed "${tourney.name}"`, 'info');
    }
  }

  function handleDeleteTournament(id: string) {
    const deleted = deleteTournamentFromLocalStorage(id);
    if (deleted) {
      if (activeState && activeState.id === id) {
        activeManager = null;
        activeState = null;
        setActiveTournamentId(null);
        view = 'home';
      }
      savedTournaments = getAllTournamentsFromLocalStorage();
      showToast('Tournament deleted.', 'info');
    }
  }

  function handleTeamsBack() {
    view = 'home';
  }

  function handleTeamsNext(teams: string[]) {
    tempTeams = teams;
    view = 'format';
  }

  function handleFormatBack() {
    view = 'teams';
  }

  function handleSelectFormat(formatType: TournamentType) {
    activeManager = TournamentManager.createTournament(activeTournamentName, formatType, tempTeams);
    setActiveTournamentId(activeManager.getState().id);
    refreshState();
    view = 'tournament';
    showToast('Tournament bracket generated!', 'success');
  }

  // Active tournament action handlers
  function handleSelectMatch(match: Match) {
    selectedMatch = match;
  }

  function handleSaveScore(matchId: string, rawScore: string) {
    if (!activeManager) return;
    activeManager.recordMatchScore(matchId, rawScore);
    refreshState();
    showToast('Match score recorded!', 'success');
  }

  function handleAdvanceRound() {
    if (!activeManager) return;
    const advanced = activeManager.advanceRound();
    refreshState();
    if (advanced) {
      showToast('Advanced to next round matchups!', 'success');
    } else {
      showToast('Tournament completed! All rounds finished.', 'success');
    }
  }

  function handleRenameTeam(teamId: string, newName: string) {
    if (!activeManager) return;
    const renamed = activeManager.renameTeam(teamId, newName);
    if (renamed) {
      refreshState();
      showToast(`Renamed participant to "${newName}"`, 'success');
    }
  }

  function handleShareLink() {
    if (!activeState) return;
    const hash = encodeStateToUrlHash(activeState);
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Shareable link copied to clipboard!', 'success');
      }).catch(() => {
        // Fallback
        window.location.hash = hash;
        showToast('URL updated with shareable link!', 'info');
      });
    } else {
      window.location.hash = hash;
      showToast('URL updated with shareable link!', 'info');
    }
  }

  function handleExportJson() {
    if (!activeState) return;
    const jsonStr = exportStateToJson(activeState);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(jsonStr).then(() => {
        showToast('Tournament JSON backup copied to clipboard!', 'success');
      });
    } else {
      showToast('Export failed: clipboard not available.', 'error');
    }
  }

  function handleDeleteCurrent() {
    if (!activeState) return;
    handleDeleteTournament(activeState.id);
  }
</script>

<div class="min-h-screen flex flex-col bg-[#070707] text-white selection:bg-[#10B981] selection:text-[#070707]">
  <Navbar 
    activeTournamentName={activeState ? activeState.name : ''}
    onHome={handleHome}
    onShare={handleShareLink}
    onDelete={handleDeleteCurrent}
    showTournamentActions={view === 'tournament' && activeState !== null}
  />

  <main class="flex-1">
    {#if view === 'home'}
      <HomeView 
        savedTournaments={savedTournaments}
        onStartNew={handleStartNew}
        onSelectTournament={handleSelectTournament}
        onDeleteTournament={handleDeleteTournament}
      />
    {:else if view === 'teams'}
      <TeamSetupView 
        tournamentName={activeTournamentName}
        initialTeams={tempTeams}
        onBack={handleTeamsBack}
        onNext={handleTeamsNext}
      />
    {:else if view === 'format'}
      <FormatSelectView 
        teamsCount={tempTeams.length}
        onBack={handleFormatBack}
        onSelectFormat={handleSelectFormat}
      />
    {:else if view === 'tournament' && activeState}
      <TournamentView 
        tournamentState={activeState}
        onSelectMatch={handleSelectMatch}
        onAdvanceRound={handleAdvanceRound}
        onRenameTeam={handleRenameTeam}
        onShareLink={handleShareLink}
        onExportJson={handleExportJson}
        onDeleteTournament={handleDeleteCurrent}
      />
    {/if}
  </main>

  <ScoreModal 
    match={selectedMatch}
    onClose={() => selectedMatch = null}
    onSave={handleSaveScore}
  />

  <Toast 
    message={toastMsg}
    type={toastType}
    onClose={() => toastMsg = ''}
  />
</div>
