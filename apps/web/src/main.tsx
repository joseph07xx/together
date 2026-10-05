import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { queryClient } from './api/query-client';
import { RealtimeProvider } from './features/realtime/RealtimeProvider';
import { NetworkBanner } from './components/NetworkBanner';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
  <RealtimeProvider>
    <NetworkBanner />
    <App />
  </RealtimeProvider>
</QueryClientProvider>
  </React.StrictMode>,
);