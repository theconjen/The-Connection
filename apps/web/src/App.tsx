import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import FeedPage from "./routes/feed";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg text-text">
        <header className="p-4 border-b border-border flex items-center justify-between">
          <div className="font-semibold">Web App</div>
          <nav className="text-sm">
            <Link to="/feed" className="hover:underline">Feed</Link>
          </nav>
        </header>
        <main className="p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="*" element={<div className="text-danger">Not found</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
