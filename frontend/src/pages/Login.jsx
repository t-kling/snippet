import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../api/client';

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    setResetSuccess(false);

    try {
      await authAPI.requestPasswordReset(resetEmail);
      setResetSuccess(true);
    } catch (err) {
      setResetError(err.response?.data?.error || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetEmail('');
    setResetError('');
    setResetSuccess(false);
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
          {isRegister ? 'Register' : 'Login'}
        </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid var(--border-color)',
              borderRadius: '4px',
              backgroundColor: '#FFF',
            }}
          />
        </div>

        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid var(--border-color)',
              borderRadius: '4px',
              backgroundColor: '#FFF',
            }}
          />
          {isRegister && (
            <small style={{ color: 'var(--text-secondary)' }}>Minimum 8 characters</small>
          )}
          {/* Password reset temporarily hidden */}
          {/* {!isRegister && (
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--blue-button)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Forgot Password?
              </button>
            </div>
          )} */}
        </div>

        {error && <div style={{ color: 'var(--again-red)', fontSize: '14px', padding: '10px', backgroundColor: '#fef2f2', borderRadius: '4px', border: '1px solid var(--again-red)' }}>{error}</div>}

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
          {loading ? 'Loading...' : isRegister ? 'Register' : 'Login'}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
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
          {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
      </form>
      </div>

      {showResetModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeResetModal}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              padding: '30px',
              borderRadius: '8px',
              border: '2px solid var(--border-color)',
              maxWidth: '450px',
              width: '100%',
              margin: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Reset Password</h2>

            {!resetSuccess ? (
              <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  Enter your email address and we'll send you a password reset link.
                </p>

                <div>
                  <label htmlFor="reset-email" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
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

                {resetError && (
                  <div style={{
                    color: 'var(--again-red)',
                    fontSize: '14px',
                    padding: '10px',
                    backgroundColor: '#fef2f2',
                    borderRadius: '4px',
                    border: '1px solid var(--again-red)',
                  }}>
                    {resetError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      backgroundColor: 'var(--blue-button)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: resetLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button
                    type="button"
                    onClick={closeResetModal}
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '15px',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)',
                      border: '2px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{
                  color: 'var(--good-green)',
                  fontSize: '14px',
                  padding: '10px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '4px',
                  border: '1px solid var(--good-green)',
                  marginBottom: '20px',
                }}>
                  Password reset link sent! Check your email for instructions.
                </div>
                <button
                  onClick={closeResetModal}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    backgroundColor: 'var(--blue-button)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
