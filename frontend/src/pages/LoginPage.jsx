import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import useApi from '../hooks/useApi';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const api = useApi();

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
            login(data.user, data.token);
            toast.success('Logged in successfully!');
            // Redirect based on role
            if (data.user.role === 'admin') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }
        } catch (error) {
            toast.error(`Login failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center">Login</h2>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div><label htmlFor="email">Email</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700" /></div>
                    <div><label htmlFor="password">Password</label><input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-700" /></div>
                    <div><button type="submit" disabled={loading} className="w-full py-2 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">{loading ? 'Logging in...' : 'Login'}</button></div>
                </form>
                <p className="text-center text-sm">No account? <Link to="/register" className="font-medium text-indigo-600 hover:underline">Register</Link></p>
            </div>
        </div>
    );
};
export default LoginPage;