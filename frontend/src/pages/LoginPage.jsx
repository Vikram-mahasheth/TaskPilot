import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import toast from 'react-hot-toast';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const api = useApi();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            if (res.success) {
                login(res.user, res.token);
                toast.success('Logged in successfully!');
                navigate(from, { replace: true });
            }
        } catch (error) {
            toast.error(error.message || 'An error occurred');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <h1 className="text-2xl font-bold text-center">Login to your account</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium">Email address</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium">Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <button type="submit" className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Login</button>
                </form>
                <p className="text-sm text-center">
                    Don't have an account? <Link to="/register" className="font-medium text-indigo-600 hover:underline">Register here</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;