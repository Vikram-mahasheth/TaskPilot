import { useEffect, useState, useCallback, memo } from 'react';
import useApi from '../hooks/useApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SkeletonLoader from '../components/SkeletonLoader';
import { Ticket, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const api = useApi();

    const fetchStats = useCallback(async () => {
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
    }, [api]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading || !stats) {
        return (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SkeletonLoader count={1} />
                <SkeletonLoader count={1} />
                <SkeletonLoader count={1} />
            </div>
        );
    }

    const chartData = stats.ticketsByStatus.map(item => ({
        name: item._id,
        tickets: item.count
    }));

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full"><Ticket className="text-blue-500" /></div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Total Tickets</p>
                        <p className="text-2xl font-bold">{stats.totalTickets}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center gap-4">
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full"><Users className="text-green-500" /></div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Total Users</p>
                        <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center gap-4">
                    <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full"><Clock className="text-yellow-500" /></div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">Open Tickets</p>
                        <p className="text-2xl font-bold">{chartData.find(d => d.name === 'Open')?.tickets || 0}</p>
                    </div>
                </div>
            </div>

            {/* Charts and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Tickets by Status</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false}/>
                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                            <Legend />
                            <Bar dataKey="tickets" fill="#4f46e5" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Recent Tickets</h2>
                    <ul className="space-y-3">
                        {stats.recentTickets.map(ticket => (
                            <li key={ticket._id} className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{ticket.title}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Created by {ticket.createdBy.name}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${ticket.status === 'Open' ? 'bg-red-200 text-red-800' : ticket.status === 'In Progress' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>{ticket.status}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

// Wrap component in memo to prevent re-renders
export default memo(DashboardPage);