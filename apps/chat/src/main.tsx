import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import './lib/styles.css'
import App from './demo/App.tsx'
import { LandingPage } from './demo/pages/LandingPage.tsx'
import { WidgetDemoPage } from './demo/pages/WidgetDemoPage.tsx'
// Temporary — remove with src/demo/mermaid-lab/ once a renderer is chosen.
import { MermaidLabPage } from './demo/mermaid-lab/MermaidLabPage.tsx'
// React Flow is only needed by this one route, so it rides its own chunk behind
// a branded skeleton — see WorkflowRoute.tsx.
import { WorkflowRoute } from './demo/workflow-demo/WorkflowRoute.tsx'
// The same page, driven by workflow-ws-server instead of the hard-coded run.
import { WorkflowLiveRoute } from './demo/workflow-demo/WorkflowLiveRoute.tsx'
// Unlisted workbench for src/lib/core. Deliberately absent from the landing
// page — reachable only by typing /primitives.
import { PrimitivesPage } from './demo/pages/PrimitivesPage.tsx'
import { DataTablePage } from './demo/pages/DataTablePage.tsx'
// The shell the demo routes share — see the layout route below.
import { DemoFrame } from './demo/components/DemoFrame.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Everything below the landing page gets the back-to-demos bookmark. */}
        <Route element={<DemoFrame />}>
          <Route path="/chat" element={<App />} />
          <Route path="/widget-demo" element={<WidgetDemoPage />} />
          <Route path="/workflow-demo" element={<WorkflowRoute />} />
          <Route path="/workflow-live" element={<WorkflowLiveRoute />} />
          <Route path="/mermaid-lab" element={<MermaidLabPage />} />
          <Route path="/primitives" element={<PrimitivesPage />} />
          <Route path="/data-table" element={<DataTablePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
