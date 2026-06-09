import { convex } from '@lib/convex';
import { api } from '@convex/api';
import { PAGE_CATALOG } from '@lib/pages';
import type { AstroGlobal } from 'astro';

export type PageStatus = 'active' | 'planned' | 'hidden';

export async function getPageStatus(route: string): Promise<PageStatus> {
  const overrides = await convex.query(api.sitePages.listStatuses, {});
  const override = overrides.find((p) => p.route === route);
  if (override) return override.status as PageStatus;
  const page = PAGE_CATALOG.find((p) => p.route === route);
  return page?.defaultStatus ?? 'planned';
}

export async function getPageStatusMap(): Promise<Record<string, PageStatus>> {
  const [overrides, settings] = await Promise.all([
    convex.query(api.sitePages.listStatuses, {}),
    convex.query(api.settings.get, {}),
  ]);

  const overrideMap: Record<string, PageStatus> = {};
  for (const o of overrides) overrideMap[o.route] = o.status as PageStatus;

  const map: Record<string, PageStatus> = {};
  for (const page of PAGE_CATALOG) {
    map[page.route] = overrideMap[page.route] ?? page.defaultStatus;
  }
  // Include any override routes not in the catalog
  for (const [route, status] of Object.entries(overrideMap)) {
    if (!(route in map)) map[route] = status;
  }

  // Feature flag overrides — trump sitePages status for nav filtering
  if (settings?.blogEnabled === false) map['/blog'] = 'planned';

  return map;
}

// Returns a redirect response if the page should be blocked, null otherwise.
// hidden pages still render when accessed directly — they're just excluded from nav/sitemap.
export async function enforcePageStatus(
  route: string,
  astro: AstroGlobal
): Promise<Response | null> {
  const status = await getPageStatus(route);
  if (status === 'planned') return astro.redirect('/404');
  return null;
}
