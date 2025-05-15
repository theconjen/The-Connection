import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import App from "./App";
import "./index.css";

// Global error handling for unhandled promises
window.addEventListener('unhandledrejection', event => {
  console.warn('Unhandled promise rejection:', event.reason);
  // Prevent the default handling (which would log to console)
  event.preventDefault();
});

// Handle DOMExceptions
window.addEventListener('error', event => {
  if (event.error instanceof DOMException) {
    console.warn('DOMException caught:', event.error.message);
    // Prevent the default error handling
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <App />
  </QueryClientProvider>
);
