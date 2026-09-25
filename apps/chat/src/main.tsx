import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Outlet, Route, Routes } from 'react-router'
import './app.css'
import App from './demo/App.tsx'
import { LandingPage } from './demo/pages/LandingPage.tsx'
import { WidgetDemoPage } from './demo/pages/WidgetDemoPage.tsx'
// Temporary — remove with src/demo/mermaid-lab/ once a renderer is chosen.
import { MermaidLabPage } from './demo/mermaid-lab/MermaidLabPage.tsx'
// Unlisted workbench for @chat/ui's core primitives. Deliberately absent from the landing
// page — reachable only by typing /primitives.
import { PrimitivesPage } from './demo/pages/PrimitivesPage.tsx'
import { DataTablePage } from './demo/pages/DataTablePage.tsx'
// The shell the demo routes share — see the layout route below.
import { DemoFrame } from '@chat/ui'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Everything below the landing page gets the back-to-demos bookmark. */}
        <Route
          element={
            <DemoFrame homeHref="/">
              <Outlet />
            </DemoFrame>
          }
        >
          <Route path="/chat" element={<App />} />
          <Route path="/widget-demo" element={<WidgetDemoPage />} />
          <Route path="/mermaid-lab" element={<MermaidLabPage />} />
          <Route path="/primitives" element={<PrimitivesPage />} />
          <Route path="/data-table" element={<DataTablePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
