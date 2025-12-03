import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import VerifyEmail from './pages/VerifyEmail';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 20 }}>
        <h1>The Connection — Web</h1>
        <p>
          This app includes a simple email verification page for testing. Use <Link to="/verify-email">Verify Email</Link>.
        </p>
        <Routes>
          <Route path="/" element={<div />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
