import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Redirige explicitement si l'URL pointe encore vers l'ancienne page statique supprimée
const removedPages = ['/pages/finance/situation.html']
if (removedPages.includes(window.location.pathname)) {
  window.location.replace('/pages/finance/situation-removed.html')
}

import { BrowserRouter } from 'react-router-dom';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
