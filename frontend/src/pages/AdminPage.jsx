import { useState, useEffect, useContext } from 'react';
import useApi from '../hooks/useApi';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Shield, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const api = useApi();
    const { user: currentUser } = useContext(AuthContext);

    useEffect(() => {
        if (!currentUser) return; // Wait for user to be available

        const fetchUsers = async () => {
            try {
                const res = await api('/users');
                setUsers(res.data);
            } catch (error) {
                toast.error(`Failed to fetch users: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [api, currentUser]);

    const handleRoleChange = async (userId, newRole) => {
        const originalUsers = [...users];
        const updatedUsers = users.map(u => u._id === userId ? { ...u, role: newRole } : u);
        setUsers(updatedUsers);
        try {
            await api(`/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role: newRole }) });
            toast.success('User role updated successfully.');
        } catch (error) {
            setUsers(originalUsers);
            toast.error(`Failed to update role: ${error.message}`);
        }
    };

    const openDeleteConfirm = (user) => {
        setUserToDelete(user);
        setIsConfirmOpen(true);
    };
    const closeDeleteConfirm = () => {
        setUserToDelete(null);
        setIsConfirmOpen(false);
    };
    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await api(`/users/${userToDelete._id}`, { method: 'DELETE' });
            setUsers(users.filter(u => u._id !== userToDelete._id));
            toast.success(`User ${userToDelete.name} deleted.`);
        } catch (error) {
            toast.error(`Failed to delete user: ${error.message}`);
        } finally {
            closeDeleteConfirm();
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><Shield size={32} /> Admin Panel</h1>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                            <tr key={user._id}>
                                <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select value={user.role} onChange={(e) => handleRoleChange(user._id, e.target.value)} disabled={user._id === currentUser.id} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50">
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button onClick={() => openDeleteConfirm(user)} disabled={user._id === currentUser.id} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Delete User"><Trash2 size={20} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ConfirmModal isOpen={isConfirmOpen} onClose={closeDeleteConfirm} onConfirm={handleDeleteUser} title="Delete User">
                <p>Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This action is irreversible.</p>
            </ConfirmModal>
        </div>
    );
};
export default AdminPage;