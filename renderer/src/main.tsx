import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

window.electron.onActivityLogged(entry => {
  console.log('[ACTIVITY] %j', entry)
})

window.electron.resumeActivityStream().then(() => {
  console.log('ACTIVITY STREAM RESUMED')
})
