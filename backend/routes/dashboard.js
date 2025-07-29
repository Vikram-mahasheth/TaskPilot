import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/stats', protect, admin, async (req, res, next) => {
    try {
        const totalTickets = await Ticket.countDocuments();
        const totalUsers = await User.countDocuments();
        const ticketsByStatus = await Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
        const recentTickets = await Ticket.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name');
        res.status(200).json({
            success: true,
            data: { totalTickets, totalUsers, ticketsByStatus, recentTickets },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
