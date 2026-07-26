import type { PairingAlgorithm } from './interface';
import type { TournamentType } from '../types/tournament';
import { KnockoutAlgorithm } from './knockout';
import { DoubleKnockoutAlgorithm } from './double-knockout';
import { RoundRobinAlgorithm } from './round-robin';
import { SwissSystemAlgorithm } from './swiss-system';

/**
 * Registry of all available tournament pairing algorithms.
 * To add, remove, update, or delete an algorithm, simply register or unregister it in this map!
 */
export const AlgorithmRegistry: Record<TournamentType, PairingAlgorithm> = {
  'knockout': KnockoutAlgorithm,
  'double-knockout': DoubleKnockoutAlgorithm,
  'round-robin': RoundRobinAlgorithm,
  'swiss': SwissSystemAlgorithm
};

export function getAlgorithm(type: TournamentType): PairingAlgorithm {
  const algo = AlgorithmRegistry[type];
  if (!algo) {
    throw new Error(`Algorithm type "${type}" is not registered in AlgorithmRegistry.`);
  }
  return algo;
}

export function listAlgorithms(): PairingAlgorithm[] {
  return Object.values(AlgorithmRegistry);
}

export * from './interface';
export * from './knockout';
export * from './double-knockout';
export * from './round-robin';
export * from './swiss-system';
