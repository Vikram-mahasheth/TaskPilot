import { useEffect, useState, useContext } from 'react';
import useApi from '../hooks/useApi';
import { AuthContext } from '../context/AuthContext';
import SkeletonLoader from '../components/SkeletonLoader';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const api = useApi();
    const { user: currentUser } = useContext(AuthContext);

    useEffect(() => {
        const fetchUsers = async () => {
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
        };
        fetchUsers();
    }, [api]);

    const handleRoleChange = async (userId, newRole) => {
        try {
            const res = await api.put(`/users/${userId}/role`, { role: newRole });
            if (res.success) {
                setUsers(users.map(u => (u._id === userId ? res.data : u)));
                toast.success("User role updated successfully.");
            }
        } catch (error) {
            toast.error("Failed to update user role.");
        }
    };
    
    const openDeleteModal = (user) => {
        setUserToDelete(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/users/${userToDelete._id}`);
            setUsers(users.filter(u => u._id !== userToDelete._id));
            toast.success("User deleted successfully.");
        } catch (error) {
            toast.error("Failed to delete user.");
        } finally {
            setIsModalOpen(false);
            setUserToDelete(null);
        }
    };

    if (loading) {
        return <SkeletonLoader type="table" count={5} />;
    }

    return (
        <>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <div className="p-4 border-b dark:border-gray-700">
                    <h1 className="text-2xl font-bold">Admin Panel - User Management</h1>
                </div>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                            <tr key={user._id}>
                                <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                        disabled={user._id === currentUser.id}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => openDeleteModal(user)}
                                        disabled={user._id === currentUser.id}
                                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleDeleteUser}
                title="Delete User"
                message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
            />
        </>
    );
};

export default AdminPage;