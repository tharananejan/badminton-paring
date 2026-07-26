import LZString from 'lz-string';
import type { TournamentState } from '../types/tournament';

const STORAGE_KEY = 'badminton_tournament_state';
const TOURNAMENTS_MAP_KEY = 'badminton_tournaments_map';
const ACTIVE_ID_KEY = 'badminton_active_tournament_id';

/**
 * Serializes tournament state to a compressed URL hash string using lz-string.
 * Safe for sharing links across devices.
 */
export function encodeStateToUrlHash(state: TournamentState): string {
  const jsonString = JSON.stringify(state);
  return LZString.compressToEncodedURIComponent(jsonString);
}

/**
 * Deserializes tournament state from a compressed URL hash string.
 */
export function decodeStateFromUrlHash(hash: string): TournamentState | null {
  try {
    const cleanHash = hash.replace(/^#/, '');
    if (!cleanHash) return null;
    const jsonString = LZString.decompressFromEncodedURIComponent(cleanHash);
    if (!jsonString) return null;
    return JSON.parse(jsonString) as TournamentState;
  } catch (error) {
    console.error('Failed to decode tournament state from URL hash:', error);
    return null;
  }
}

/**
 * Save tournament state to browser localStorage (both legacy key and multi-tournament map).
 */
export function saveStateToLocalStorage(state: TournamentState): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    // Legacy single state
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    // Multi-tournament map
    const map = getTournamentsMap();
    map[state.id] = state;
    window.localStorage.setItem(TOURNAMENTS_MAP_KEY, JSON.stringify(map));
    window.localStorage.setItem(ACTIVE_ID_KEY, state.id);
    return true;
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
    return false;
  }
}

/**
 * Load active tournament state from browser localStorage.
 */
export function loadStateFromLocalStorage(): TournamentState | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const activeId = window.localStorage.getItem(ACTIVE_ID_KEY);
    if (activeId) {
      const map = getTournamentsMap();
      if (map[activeId]) {
        return map[activeId];
      }
    }
    const data = window.localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as TournamentState;
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return null;
  }
}

/**
 * Clear legacy single tournament state from browser localStorage.
 */
export function clearLocalStorageState(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Helper to retrieve the raw map of tournaments.
 */
function getTournamentsMap(): Record<string, TournamentState> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const data = window.localStorage.getItem(TOURNAMENTS_MAP_KEY);
    if (!data) return {};
    return JSON.parse(data) as Record<string, TournamentState>;
  } catch {
    return {};
  }
}

/**
 * Get all saved tournaments sorted by updatedAt descending.
 */
export function getAllTournamentsFromLocalStorage(): TournamentState[] {
  const map = getTournamentsMap();
  const list = Object.values(map);
  // Also check if there's a legacy tournament not in the map
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const legacy = window.localStorage.getItem(STORAGE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy) as TournamentState;
        if (parsed.id && !map[parsed.id]) {
          list.push(parsed);
          map[parsed.id] = parsed;
          window.localStorage.setItem(TOURNAMENTS_MAP_KEY, JSON.stringify(map));
        }
      }
    } catch {
      // ignore
    }
  }
  return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

/**
 * Delete a specific tournament from localStorage by ID.
 */
export function deleteTournamentFromLocalStorage(id: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const map = getTournamentsMap();
    delete map[id];
    window.localStorage.setItem(TOURNAMENTS_MAP_KEY, JSON.stringify(map));
    
    if (window.localStorage.getItem(ACTIVE_ID_KEY) === id) {
      window.localStorage.removeItem(ACTIVE_ID_KEY);
      window.localStorage.removeItem(STORAGE_KEY);
    }
    return true;
  } catch (error) {
    console.error('Failed to delete tournament from localStorage:', error);
    return false;
  }
}

/**
 * Get active tournament ID from localStorage.
 */
export function getActiveTournamentId(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage.getItem(ACTIVE_ID_KEY);
}

/**
 * Set active tournament ID in localStorage.
 */
export function setActiveTournamentId(id: string | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (id === null) {
    window.localStorage.removeItem(ACTIVE_ID_KEY);
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(ACTIVE_ID_KEY, id);
    const map = getTournamentsMap();
    if (map[id]) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map[id]));
    }
  }
}

/**
 * Export tournament state as a formatted JSON string for backup/file download.
 */
export function exportStateToJson(state: TournamentState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * Import tournament state from a JSON string.
 */
export function importStateFromJson(json: string): TournamentState | null {
  try {
    const state = JSON.parse(json) as TournamentState;
    if (!state.id || !state.type || !Array.isArray(state.teams)) {
      throw new Error('Invalid tournament state structure.');
    }
    return state;
  } catch (error) {
    console.error('Failed to import state from JSON:', error);
    return null;
  }
}
