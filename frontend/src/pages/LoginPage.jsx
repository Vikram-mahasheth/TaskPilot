import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const api = useApi();
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            if (res.success) {
                login(res.user, res.token);
                toast.success('Logged in successfully!');
                navigate('/');
            }
        } catch (error) {
            toast.error(error.message || "An error occurred during login.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <h1 className="text-2xl font-bold text-center">Login to your account</h1>
              <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                      <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
                      <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                  </div>
                  <div>
                      <label htmlFor="password" className="block text-sm font-medium">Password</label>
                      <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-2 px-4 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                      {loading ? 'Logging in...' : 'Login'}
                  </button>
              </form>
              <p className="text-center text-sm">
                  Don't have an account? <Link to="/register" className="text-indigo-600 hover:underline dark:text-indigo-400">Register here</Link>
              </p>
          </div>
      </div>
    );
};

export default LoginPage;