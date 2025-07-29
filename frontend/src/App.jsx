import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { useContext } from 'react';

import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BoardPage from './pages/BoardPage';
import TicketDetailPage from './pages/TicketDetailPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';

// This new component decides what to show based on the loading state
function AppContent() {
  const { loading } = useContext(AuthContext);

  // If the initial auth check is still running, show a full-page spinner.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  // Once the check is complete, render the actual application.
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<PrivateRoute><BoardPage /></PrivateRoute>} />
          <Route path="/tickets/:id" element={<PrivateRoute><TicketDetailPage /></PrivateRoute>} />
          <Route path="/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Routes>
      </Layout>
    </Router>
  );
}

// The main App component wraps the providers around the new AppContent
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
          <Toaster position="bottom-right" toastOptions={{
            className: 'dark:bg-gray-700 dark:text-white',
          }}/>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
