import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './app/components/ThemeProvider'
import './styles/index.css'
import { Toaster } from 'sonner'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <App />
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  </React.StrictMode>,
)
