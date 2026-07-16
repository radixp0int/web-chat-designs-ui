import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import './lib/styles.css'
import App from './demo/App.tsx'
import { LandingPage } from './demo/pages/LandingPage.tsx'
import { WidgetDemoPage } from './demo/pages/WidgetDemoPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<App />} />
        <Route path="/widget-demo" element={<WidgetDemoPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
