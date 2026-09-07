import {lazy, StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {resolveFoldGeoGebraRoute} from './routing/foldGeogebraRoute.js';
import { resolveConsumerProfile } from './config/naMathBrandRoot.js';

const Fold3DViewer = lazy(() => import('./components/dev/Fold3DViewer.js'));
const DynamicGeometryDevPanel = lazy(() => import('./components/dev/DynamicGeometryDevPanel.js'));
const DynamicMathWorkspacePanel = lazy(() => import('./components/dev/DynamicMathWorkspacePanel.js'));
const FoldTeachingPlayback = lazy(() => import('./components/teaching/FoldTeachingPlayback.js'));
const GeoGebraFoldView = lazy(() => import('./components/teaching/GeoGebraFoldView.js'));
const GeoGebraUnitCircleView = lazy(() => import('./components/teaching/GeoGebraUnitCircleView.js'));
const env = (import.meta as ImportMeta & {env: Record<string, string | undefined>}).env;
// Production Fold uses the same canonical viewer as development; only the
// development entry point remains feature-flagged.
const isFoldProduction = window.location.pathname === '/fold';
const isFoldViewer = window.location.pathname === '/dev/fold-3d' && env.VITE_FOLD_3D_VIEWER_DEV === 'true';
const isDynamicGeometryViewer = window.location.pathname === '/dev/dynamic-geometry' && env.VITE_FOLD_3D_VIEWER_DEV === 'true';
const isDynamicMathWorkspace = window.location.pathname === '/dev/dynamic-workspace' && env.VITE_FOLD_3D_VIEWER_DEV === 'true';
const isFoldTeaching = window.location.pathname === '/fold-teaching';
const foldGeoGebraRoute = resolveFoldGeoGebraRoute(window.location.pathname, env.VITE_FOLD_GEOGEBRA_DEV === 'true');
const isFoldGeoGebra = foldGeoGebraRoute === 'geogebra';
const isUnitCircle = window.location.pathname === '/geogebra-unit-circle';
resolveConsumerProfile('APP_UI');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isUnitCircle ? <Suspense fallback={<div>Loading GeoGebra…</div>}><GeoGebraUnitCircleView /></Suspense> : isFoldGeoGebra ? <Suspense fallback={<div>Loading GeoGebra…</div>}><GeoGebraFoldView onExit={()=>window.location.assign('/fold-teaching')} /></Suspense> : foldGeoGebraRoute === 'disabled' ? <main><h1>GeoGebra Fold disabled</h1><p>Set VITE_FOLD_GEOGEBRA_DEV=true and restart the dev server to enable this route.</p></main> : isFoldTeaching ? <Suspense fallback={<div>Loading GeoGebra…</div>}><FoldTeachingPlayback onExit={()=>window.location.assign('/dev/dynamic-geometry')} /></Suspense> : isDynamicMathWorkspace ? <Suspense fallback={<div>Loading Dynamic Math Workspace…</div>}><DynamicMathWorkspacePanel /></Suspense> : isDynamicGeometryViewer ? <Suspense fallback={<div>Loading Dynamic Geometry…</div>}><DynamicGeometryDevPanel onExit={()=>window.location.assign('/')} /></Suspense> : isFoldProduction || isFoldViewer ? <Suspense fallback={<div>Loading Fold 3D viewer…</div>}><Fold3DViewer /></Suspense> : <App />}
  </StrictMode>,
);
