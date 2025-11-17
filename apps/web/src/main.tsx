import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../client/src/lib/queryClient";
import { initGA } from "../../client/src/lib/analytics";
import { ThemeProvider } from "../../client/src/contexts/theme-context";
import App from "../../client/src/App";
import "../../client/src/index.css";

// Initialize Google Analytics
initGA();

// Global error handling for unhandled promises
window.addEventListener('unhandledrejection', event => {
	console.warn('Unhandled promise rejection:', event.reason);
	if (event.reason && (event.reason.name === 'AbortError' || event.reason.name === 'NetworkError')) {
		event.preventDefault();
	}
});

window.addEventListener('error', event => {
	if (event.error instanceof DOMException) {
		console.warn('DOMException caught:', event.error.message, event.error.name);
		if (event.error.name === 'AbortError' || event.error.name === 'NetworkError') {
			event.preventDefault();
		}
	}
});

createRoot(document.getElementById("root")!).render(
	<QueryClientProvider client={queryClient}>
		<ThemeProvider defaultTheme="system" storageKey="the-connection-ui-theme">
			<App />
		</ThemeProvider>
	</QueryClientProvider>
);
