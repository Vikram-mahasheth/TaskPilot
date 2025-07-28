import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const AdminRoute = ({ children }) => {
  const { user, token } = useContext(AuthContext);

  if (!token || (token && !user)) {
    return <LoadingSpinner />;
  }

  if (user && user.role === 'admin') {
    return children;
  }

  return <Navigate to="/" />;
};

export default AdminRoute;
