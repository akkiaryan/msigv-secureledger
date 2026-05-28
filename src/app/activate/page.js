import prisma from '@/lib/db';
import ActivationForm from '../components/ActivationForm';
import { AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ActivatePage({ searchParams }) {
  const params = await searchParams;
  const token = params?.token;

  if (!token) {
    return (
      <div style={containerStyle}>
        <div className="clean-card" style={cardStyle}>
          <div style={errorIconContainerStyle}>
            <AlertTriangle size={32} />
          </div>
          <h2 style={titleStyle}>Invalid Invitation</h2>
          <p style={descriptionStyle}>
            No activation token was found. Please request a new invite link from your Administrator.
          </p>
          <a href="/sign-in" className="btn-primary" style={buttonStyle}>
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  // Find the invite
  const invite = await prisma.invite.findUnique({
    where: { token },
  });

  const now = new Date();
  const isExpired = invite ? now > invite.expiresAt : true;
  const isInvalid = !invite || invite.isUsed || isExpired;

  if (isInvalid) {
    let reason = "This activation link is invalid or has expired.";
    if (invite?.isUsed) {
      reason = "This activation link has already been used to set up your profile.";
    }

    return (
      <div style={containerStyle}>
        <div className="clean-card" style={cardStyle}>
          <div style={errorIconContainerStyle}>
            <AlertTriangle size={32} />
          </div>
          <h2 style={titleStyle}>Invitation Expired or Invalid</h2>
          <p style={descriptionStyle}>{reason}</p>
          <p style={helperTextStyle}>
            Please contact your administrator to receive a fresh invitation email.
          </p>
          <a href="/sign-in" className="btn-primary" style={buttonStyle}>
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <ActivationForm
      token={token}
      inviteInfo={{
        name: invite.name,
        email: invite.email,
        role: invite.role,
      }}
    />
  );
}

// Minimalist white styling inline styles
const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#F7F8FA', // canvas background
  padding: '1.5rem',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const cardStyle = {
  width: '100%',
  maxWidth: '420px',
  padding: '2.5rem 2rem',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  border: '1px solid #E5E7EB',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const errorIconContainerStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: '#FFFBEB',
  color: '#D97706', // amber
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1.5rem',
};

const titleStyle = {
  fontSize: '1.25rem',
  fontWeight: 800,
  color: '#02164F', // Brand Navy
  marginBottom: '0.75rem',
};

const descriptionStyle = {
  fontSize: '0.875rem',
  color: '#4B5563',
  lineHeight: '1.5',
  marginBottom: '1rem',
};

const helperTextStyle = {
  fontSize: '0.75rem',
  color: '#9CA3AF',
  marginBottom: '1.5rem',
};

const buttonStyle = {
  display: 'inline-block',
  width: '100%',
  padding: '0.75rem 1rem',
  backgroundColor: '#F37022', // Brand Orange
  color: '#FFFFFF',
  textDecoration: 'none',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '0.875rem',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'center',
};
