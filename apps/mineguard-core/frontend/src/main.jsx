import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { MineDataProvider } from './context/MineDataContext'
import ErrorBoundary from './components/common/ErrorBoundary'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <MineDataProvider>
          <App />
        </MineDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)

