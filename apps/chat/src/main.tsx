import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Outlet, Route, Routes } from 'react-router'
import './app.css'
import { LandingPage } from './demo/pages/LandingPage.tsx'
import {
  ChatPage,
  DataTablePage,
  PrimitivesPage,
  RoutePending,
  WidgetDemoPage,
  WorkflowLiveRoute,
  WorkflowRoute,
} from './demo/lazyRoutes.tsx'
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
              <Suspense fallback={<RoutePending />}>
                <Outlet />
              </Suspense>
            </DemoFrame>
          }
        >
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/widget-demo" element={<WidgetDemoPage />} />
          <Route path="/workflow-demo" element={<WorkflowRoute />} />
          <Route path="/workflow-live" element={<WorkflowLiveRoute />} />
          <Route path="/primitives" element={<PrimitivesPage />} />
          <Route path="/data-table" element={<DataTablePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
