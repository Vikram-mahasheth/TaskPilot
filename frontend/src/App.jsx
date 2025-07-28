import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BoardPage from './pages/BoardPage';
import TicketDetailPage from './pages/TicketDetailPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
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
          <Toaster position="bottom-right" toastOptions={{
            className: 'dark:bg-gray-700 dark:text-white',
          }}/>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
