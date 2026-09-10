import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import './basic.css'
import './monaco-setup'
import App from './App'

document.documentElement.dataset.ui = import.meta.env.VITE_UI === 'full' ? 'full' : 'lite'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
