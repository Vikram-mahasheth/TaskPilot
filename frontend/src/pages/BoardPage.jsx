import { useState, useEffect, useCallback, memo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import SkeletonLoader from '../components/SkeletonLoader';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const BoardPage = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [columns, setColumns] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [newTicketData, setNewTicketData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        type: 'Task',
        dueDate: ''
    });

    const api = useApi();
    const navigate = useNavigate();

    const fetchTickets = useCallback(async () => {
        try {
            const res = await api.get('/tickets');
            if (res.success) {
                setTickets(res.data);
                const newColumns = {
                    'Open': { id: 'Open', title: 'To Do', ticketIds: [] },
                    'In Progress': { id: 'In Progress', title: 'In Progress', ticketIds: [] },
                    'Resolved': { id: 'Resolved', title: 'Done', ticketIds: [] },
                };
                res.data.forEach(ticket => {
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
    }, [api]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }
        
        const originalColumns = { ...columns };
        
        const start = originalColumns[source.droppableId];
        const finish = originalColumns[destination.droppableId];
        
        const startTicketIds = Array.from(start.ticketIds);
        startTicketIds.splice(source.index, 1);
        const newStart = { ...start, ticketIds: startTicketIds };
        
        const finishTicketIds = Array.from(finish.ticketIds);
        finishTicketIds.splice(destination.index, 0, draggableId);
        const newFinish = { ...finish, ticketIds: finishTicketIds };

        // Optimistic UI Update
        setColumns({ ...columns, [newStart.id]: newStart, [newFinish.id]: newFinish });

        try {
            await api.put(`/tickets/${draggableId}`, { status: finish.id });
            toast.success("Ticket status updated.");
        } catch (error) {
            setColumns(originalColumns); // Revert UI on failure
            toast.error("Failed to update ticket status.");
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!newTicketData.title) {
            return toast.error("Title is required.");
        }
        try {
            const payload = { ...newTicketData, dueDate: newTicketData.dueDate || null };
            const res = await api.post('/tickets', payload);
            
            if (res.success) {
                toast.success("Ticket created!");
                
                // ** PERFORMANCE FIX: Update state locally instead of re-fetching **
                const newTicket = res.data;
                setTickets(prevTickets => [...prevTickets, newTicket]);
                setColumns(prevColumns => {
                    const newCols = { ...prevColumns };
                    newCols.Open.ticketIds.push(newTicket._id);
                    return newCols;
                });
                
                setIsModalOpen(false);
                setNewTicketData({ title: '', description: '', priority: 'Medium', type: 'Task', dueDate: '' });
            }
        } catch (error) {
            toast.error(`Failed to create ticket: ${error.message}`);
        }
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTicketData(prev => ({ ...prev, [name]: value }));
    };

    if (loading || !columns) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SkeletonLoader count={2} />
                <SkeletonLoader count={3} />
                <SkeletonLoader count={1} />
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Ticket Board</h1>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                    <Plus size={18} /> New Ticket
                </button>
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {Object.values(columns).map(column => (
                        <div key={column.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                            <h2 className="font-bold text-lg mb-4 text-center">{column.title}</h2>
                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`min-h-[200px] transition-colors duration-200 rounded-lg p-2 ${snapshot.isDraggingOver ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}`}
                                    >
                                        {column.ticketIds.map((ticketId, index) => {
                                            const ticket = tickets.find(t => t._id === ticketId);
                                            if (!ticket) return null;
                                            return (
                                                <Draggable key={ticket._id} draggableId={ticket._id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => navigate(`/tickets/${ticket._id}`)}
                                                            className="bg-white dark:bg-gray-700 p-4 mb-3 rounded-lg shadow cursor-pointer hover:shadow-lg"
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

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Create New Ticket</h2>
                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
                                <input name="title" type="text" id="title" value={newTicketData.title} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required />
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                                <textarea name="description" id="description" rows="4" value={newTicketData.description} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium mb-1">Priority</label>
                                    <select name="priority" id="priority" value={newTicketData.priority} onChange={handleInputChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                        <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium mb-1">Type</label>
                                    <select name="type" id="type" value={newTicketData.type} onChange={handleInputChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                        <option>Task</option><option>Bug</option><option>Feature</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="dueDate" className="block text-sm font-medium mb-1">Due Date</label>
                                <input name="dueDate" id="dueDate" type="date" value={newTicketData.dueDate} onChange={handleInputChange} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div className="flex justify-end gap-4 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Create Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

// Wrap component in memo to prevent re-renders
export default memo(BoardPage);