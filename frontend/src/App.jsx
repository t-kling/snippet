import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import SnippetEditor from './pages/SnippetEditor';
import Review from './pages/Review';
import TopicReview from './pages/TopicReview';
import SourceReview from './pages/SourceReview';
import Stats from './pages/Stats';

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
    <SettingsProvider>
      <Router>
        <AuthProvider>
          <div style={{ minHeight: '100vh' }}>
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
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
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
            <Route
              path="/review/topic"
              element={
                <PrivateRoute>
                  <TopicReview />
                </PrivateRoute>
              }
            />
            <Route
              path="/review/source"
              element={
                <PrivateRoute>
                  <SourceReview />
                </PrivateRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <PrivateRoute>
                  <Stats />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
    </SettingsProvider>
  );
}

export default App;
