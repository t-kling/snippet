import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api/client';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid reset link. No token provided.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{
        backgroundColor: 'var(--header-dark)',
        padding: '20px 0',
        marginBottom: '50px',
        borderBottom: '3px solid var(--border-color)',
      }}>
        <div style={{
          maxWidth: '450px',
          margin: '0 auto',
          padding: '0 20px',
          textAlign: 'center',
        }}>
          <h1 style={{
            color: '#ffffff',
            margin: 0,
            fontFamily: "'Baskerville', 'Libre Baskerville', 'Palatino', serif",
            fontSize: '36px',
            fontWeight: '400',
            letterSpacing: '0.05em',
          }}>
            Snippet
          </h1>
        </div>
      </div>

      <div style={{
        maxWidth: '450px',
        margin: '0 auto',
        padding: '40px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '8px',
        border: '2px solid var(--border-color)',
      }}>
        <h2 style={{ marginTop: 0, textAlign: 'center', color: 'var(--text-primary)' }}>
          Reset Your Password
        </h2>

        {!token ? (
          <div style={{
            color: 'var(--again-red)',
            fontSize: '14px',
            padding: '10px',
            backgroundColor: '#fef2f2',
            borderRadius: '4px',
            border: '1px solid var(--again-red)',
            textAlign: 'center',
          }}>
            Invalid reset link. Please request a new password reset.
          </div>
        ) : success ? (
          <div>
            <div style={{
              color: 'var(--good-green)',
              fontSize: '14px',
              padding: '10px',
              backgroundColor: '#f0fdf4',
              borderRadius: '4px',
              border: '1px solid var(--good-green)',
              marginBottom: '20px',
              textAlign: 'center',
            }}>
              Password reset successful! Redirecting to login...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label htmlFor="new-password" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                }}
              />
              <small style={{ color: 'var(--text-secondary)' }}>Minimum 8 characters</small>
            </div>

            <div>
              <label htmlFor="confirm-password" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {error && (
              <div style={{
                color: 'var(--again-red)',
                fontSize: '14px',
                padding: '10px',
                backgroundColor: '#fef2f2',
                borderRadius: '4px',
                border: '1px solid var(--again-red)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px',
                fontSize: '17px',
                fontWeight: 'bold',
                backgroundColor: 'var(--blue-button)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                padding: '12px',
                fontSize: '15px',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                border: '2px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
