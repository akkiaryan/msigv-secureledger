'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Lock, User, AlertCircle, ShieldAlert } from 'lucide-react';

export default function SignInForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false
      });

      if (res?.error) {
        setError(res.error || 'Invalid credentials');
      } else {
        // Redirect directly to the dashboard
        window.location.href = '/';
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-main)',
      padding: '1.5rem'
    }}>
      <div className="clean-card" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2.5rem 2rem',
        border: '1px solid var(--border-clean)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img 
            src="/logo.svg" 
            alt="Maa Santoshi Indane Gramin Vitrak Logo" 
            style={{ 
              width: '84px', 
              height: '92px', 
              margin: '0 auto 1.25rem', 
              display: 'block', 
              objectFit: 'contain' 
            }} 
          />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.25rem' }}>
            Maa Santoshi Indane Gramin Vitrak
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--brand-navy)', fontWeight: 600, marginTop: '0.15rem', marginBottom: '0.5rem' }}>
            Welcome Back
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Sign in to continue to SecureLedger
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            borderRadius: '6px',
            padding: '0.75rem',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <User size={12} />
              <span>Username or Email</span>
            </label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="Username or Email"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Lock size={12} />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-orange"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={isLoading}
          >
            {isLoading ? 'Verifying Session...' : 'Sign In to Ledger'}
          </button>
        </form>
      </div>
    </div>
  );
}
