import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './assets/styles.css'
import { Toaster } from 'sonner';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
    <Toaster position="bottom-right" richColors theme="dark" />
  </React.StrictMode>
);
