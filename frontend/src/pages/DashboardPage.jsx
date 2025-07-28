import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useApi from '../hooks/useApi';
import toast from 'react-hot-toast';
import SkeletonLoader from '../components/SkeletonLoader';

const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const api = useApi();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                if (res.success) {
                    setStats(res.data);
                }
            } catch (error) {
                toast.error("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [api]);

    if (loading || !stats) {
        // More comprehensive skeleton loader for the dashboard
        return (
            <div className="animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-24 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
                </div>
                <div className="h-96 bg-gray-300 dark:bg-gray-700 rounded-lg mb-6"></div>
                <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            </div>
        );
    }
    
    // Safety check for ticketsByStatus
    const chartData = stats.ticketsByStatus ? stats.ticketsByStatus.map(item => ({ name: item._id, count: item.count })) : [];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Total Tickets</h3>
                    <p className="text-4xl font-bold">{stats.totalTickets || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
                    <p className="text-4xl font-bold">{stats.totalUsers || 0}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Tickets by Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: '#374151', border: 'none' }} />
                        <Legend />
                        <Bar dataKey="count" fill="#4f46e5" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Recent Tickets</h3>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {stats.recentTickets && stats.recentTickets.length > 0 ? (
                        stats.recentTickets.map(ticket => (
                            <li key={ticket._id} className="py-3">
                                <p className="font-semibold">{ticket.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Created by {ticket.createdBy?.name || 'Unknown'}</p>
                            </li>
                        ))
                    ) : <p className="text-gray-500">No recent tickets.</p>}
                </ul>
            </div>
        </div>
    );
};

export default DashboardPage;