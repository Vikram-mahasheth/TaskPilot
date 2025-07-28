import { useState, useEffect, useContext } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import SkeletonLoader from '../components/SkeletonLoader';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const BoardPage = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [columns, setColumns] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTicketData, setNewTicketData] = useState({ title: '', description: '' });
    const api = useApi();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const res = await api.get('/tickets');
                if (res.success) {
                    setTickets(res.data);
                    // Organize tickets into columns
                    const newColumns = {
                        'Open': { id: 'Open', title: 'To Do', ticketIds: [] },
                        'In Progress': { id: 'In Progress', title: 'In Progress', ticketIds: [] },
                        'Resolved': { id: 'Resolved', title: 'Done', ticketIds: [] },
                    };
                    res.data.forEach(ticket => {
                        if(newColumns[ticket.status]) {
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
        };
        fetchTickets();
    }, [api]);

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const start = columns[source.droppableId];
        const finish = columns[destination.droppableId];

        if (start === finish) {
            // Reordering in the same column
            const newTicketIds = Array.from(start.ticketIds);
            newTicketIds.splice(source.index, 1);
            newTicketIds.splice(destination.index, 0, draggableId);

            const newColumn = { ...start, ticketIds: newTicketIds };
            setColumns({ ...columns, [newColumn.id]: newColumn });
            return;
        }

        // Moving from one list to another
        const startTicketIds = Array.from(start.ticketIds);
        startTicketIds.splice(source.index, 1);
        const newStart = { ...start, ticketIds: startTicketIds };

        const finishTicketIds = Array.from(finish.ticketIds);
        finishTicketIds.splice(destination.index, 0, draggableId);
        const newFinish = { ...finish, ticketIds: finishTicketIds };

        setColumns({ ...columns, [newStart.id]: newStart, [newFinish.id]: newFinish });

        // API call to update ticket status
        try {
            await api.put(`/tickets/${draggableId}`, { status: finish.id });
            toast.success("Ticket status updated.");
        } catch (error) {
            // Revert UI on failure
            setColumns({ ...columns, [start.id]: start, [finish.id]: finish });
            toast.error("Failed to update ticket status.");
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!newTicketData.title) {
            return toast.error("Title is required.");
        }
        try {
            const res = await api.post('/tickets', newTicketData);
            if (res.success) {
                toast.success("Ticket created!");
                // Add to UI
                setTickets([...tickets, res.data]);
                const newColumns = { ...columns };
                newColumns['Open'].ticketIds.push(res.data._id);
                setColumns(newColumns);
                setIsModalOpen(false);
                setNewTicketData({ title: '', description: '' });
            }
        } catch (error) {
            toast.error("Failed to create ticket.");
        }
    };

    if (loading) {
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
                                            if (!ticket) return null; // Safety check
                                            return (
                                                <Draggable key={ticket._id} draggableId={ticket._id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => navigate(`/tickets/${ticket._id}`)}
                                                            className={`bg-white dark:bg-gray-700 p-4 mb-3 rounded-lg shadow cursor-pointer hover:shadow-lg ${snapshot.isDragging ? 'shadow-xl' : ''}`}
                                                        >
                                                            <h3 className="font-semibold">{ticket.title}</h3>
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

            {/* New Ticket Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Create New Ticket</h2>
                        <form onSubmit={handleCreateTicket}>
                            <div className="mb-4">
                                <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    type="text"
                                    id="title"
                                    value={newTicketData.title}
                                    onChange={(e) => setNewTicketData({ ...newTicketData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    id="description"
                                    rows="4"
                                    value={newTicketData.description}
                                    onChange={(e) => setNewTicketData({ ...newTicketData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};