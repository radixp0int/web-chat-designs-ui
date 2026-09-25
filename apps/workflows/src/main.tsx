import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router'
import { DemoFrame } from '@chat/ui'
import './app.css'
import { CHAT_URL } from './config'
// React Flow is only needed once a run is on screen, so it rides its own chunk
// behind a branded skeleton — see WorkflowRoute.tsx.
import { WorkflowRoute } from './WorkflowRoute.tsx'
// The same page, driven by workflow-ws-server instead of the hard-coded run.
import { WorkflowLiveRoute } from './WorkflowLiveRoute.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* The landing page is the chat app's; this app's root just picks a run. */}
        <Route path="/" element={<Navigate to="/workflow-demo" replace />} />
        <Route
          element={
            <DemoFrame homeHref={CHAT_URL}>
              <Outlet />
            </DemoFrame>
          }
        >
          <Route path="/workflow-demo" element={<WorkflowRoute />} />
          <Route path="/workflow-live" element={<WorkflowLiveRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
