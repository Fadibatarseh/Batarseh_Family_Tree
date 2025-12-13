import React from 'react'
import ReactDOM from 'react-dom/client'
import FamilyTreeApp from './FamilyTreeApp' 
// We removed 'import ./index.css' and 'import App' because you deleted them!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FamilyTreeApp />
  </React.StrictMode>,
)
