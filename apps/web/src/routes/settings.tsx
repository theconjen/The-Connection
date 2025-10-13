import React from 'react';

export default function SettingsPage() {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [emailSummaries, setEmailSummaries] = React.useState(true);
  const baseUrl = import.meta.env.BASE_URL || '/';

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-base">Notifications</span>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
            className="w-4 h-4"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-base">Dark Mode</span>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
            className="w-4 h-4"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-base">Email Summaries</span>
          <input
            type="checkbox"
            checked={emailSummaries}
            onChange={(e) => setEmailSummaries(e.target.checked)}
            className="w-4 h-4"
          />
        </div>

        <div className="pt-4 border-t border-border">
          <h2 className="text-lg font-semibold mb-2">Support & Policies</h2>
          <div className="space-y-2">
            <a
              href={`${baseUrl}privacy.html`}
              target="_blank"
              rel="noopener"
              className="block text-primary hover:underline"
            >
              Privacy Policy
            </a>
            <a
              href={`${baseUrl}terms.html`}
              target="_blank"
              rel="noopener"
              className="block text-primary hover:underline"
            >
              Terms of Service
            </a>
            <a
              href={`${baseUrl}community-guidelines.html`}
              target="_blank"
              rel="noopener"
              className="block text-primary hover:underline"
            >
              Community Guidelines
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}