/**
 * @file Memory Provider Registry
 *
 * Maps provider names to factory functions that create
 * MemoryProviderRegistration instances from configuration.
 */

import type { MemoryProviderRegistration } from '../registration';
import type { AtomicMemoryProviderConfig } from '../atomicmemory-provider/types';
import { AtomicMemoryProvider } from '../atomicmemory-provider/atomicmemory-provider';
import type { Mem0ProviderConfig } from '../mem0-provider/types';
import { Mem0Provider } from '../mem0-provider/mem0-provider';

export type ProviderRegistry = Record<
  string,
  (config: any) => MemoryProviderRegistration
>;

export const defaultRegistry: ProviderRegistry = {
  atomicmemory: (config: AtomicMemoryProviderConfig): MemoryProviderRegistration => ({
    provider: new AtomicMemoryProvider(config),
  }),
  mem0: (config: Mem0ProviderConfig): MemoryProviderRegistration => ({
    provider: new Mem0Provider(config),
  }),
};
