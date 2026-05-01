import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import "./index.css";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TenantProvider } from "./contexts/TenantContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes by default
    },
  },
});

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions
  replaysSessionSampleRate: 0.1, // Sample 10% of sessions for replay
  replaysOnErrorSampleRate: 1.0, // Sample 100% of errors for replay
  beforeSend(event) {
    if (event.request && event.request.headers) {
      delete event.request.headers;
    }
    return event;
  }
});

// ── Datadog Real User Monitoring (RUM) ────────────────────────────────────────
if (import.meta.env.VITE_DD_APPLICATION_ID) {
  import('@datadog/browser-rum').then(({ datadogRum }) => {
    datadogRum.init({
      applicationId: import.meta.env.VITE_DD_APPLICATION_ID,
      clientToken: import.meta.env.VITE_DD_CLIENT_TOKEN,
      site: 'us5.datadoghq.com',
      service: 'acadmix-frontend',
      env: import.meta.env.MODE,
      version: '2.0.0',
      sessionSampleRate: 100,
      sessionReplaySampleRate: 20,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask-user-input',
    });
  });
}


const rootElement = document.getElementById("root") as HTMLElement; const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </TenantProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
