import { randomUUID } from 'node:crypto';
import { ExpiringCache } from '../lib/cache.js';
import { parseDateStr } from '../lib/dateUtils.js';
import { withTimeout } from '../lib/asyncUtils.js';
import { neonReflectionStore } from './neonReflectionStore.js';

type Claim = { status: 'ready'; reflection: string } | { status: 'acquired' } | { status: 'busy' };
export interface GeneratedReflection {
  reflection: string;
  model: string;
  promptVersion: string;
}
type Generation = () => Promise<string | GeneratedReflection>;
export interface ReflectionStore {
  claim(date: string, owner: string): Promise<Claim>;
  complete(date: string, owner: string, reflection: string, metadata?: Omit<GeneratedReflection, 'reflection'>): Promise<void>;
  fail(date: string, owner: string): Promise<void>;
}

export class SharedReflections {
  private readonly cache = new ExpiringCache<string>(100, 24 * 60 * 60 * 1000);
  private readonly running = new Map<string, Promise<string>>();

  constructor(private readonly store: ReflectionStore) {}

  get(date: string, generate: Generation): Promise<string> {
    parseDateStr(date);
    const cached = this.cache.get(date);
    if (cached) return Promise.resolve(cached);
    const running = this.running.get(date);
    if (running) return running;
    const request = this.load(date, generate).finally(() => this.running.delete(date));
    this.running.set(date, request);
    return request;
  }

  private async load(date: string, generate: Generation): Promise<string> {
    const owner = randomUUID();
    const claim = await withTimeout(this.store.claim(date, owner));
    if (claim.status === 'busy') throw new Error('Reflexión en preparación o temporalmente limitada.');
    if (claim.status === 'ready') {
      this.cache.set(date, claim.reflection);
      return claim.reflection;
    }
    try {
      const generated = await generate();
      const reflection = typeof generated === 'string' ? generated : generated.reflection;
      if (!reflection.trim()) throw new Error('Reflexión vacía.');
      await withTimeout(this.store.complete(date, owner, reflection,
        typeof generated === 'string' ? undefined : generated));
      this.cache.set(date, reflection);
      return reflection;
    } catch (error) {
      try { await withTimeout(this.store.fail(date, owner), 3000); }
      catch { console.error('No se pudo actualizar el estado de la reflexión compartida.'); }
      throw error;
    }
  }
}

let shared: SharedReflections | undefined;
export function getSharedReflection(date: string, generate: Generation): Promise<string> {
  shared ||= new SharedReflections(neonReflectionStore());
  return shared.get(date, generate);
}
