import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './basic.css'
import './monaco-setup'
import App from './App'
import { mockData } from './mock/data'
import { applyProjector, projectorOn } from './state/demo'
import type { MockDataset } from './types'

declare global {
  interface Window {
    __mock?: MockDataset
  }
}

document.documentElement.dataset.ui = import.meta.env.VITE_UI === 'full' ? 'full' : 'lite'
applyProjector(projectorOn())
window.__mock = mockData

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
