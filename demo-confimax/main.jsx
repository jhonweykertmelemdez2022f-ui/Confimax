import React from 'react'
import ReactDOM from 'react-dom/client'
// Importamos tu archivo gigante que está una carpeta más atrás
import App from '../confimax.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
