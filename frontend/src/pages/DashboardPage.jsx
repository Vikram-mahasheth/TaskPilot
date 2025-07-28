import { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { Ticket, Users, List, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        toast.error(`Failed to fetch dashboard stats: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [api]);

  if (loading) { return <LoadingSpinner />; }

  const chartData = stats?.ticketsByStatus.map(item => ({ name: item._id, count: item.count }));

  return (
    <div>
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><LayoutDashboard size={32}/> Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center gap-4"><div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full"><Ticket className="text-indigo-500" size={24} /></div><div><p className="text-sm text-gray-500 dark:text-gray-400">Total Tickets</p><p className="text-2xl font-bold">{stats?.totalTickets}</p></div></div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center gap-4"><div className="p-3 bg-green-100 dark:bg-green-900 rounded-full"><Users className="text-green-500" size={24} /></div><div><p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p><p className="text-2xl font-bold">{stats?.totalUsers}</p></div></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Tickets by Status</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" /><XAxis dataKey="name" className="text-xs" /><YAxis allowDecimals={false} className="text-xs" /><Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', color: '#fff', borderRadius: '0.5rem' }} /><Legend /><Bar dataKey="count" fill="#6366f1" /></BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><List /> Recent Tickets</h2>
                <ul className="space-y-4">
                    {stats?.recentTickets.map(ticket => (
                        <li key={ticket._id} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                            <Link to={`/tickets/${ticket._id}`} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">{ticket.title}</Link>
                            <p className="text-sm text-gray-500 dark:text-gray-400">By {ticket.createdBy.name}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
  );
};
export default DashboardPage;