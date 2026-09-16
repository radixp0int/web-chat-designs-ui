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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<App />} />
        <Route path="/widget-demo" element={<WidgetDemoPage />} />
        <Route path="/workflow-demo" element={<WorkflowRoute />} />
        <Route path="/mermaid-lab" element={<MermaidLabPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
