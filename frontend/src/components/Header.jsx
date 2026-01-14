import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import SettingsDropdown from './SettingsDropdown';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{
      backgroundColor: 'var(--header-dark)',
      padding: '20px 0',
      marginBottom: '30px',
      borderBottom: '3px solid var(--border-color)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
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
          <p style={{
            color: '#ffffff',
            margin: '4px 0 0 0',
            fontStyle: 'italic',
            fontSize: '14px',
            opacity: 0.85,
          }}>
            What if your notes fought back against forgetting?
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ color: '#ffffff', marginRight: '10px' }}>{user?.email}</span>
          {location.pathname !== '/' && (
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '2px solid #ffffff',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Home
            </button>
          )}
          <SettingsDropdown />
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: '2px solid #ffffff',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Header;
