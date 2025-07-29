import { useState, useEffect, useCallback, memo, useContext } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { FilterContext } from '../context/FilterContext';
import SkeletonLoader from '../components/SkeletonLoader';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const BoardPage = () => {
    const [ticketsMap, setTicketsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [columns, setColumns] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const { filters, updateFilter } = useContext(FilterContext);

    const [newTicketData, setNewTicketData] = useState({
        title: '', description: '', priority: 'Medium', type: 'Task', dueDate: ''
    });

    const api = useApi();
    const navigate = useNavigate();

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: filters.search,
                status: filters.status,
                priority: filters.priority
            }).toString();
            
            const res = await api.get(`/tickets?${params}`);
            if (res.success) {
                const ticketsData = res.data;
                const newTicketsMap = ticketsData.reduce((acc, ticket) => {
                    acc[ticket._id] = ticket;
                    return acc;
                }, {});
                setTicketsMap(newTicketsMap);

                const newColumns = {
                    'Open': { id: 'Open', title: 'To Do', ticketIds: [] },
                    'In Progress': { id: 'In Progress', title: 'In Progress', ticketIds: [] },
                    'Resolved': { id: 'Resolved', title: 'Done', ticketIds: [] },
                };
                ticketsData.forEach(ticket => {
                    if (newColumns[ticket.status]) {
                        newColumns[ticket.status].ticketIds.push(ticket._id);
                    }
                });
                setColumns(newColumns);
            }
        } catch (error) {
            toast.error("Failed to fetch tickets.");
        } finally {
            setLoading(false);
        }
    }, [api, filters]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchTickets();
        }, 300); // 300ms debounce
        return () => clearTimeout(handler);
    }, [filters, fetchTickets]);

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }
        
        const originalColumns = { ...columns };
        const startCol = originalColumns[source.droppableId];
        const finishCol = originalColumns[destination.droppableId];
        
        if (startCol === finishCol) {
            const newTicketIds = Array.from(startCol.ticketIds);
            newTicketIds.splice(source.index, 1);
            newTicketIds.splice(destination.index, 0, draggableId);
            const newCol = { ...startCol, ticketIds: newTicketIds };
            setColumns({ ...columns, [newCol.id]: newCol });
        } else {
            const startTicketIds = Array.from(startCol.ticketIds);
            startTicketIds.splice(source.index, 1);
            const newStart = { ...startCol, ticketIds: startTicketIds };
            
            const finishTicketIds = Array.from(finishCol.ticketIds);
            finishTicketIds.splice(destination.index, 0, draggableId);
            const newFinish = { ...finishCol, ticketIds: finishTicketIds };

            setColumns({ ...columns, [newStart.id]: newStart, [newFinish.id]: newFinish });
        }
        
        try {
            await api.put(`/tickets/${draggableId}`, { status: finishCol.id });
            toast.success("Ticket status updated.");
        } catch (error) {
            setColumns(originalColumns);
            toast.error("Failed to update ticket status.");
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!newTicketData.title) return toast.error("Title is required.");

        try {
            const payload = { ...newTicketData, dueDate: newTicketData.dueDate || null };
            const res = await api.post('/tickets', payload);
            
            if (res.success) {
                toast.success("Ticket created!");
                const newTicket = res.data;
                setTicketsMap(prevMap => ({ ...prevMap, [newTicket._id]: newTicket }));
                setColumns(prevColumns => {
                    const newCols = { ...prevColumns };
                    newCols.Open.ticketIds.unshift(newTicket._id);
                    return newCols;
                });
                setIsModalOpen(false);
                setNewTicketData({ title: '', description: '', priority: 'Medium', type: 'Task', dueDate: '' });
            }
        } catch (error) { toast.error(`Failed to create ticket: ${error.message}`); }
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTicketData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Search tickets..." value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} className="w-full sm:w-64 pl-10 pr-4 py-2 border rounded-md dark:bg-gray-700" />
                </div>
                <div className="flex gap-2">
                    <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className="p-2 border rounded-md dark:bg-gray-700">
                        <option value="">All Statuses</option><option>Open</option><option>In Progress</option><option>Resolved</option>
                    </select>
                    <select value={filters.priority} onChange={(e) => updateFilter('priority', e.target.value)} className="p-2 border rounded-md dark:bg-gray-700">
                        <option value="">All Priorities</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                    </select>
                </div>
                <button onClick={() => navigate('/tickets/new')} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 w-full sm:w-auto justify-center">
                    <Plus size={18} /> New Ticket
                </button>
            </div>
            
            {loading ? (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SkeletonLoader count={2} />
                    <SkeletonLoader count={3} />
                    <SkeletonLoader count={1} />
                </div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {Object.values(columns || {}).map(column => (
                            <div key={column.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                                <h2 className="font-bold text-lg mb-4 text-center">{column.title}</h2>
                                <Droppable droppableId={column.id}>
                                    {(provided, snapshot) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className={`min-h-[200px] transition-colors duration-200 rounded-lg p-2 ${snapshot.isDraggingOver ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}`}>
                                            {column.ticketIds.map((ticketId, index) => {
                                                const ticket = ticketsMap[ticketId];
                                                if (!ticket) return null;
                                                return (
                                                    <Draggable key={ticket._id} draggableId={ticket._id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                onClick={() => navigate(`/tickets/${ticket._id}`)}
                                                                className={`bg-white dark:bg-gray-700 p-4 mb-3 rounded-lg shadow cursor-pointer hover:shadow-lg ${snapshot.isDragging ? 'shadow-xl scale-105' : ''}`}
                                                            >
                                                                <h3 className="font-semibold">{ticket.title}</h3>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex justify-between">
                                                                    <span>{ticket.type}</span>
                                                                    <span>{ticket.priority}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            )}
        </>
    );
};

export default memo(BoardPage);