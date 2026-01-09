import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import SnippetEditor from './pages/SnippetEditor';
import Review from './pages/Review';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  return user ? <Navigate to="/" /> : children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/library"
              element={
                <PrivateRoute>
                  <Library />
                </PrivateRoute>
              }
            />
            <Route
              path="/snippet/new"
              element={
                <PrivateRoute>
                  <SnippetEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/snippet/:id/edit"
              element={
                <PrivateRoute>
                  <SnippetEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/review"
              element={
                <PrivateRoute>
                  <Review />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
