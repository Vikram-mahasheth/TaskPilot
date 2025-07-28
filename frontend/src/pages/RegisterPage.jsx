import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const api = useApi();
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(password.length < 6) {
            return toast.error("Password must be at least 6 characters long.");
        }
        setLoading(true);
        try {
            const res = await api.post('/auth/register', { name, email, password });
            if (res.success) {
                login(res.user, res.token);
                toast.success('Registration successful!');
                navigate('/');
            }
        } catch (error) {
            toast.error(error.message || "An error occurred during registration.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
              <h1 className="text-2xl font-bold text-center">Create a new account</h1>
              <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                      <label htmlFor="name" className="block text-sm font-medium">Name</label>
                      <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                  </div>
                  <div>
                      <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
                      <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                  </div>
                  <div>
                      <label htmlFor="password" className="block text-sm font-medium">Password</label>
                      <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-2 px-4 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                      {loading ? 'Registering...' : 'Register'}
                  </button>
              </form>
              <p className="text-center text-sm">
                  Already have an account? <Link to="/login" className="text-indigo-600 hover:underline dark:text-indigo-400">Login here</Link>
              </p>
          </div>
      </div>
    );
};

export default RegisterPage;
