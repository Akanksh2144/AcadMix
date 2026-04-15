import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Set default theme
if (!localStorage.getItem('acadmix-theme')) {
  document.documentElement.setAttribute('data-theme', 'dark');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
