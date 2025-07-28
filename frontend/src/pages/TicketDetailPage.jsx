// FILE: frontend/src/pages/TicketDetailPage.jsx

import { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Paperclip, Send, Trash2, User, Calendar, Tag, Info, ArrowLeft, Flag, Star } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const TicketDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const api = useApi();
    const { user, token } = useContext(AuthContext); // Get token for file upload
    
    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [formState, setFormState] = useState({ status: '', priority: '', type: '', assignee: '', dueDate: '' });
    
    const fetchTicketDetails = useCallback(async () => {
        try {
            const ticketRes = await api.get(`/tickets/${id}`);
            if (ticketRes.success) {
                const ticketData = ticketRes.data;
                setTicket(ticketData);
                setFormState({
                    status: ticketData.status || 'Open',
                    priority: ticketData.priority || 'Medium',
                    type: ticketData.type || 'Task',
                    assignee: ticketData.assignee?._id || '',
                    dueDate: ticketData.dueDate ? new Date(ticketData.dueDate).toISOString().split('T')[0] : ''
                });

                const commentsRes = await api.get(`/tickets/${id}/comments`);
                if(commentsRes.success) {
                    setComments(commentsRes.data);
                }

                if (user?.role === 'admin') {
                    const usersRes = await api.get('/users');
                    if(usersRes.success) {
                        setUsers(usersRes.data);
                    }
                }
            }
        } catch (error) {
            toast.error(`Failed to fetch ticket details: ${error.message}`);
            navigate('/');
        } finally {
            setLoading(false);
        }
    }, [id, api, navigate, user?.role]);

    useEffect(() => {
        fetchTicketDetails();
    }, [fetchTicketDetails]);
    
    const handleFieldChange = async (fieldName, value) => {
        const originalFormState = { ...formState };
        setFormState(prev => ({...prev, [fieldName]: value}));
        try {
            const body = fieldName === 'assignee' ? { userId: value } : { [fieldName]: value };
            const apiPath = fieldName === 'assignee' ? `/tickets/${id}/assign` : `/tickets/${id}`;
            const res = await api.put(apiPath, body);
            if (res.success) {
                setTicket(res.data);
                toast.success(`Ticket ${fieldName} updated!`);
            }
        } catch (error) {
            setFormState(originalFormState);
            toast.error(`Failed to update ${fieldName}: ${error.message}`);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const res = await api.post(`/tickets/${id}/comments`, { text: newComment });
            if (res.success) {
                setComments([...comments, res.data]);
                setNewComment('');
                toast.success('Comment added!');
            }
        } catch (error) {
            toast.error(`Failed to add comment: ${error.message}`);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('attachment', file);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/tickets/${id}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }
            
            setTicket(prev => ({ ...prev, attachments: [...prev.attachments, data.data] }));
            toast.success('File uploaded!');
            e.target.value = null; // Reset file input
        } catch (error) {
            toast.error(`File upload failed: ${error.message}`);
        }
    };
    
    const handleDeleteTicket = async () => {
        if (window.confirm('Are you sure you want to delete this ticket permanently?')) {
            try {
                await api.delete(`/tickets/${id}`);
                toast.success('Ticket deleted successfully');
                navigate('/');
            } catch (error) {
                toast.error(`Failed to delete ticket: ${error.message}`);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <LoadingSpinner />
            </div>
        );
    }
    
    if (!ticket) {
        return <div className="text-center">Ticket not found. It may have been deleted.</div>;
    }

    return (
        <div>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400 hover:underline">
                <ArrowLeft size={18} /> Back to Board
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Ticket Details */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-start">
                          <h1 className="text-3xl font-bold mb-2">{ticket.title}</h1>
                           {user?.role === 'admin' && (
                                <button onClick={handleDeleteTicket} className="text-red-500 hover:text-red-700 p-2 rounded-full transition-colors">
                                    <Trash2 size={20} />
                                </button>
                           )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
                    </div>

                    {/* Attachments */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Paperclip /> Attachments</h2>
                        <div className="space-y-2">
                            {ticket.attachments?.map(att => (
                                <a key={att.filename} href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/${att.path}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline block truncate">
                                    {att.originalName}
                                </a>
                            ))}
                        </div>
                        <div className="mt-4">
                            <label htmlFor="file-upload" className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                <span>+ Upload File</span>
                                <input id="file-upload" type="file" className="sr-only" onChange={handleFileUpload}/>
                            </label>
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Comments</h2>
                        <div className="space-y-4 mb-6">
                            {comments.map(c => (
                                <div key={c._id} className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold flex-shrink-0">
                                        {c.author?.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{c.author?.name || 'Unknown User'}</p>
                                        <p className="text-sm text-gray-500">{new Date(c.createdAt).toLocaleString()}</p>
                                        <p className="mt-1 whitespace-pre-wrap">{c.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleCommentSubmit} className="flex gap-2">
                            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment... @email to mention" className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            <button type="submit" className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Actions */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                         <h2 className="text-xl font-semibold mb-4">Actions</h2>
                         <div className="space-y-3">
                            <div><label className="text-sm font-medium">Status</label><select onChange={(e) => handleFieldChange('status', e.target.value)} value={formState.status} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option>Open</option><option>In Progress</option><option>Resolved</option></select></div>
                            <div><label className="text-sm font-medium">Priority</label><select onChange={(e) => handleFieldChange('priority', e.target.value)} value={formState.priority} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
                            <div><label className="text-sm font-medium">Type</label><select onChange={(e) => handleFieldChange('type', e.target.value)} value={formState.type} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option>Bug</option><option>Feature</option><option>Task</option></select></div>
                            {user?.role === 'admin' && <div><label className="text-sm font-medium">Assignee</label><select onChange={(e) => handleFieldChange('assignee', e.target.value)} value={formState.assignee} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="">Unassigned</option>{users.map(u => <option key={u._id} value={u._id}>{u.name || "Unknown"}</option>)}</select></div>}
                            <div><label htmlFor="dueDate" className="text-sm font-medium">Due Date</label><input type="date" id="dueDate" value={formState.dueDate} onChange={(e) => handleFieldChange('dueDate', e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
                         </div>
                    </div>

                    {/* Details */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Info /> Details</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="font-semibold text-gray-500 flex items-center gap-1"><Flag /> Priority</span><span>{ticket.priority}</span></div>
                            <div className="flex justify-between"><span className="font-semibold text-gray-500 flex items-center gap-1"><Star /> Type</span><span>{ticket.type}</span></div>
                            <div className="flex justify-between"><span className="font-semibold text-gray-500 flex items-center gap-1"><User /> Assignee</span><span>{ticket.assignee?.name || 'Unassigned'}</span></div>
                            <div className="flex justify-between"><span className="font-semibold text-gray-500 flex items-center gap-1"><Calendar /> Due</span><span>{ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="font-semibold text-gray-500 flex items-center gap-1"><User /> Creator</span><span>{ticket.createdBy?.name}</span></div>
                            <div className="flex justify-between"><span className="font-semibold text-gray-500 flex items-center gap-1"><Calendar /> Created</span><span>{new Date(ticket.createdAt).toLocaleDateString()}</span></div>
                        </div>
                    </div>
                    
                    {/* History */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">History</h2>
                        <ul className="space-y-3 text-sm max-h-60 overflow-y-auto">
                            {ticket.history?.slice().reverse().map(item => (
                                <li key={item._id} className="border-l-2 pl-3 dark:border-gray-700">
                                    <p><strong>{item.action}</strong> by {item.user?.name || 'System'}</p>
                                    {item.field && <p className="text-gray-500">"{item.oldValue}" → "{item.newValue}"</p>}
                                    <p className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetailPage;
