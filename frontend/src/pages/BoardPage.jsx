import { useState, useEffect, useCallback, useContext } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import toast from 'react-hot-toast';
import { PlusCircle, Search } from 'lucide-react';
import { SkeletonColumn } from '../components/SkeletonLoader';
import { AuthContext } from '../context/AuthContext';

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};

const PriorityIndicator = ({ priority }) => {
    const config = { 'Critical': 'bg-red-500', 'High': 'bg-orange-500', 'Medium': 'bg-yellow-500', 'Low': 'bg-green-500' };
    return <span className={`w-3 h-3 rounded-full ${config[priority] || 'bg-gray-400'}`} title={`Priority: ${priority}`}></span>;
};

const BoardPage = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ q: '', status: '', priority: '', type: '', assignee: '' });
    const [users, setUsers] = useState([]);
    const debouncedSearchTerm = useDebounce(filters.q, 500);
    const api = useApi();
    const { user } = useContext(AuthContext);

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearchTerm) params.append('q', debouncedSearchTerm);
            Object.keys(filters).forEach(key => { if (key !== 'q' && filters[key]) params.append(key, filters[key]); });
            const res = await api(`/tickets?${params.toString()}`);
            setTickets(res.data);
        } catch (error) {
            toast.error(`Failed to fetch tickets: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [api, debouncedSearchTerm, filters]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);
    
    useEffect(() => {
      if (user.role === 'admin') {
        const fetchUsers = async () => {
          try {
            const res = await api('/users');
            setUsers(res.data);
          } catch (error) { toast.error('Could not fetch users for filter.'); }
        };
        fetchUsers();
      }
    }, [api, user.role]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({...prev, [name]: value}));
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
        
        const newStatus = destination.droppableId;
        const originalTickets = [...tickets];
        setTickets(prev => prev.map(t => t._id === draggableId ? { ...t, status: newStatus } : t));

        try {
            await api(`/tickets/${draggableId}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
            toast.success(`Ticket moved to "${newStatus}"`);
        } catch (error) {
            setTickets(originalTickets);
            toast.error(`Failed to move ticket: ${error.message}`);
        }
    };
    
    const columns = {
        'Open': tickets.filter(t => t.status === 'Open'),
        'In Progress': tickets.filter(t => t.status === 'In Progress'),
        'Resolved': tickets.filter(t => t.status === 'Resolved'),
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h1 className="text-3xl font-bold">Ticket Board</h1>
                <Link to="/tickets/new" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"><PlusCircle size={20} /> New Ticket</Link>
            </div>
            
            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="relative col-span-1 lg:col-span-2">
                        <input type="text" name="q" placeholder="Search..." value={filters.q} onChange={handleFilterChange} className="w-full p-2 pl-10 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="">All Statuses</option><option>Open</option><option>In Progress</option><option>Resolved</option></select>
                    <select name="priority" value={filters.priority} onChange={handleFilterChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="">All Priorities</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select>
                     {user.role === 'admin' && <select name="assignee" value={filters.assignee} onChange={handleFilterChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="">All Assignees</option><option value="unassigned">Unassigned</option>{users.map(u => <option key={u._id} value={u._id}>{u && u.name ? u.name : "Unknown"}</option>)}</select>}
                </div>
            </div>

            {loading ? ( <div className="flex flex-col md:flex-row gap-4"><SkeletonColumn /><SkeletonColumn /><SkeletonColumn /></div> ) 
            : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex flex-col md:flex-row gap-4">
                        {Object.entries(columns).map(([columnId, columnTickets]) => (
                            <Droppable droppableId={columnId} key={columnId}>
                                {(provided, snapshot) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps} className={`bg-gray-200 dark:bg-gray-800 rounded-lg p-4 w-full md:w-1/3 ${snapshot.isDraggingOver ? 'bg-indigo-100 dark:bg-indigo-900' : ''}`}>
                                        <h2 className="text-xl font-semibold mb-4">{columnId} ({columnTickets.length})</h2>
                                        <div className="space-y-2 min-h-[400px]">
                                            {columnTickets.map((ticket, index) => (
                                                <Draggable key={ticket._id} draggableId={ticket._id} index={index}>
                                                    {(provided) => (
                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="group p-4 bg-white dark:bg-gray-700 rounded-lg shadow">
                                                            <Link to={`/tickets/${ticket._id}`}>
                                                                <div className="flex items-center gap-2 mb-1"><PriorityIndicator priority={ticket.priority} /><h3 className="font-bold flex-1">{ticket.title}</h3></div>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.assignee ? `To: ${ticket.assignee && ticket.assignee.name ? ticket.assignee.name : "Unknown"}` : `By: ${ticket.createdBy && ticket.createdBy.name ? ticket.createdBy.name : "Unknown"}`}</p>
                                                            </Link>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        ))}
                    </div>
                </DragDropContext>
            )}
        </div>
    );
};
export default BoardPage;