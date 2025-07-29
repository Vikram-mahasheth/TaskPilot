import { useEffect, useState, useCallback, memo } from 'react';
import useApi from '../hooks/useApi';
import toast from 'react-hot-toast';
import SkeletonLoader from '../components/SkeletonLoader';
import { Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userToDelete, setUserToDelete] = useState(null);
    const api = useApi();

    const fetchUsers = useCallback(async () => {
        try {
            const res = await api.get('/users');
            if (res.success) {
                setUsers(res.data);
            }
        } catch (error) {
            toast.error("Failed to fetch users.");
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleRoleChange = async (userId, role) => {
        try {
            const res = await api.put(`/users/${userId}/role`, { role });
            if (res.success) {
                setUsers(prevUsers => prevUsers.map(u => u._id === userId ? res.data : u));
                toast.success("User role updated!");
            }
        } catch (error) {
            toast.error("Failed to update user role.");
        }
    };
    
    const handleDeleteUser = async (userId) => {
        try {
            const res = await api.delete(`/users/${userId}`);
            if (res.success) {
                setUsers(prev => prev.filter(u => u._id !== userId));
                toast.success(res.message);
            }
        } catch (error) {
            toast.error(`Failed to delete user: ${error.message}`);
        } finally {
            setUserToDelete(null); // Close modal
        }
    };

    if (loading) return <SkeletonLoader count={5} />;

    return (
        <>
            <h1 className="text-2xl font-bold mb-4">Admin Panel - User Management</h1>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map(user => (
                            <tr key={user._id}>
                                <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select 
                                        value={user.role} 
                                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                        className="p-1 border rounded-md bg-transparent dark:bg-gray-800"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button onClick={() => setUserToDelete(user)} className="text-red-500 hover:text-red-700">
                                        <Trash2 size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {userToDelete && (
                <ConfirmModal
                    isOpen={!!userToDelete}
                    onClose={() => setUserToDelete(null)}
                    onConfirm={() => handleDeleteUser(userToDelete._id)}
                    title="Delete User"
                    message={`Are you sure you want to permanently delete ${userToDelete.name}? This action cannot be undone.`}
                />
            )}
        </>
    );
};

export default memo(AdminPage);