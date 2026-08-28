import {lazy, StrictMode, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const Fold3DViewer = lazy(() => import('./components/dev/Fold3DViewer.js'));
const DynamicGeometryDevPanel = lazy(() => import('./components/dev/DynamicGeometryDevPanel.js'));
const DynamicMathWorkspacePanel = lazy(() => import('./components/dev/DynamicMathWorkspacePanel.js'));
const env = (import.meta as ImportMeta & {env: Record<string, string | undefined>}).env;
const isFoldViewer = window.location.pathname === '/dev/fold-3d' && env.VITE_FOLD_3D_VIEWER_DEV === 'true';
const isDynamicGeometryViewer = window.location.pathname === '/dev/dynamic-geometry' && env.VITE_FOLD_3D_VIEWER_DEV === 'true';
const isDynamicMathWorkspace = window.location.pathname === '/dev/dynamic-workspace' && env.VITE_FOLD_3D_VIEWER_DEV === 'true';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isDynamicMathWorkspace ? <Suspense fallback={<div>Loading Dynamic Math Workspace…</div>}><DynamicMathWorkspacePanel /></Suspense> : isDynamicGeometryViewer ? <Suspense fallback={<div>Loading Dynamic Geometry…</div>}><DynamicGeometryDevPanel onExit={()=>window.location.assign('/')} /></Suspense> : isFoldViewer ? <Suspense fallback={<div>Loading Fold 3D viewer…</div>}><Fold3DViewer /></Suspense> : <App />}
  </StrictMode>,
);
