export type FoldGeoGebraRoute = 'geogebra' | 'disabled' | 'home';

export function resolveFoldGeoGebraRoute(pathname: string, enabled: boolean): FoldGeoGebraRoute {
  if (pathname !== '/fold-geogebra') return 'home';
  return enabled ? 'geogebra' : 'disabled';
}
