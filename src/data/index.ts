import { createDemoApi } from './demo';
import { createLiveApi } from './live';
import type { KybrApi } from './types';

export * from './types';

/**
 * Demo mode when no Supabase project is configured, or when the URL has ?demo.
 */
export function createApi(): KybrApi {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const forceDemo = new URLSearchParams(window.location.search).has('demo');
  return url && key && !forceDemo ? createLiveApi(url, key) : createDemoApi();
}
