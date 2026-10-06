import { createDemoApi } from './demo';
import { createLiveApi } from './live';
import type { KybrApi } from './types';

export * from './types';

/**
 * Demo mode when no Supabase project is configured, or when the URL has ?demo
 * (?demo=crew starts already in the prototype's crews).
 */
export function createApi(): KybrApi {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const demo = new URLSearchParams(window.location.search).get('demo');
  return url && key && demo === null ? createLiveApi(url, key) : createDemoApi(demo === 'crew');
}
