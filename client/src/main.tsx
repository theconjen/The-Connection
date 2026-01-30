import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./contexts/theme-context";
import { CookieConsentProvider } from "./contexts/cookie-consent-context";
import { SocketProvider } from "./contexts/SocketContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initSentry, captureException } from "./lib/sentry";
import App from "./App";
import "./index.css";

// Initialize Sentry as early as possible
initSentry();

// Global error handling for unhandled promises
window.addEventListener('unhandledrejection', event => {
  console.warn('Unhandled promise rejection:', event.reason);

  // Only prevent default for known safe errors
  if (event.reason && (event.reason.name === 'AbortError' || event.reason.name === 'NetworkError')) {
    event.preventDefault();
    return;
  }

  // Report to Sentry
  if (event.reason instanceof Error) {
    captureException(event.reason, {
      unhandledRejection: true,
    });
  } else {
    captureException(new Error(`Unhandled rejection: ${event.reason}`), {
      unhandledRejection: true,
      reason: event.reason,
    });
  }
});

// Handle DOMExceptions and other errors
window.addEventListener('error', event => {
  if (event.error instanceof DOMException) {
    console.warn('DOMException caught:', event.error.message, event.error.name);
    // Only prevent default for non-critical DOMExceptions
    if (event.error.name === 'AbortError' || event.error.name === 'NetworkError') {
      event.preventDefault();
      return;
    }
  }

  // Report non-critical errors to Sentry
  if (event.error) {
    captureException(event.error, {
      globalErrorHandler: true,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  }
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="the-connection-ui-theme">
        <CookieConsentProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </CookieConsentProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
