import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import App from './App.tsx'
import './index.css'
// Import core styles MUST be imported after index.css
import '@mantine/core/styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* In Mantine v7+, global styles are included via the CSS import */}
    <MantineProvider>
      <App />
    </MantineProvider>
  </React.StrictMode>,
)
