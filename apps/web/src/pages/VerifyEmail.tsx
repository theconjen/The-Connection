import React, { useEffect, useState } from 'react';

export default function VerifyEmail() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No token provided in URL');
      setShowResend(true);
      return;
    }

    setStatus('loading');
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus('success');
          setMessage('Your email has been verified. Redirecting...');
          setTimeout(() => (window.location.href = '/'), 2500);
        } else {
          setStatus('error');
          setMessage(data?.message || 'Failed to verify token');
          setShowResend(true);
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(String(err));
        setShowResend(true);
      });
  }, []);

  async function handleResend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email) {
      setMessage('Enter your email to resend verification');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('success');
        setMessage('Verification email sent. Check your inbox.');
      } else {
        setStatus('error');
        setMessage(data?.message || 'Failed to send verification email');
      }
    } catch (err) {
      setStatus('error');
      setMessage(String(err));
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Email Verification</h2>
      {status === 'loading' && <p>Working...</p>}
      {status === 'success' && <p style={{ color: 'green' }}>{message}</p>}
      {status === 'error' && <p style={{ color: 'red' }}>{message}</p>}

      {showResend && (
        <form onSubmit={handleResend} style={{ marginTop: 12 }}>
          <label>
            Email to resend verification:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginLeft: 8 }}
            />
          </label>
          <button type="submit" style={{ marginLeft: 8 }}>Resend</button>
        </form>
      )}
    </div>
  );
}
