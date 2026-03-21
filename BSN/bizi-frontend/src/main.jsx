
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRouter from './AppRouter';
import { useThemeStore } from './store/themeStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            60_000,
      retry:                1,
      refetchOnWindowFocus: false,
    },
  },
});

// ── Initialise theme BEFORE first render so there's no flash ──
useThemeStore.getState().init();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter queryClient={queryClient} />
    </QueryClientProvider>
  </StrictMode>
);
