'use client';

import { useState } from 'react';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import * as actions from '../actions';

export default function ActivationForm({ token, inviteInfo }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await actions.activateEmployee({
        token,
        password,
        confirmPassword
      });

      if (res.success) {
        setSuccess(res.message);
        // Redirect to login page after short delay
        setTimeout(() => {
          window.location.href = '/sign-in';
        }, 3000);
      } else {
        setError(res.error || 'Failed to activate account.');
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
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'var(--brand-navy)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            fontWeight: 800,
            margin: '0 auto 0.75rem auto'
          }}>
            SL
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Create Your Account</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Set up your password to activate your access portal
          </p>
        </div>

        {/* Invite Info Tag */}
        {inviteInfo && (
          <div style={{
            background: '#F3F4F6',
            border: '1px solid var(--border-clean)',
            borderRadius: '6px',
            padding: '0.75rem',
            marginBottom: '1.25rem',
            fontSize: '0.75rem',
            color: 'var(--text-main)'
          }}>
            <div><strong>Invited Name</strong>: {inviteInfo.name}</div>
            <div><strong>Email</strong>: {inviteInfo.email}</div>
            <div><strong>Assigned Role</strong>: <span style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700 }} className="accent-orange">{inviteInfo.role}</span></div>
          </div>
        )}

        {/* Feedback Alerts */}
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

        {success && (
          <div style={{
            background: '#DCFCE7',
            border: '1px solid #86EFAC',
            color: '#166534',
            borderRadius: '6px',
            padding: '0.75rem',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Activation Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Lock size={12} />
              <span>Create Password</span>
            </label>
            <input
              type="password"
              required
              className="form-control"
              placeholder="Min 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading || !!success}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Lock size={12} />
              <span>Confirm Password</span>
            </label>
            <input
              type="password"
              required
              className="form-control"
              placeholder="Retype password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={isLoading || !!success}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={isLoading || !!success}
          >
            {isLoading ? 'Activating Profile...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}
