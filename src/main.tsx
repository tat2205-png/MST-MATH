import {lazy, StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {resolveFoldGeoGebraRoute} from './routing/foldGeogebraRoute.js';

const Fold3DViewer = lazy(() => import('./components/dev/Fold3DViewer.js'));
const DynamicGeometryDevPanel = lazy(() => import('./components/dev/DynamicGeometryDevPanel.js'));
const DynamicMathWorkspacePanel = lazy(() => import('./components/dev/DynamicMathWorkspacePanel.js'));
const FoldTeachingPlayback = lazy(() => import('./components/teaching/FoldTeachingPlayback.js'));
const GeoGebraFoldView = lazy(() => import('./components/teaching/GeoGebraFoldView.js'));
const env = (import.meta as ImportMeta & {env: Record<string, string | undefined>}).env;
const isFoldViewer = window.location.pathname === '/dev/fold-3d' && env.VITE_FOLD_3D_VIEWER_DEV === 'true';
const isDynamicGeometryViewer = window.location.pathname === '/dev/dynamic-geometry' && env.VITE_FOLD_3D_VIEWER_DEV === 'true';
const isDynamicMathWorkspace = window.location.pathname === '/dev/dynamic-workspace' && env.VITE_FOLD_3D_VIEWER_DEV === 'true';
const isFoldTeaching = window.location.pathname === '/fold-teaching';
const foldGeoGebraRoute = resolveFoldGeoGebraRoute(window.location.pathname, env.VITE_FOLD_GEOGEBRA_DEV === 'true');
const isFoldGeoGebra = foldGeoGebraRoute === 'geogebra';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isFoldGeoGebra ? <Suspense fallback={<div>Loading GeoGebra…</div>}><GeoGebraFoldView onExit={()=>window.location.assign('/fold-teaching')} /></Suspense> : foldGeoGebraRoute === 'disabled' ? <main><h1>GeoGebra Fold disabled</h1><p>Set VITE_FOLD_GEOGEBRA_DEV=true and restart the dev server to enable this route.</p></main> : isFoldTeaching ? <Suspense fallback={<div>Loading fold teaching…</div>}><FoldTeachingPlayback onExit={()=>window.location.assign('/dev/dynamic-geometry')} /></Suspense> : isDynamicMathWorkspace ? <Suspense fallback={<div>Loading Dynamic Math Workspace…</div>}><DynamicMathWorkspacePanel /></Suspense> : isDynamicGeometryViewer ? <Suspense fallback={<div>Loading Dynamic Geometry…</div>}><DynamicGeometryDevPanel onExit={()=>window.location.assign('/')} /></Suspense> : isFoldViewer ? <Suspense fallback={<div>Loading Fold 3D viewer…</div>}><Fold3DViewer /></Suspense> : <App />}
  </StrictMode>,
);
