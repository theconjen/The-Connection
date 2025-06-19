import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import App from "./App";
import "./index.css";

// Global error handling for unhandled promises
window.addEventListener('unhandledrejection', event => {
  console.warn('Unhandled promise rejection:', event.reason);
  // Only prevent default for known safe errors
  if (event.reason && (event.reason.name === 'AbortError' || event.reason.name === 'NetworkError')) {
    event.preventDefault();
  }
});

// Handle DOMExceptions and other errors
window.addEventListener('error', event => {
  if (event.error instanceof DOMException) {
    console.warn('DOMException caught:', event.error.message, event.error.name);
    // Only prevent default for non-critical DOMExceptions
    if (event.error.name === 'AbortError' || event.error.name === 'NetworkError') {
      event.preventDefault();
    }
  }
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <App />
  </QueryClientProvider>
);
