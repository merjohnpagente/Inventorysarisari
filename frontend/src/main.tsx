import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
const Router = import.meta.env.VITE_MOCK ? MemoryRouter : BrowserRouter;
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { installClickSounds } from './services/sound';
import './index.css';

installClickSounds();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
