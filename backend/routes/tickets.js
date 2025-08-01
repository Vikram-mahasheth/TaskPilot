import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import multer from 'multer';
import path from 'path';
import { sendEmail } from '../utils/email.js';
import logger from '../config/logger.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 5 } });

router.get('/', protect, async (req, res, next) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query = { $or: [{ createdBy: req.user.id }, { assignee: req.user.id }] };
        }

        if (req.query.search) {
            query.title = { $regex: req.query.search, $options: 'i' };
        }
        if (req.query.status) {
            query.status = req.query.status;
        }
        if (req.query.priority) {
            query.priority = req.query.priority;
        }
        
        const tickets = await Ticket.find(query)
            .populate('createdBy', 'name email')
            .populate('assignee', 'name email')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, count: tickets.length, data: tickets });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', protect, async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('assignee', 'name email')
            .populate('history.user', 'name');

        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }

        if (req.user.role !== 'admin' && ticket.createdBy._id.toString() !== req.user.id && ticket.assignee?._id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized to view this ticket' });
        }
        
        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        next(error);
    }
});

router.post('/', protect, async (req, res, next) => {
    const { title, description, priority, type, dueDate } = req.body;
    try {
        const ticket = await Ticket.create({
            title, description, priority, type, dueDate,
            createdBy: req.user.id,
            history: [{ user: req.user.id, action: 'Ticket Created' }]
        });
        
        logger.info(`Ticket created: ${ticket._id} by ${req.user.email}`);

        const admins = await User.find({ role: 'admin' });
        for (const adminUser of admins) {
            if (adminUser._id.toString() !== req.user.id.toString()) {
                await Notification.create({
                    user: adminUser._id,
                    message: `New ticket "${ticket.title}" created by ${req.user.name}`,
                    link: `/tickets/${ticket._id}`,
                });
            }
        }
        
        res.status(201).json({ success: true, data: ticket });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', protect, async (req, res, next) => {
    const { title, description, status, priority, type, dueDate } = req.body;
    try {
        let ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

        const oldStatus = ticket.status;
        
        ticket.title = title || ticket.title;
        ticket.description = description || ticket.description;
        ticket.status = status || ticket.status;
        ticket.priority = priority || ticket.priority;
        ticket.type = type || ticket.type;
        ticket.dueDate = dueDate || ticket.dueDate;

        if (status && status !== oldStatus) {
            ticket.history.push({ user: req.user.id, action: 'Status Change', oldValue: oldStatus, newValue: status });
        }

        await ticket.save();
        logger.info(`Ticket updated: ${ticket._id} by ${req.user.email}`);
        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', protect, admin, async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
        
        await ticket.deleteOne();
        logger.warn(`Ticket deleted: ${req.params.id} by ${req.user.email}`);
        res.status(200).json({ success: true, message: 'Ticket deleted successfully' });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/upload', protect, upload.single('attachment'), async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
        if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a file' });

        const attachment = { filename: req.file.filename, path: req.file.path, originalName: req.file.originalname };
        ticket.attachments.push(attachment);
        await ticket.save();

        logger.info(`File uploaded to ticket ${ticket._id}: ${req.file.filename}`);
        res.status(200).json({ success: true, data: attachment });
    } catch (error) {
        next(error);
    }
});

router.put('/:id/assign', protect, admin, async (req, res, next) => {
    const { userId } = req.body;
    try {
        let ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });
        
        const userToAssign = await User.findById(userId);
        if (!userToAssign && userId) return res.status(404).json({ success: false, error: 'User to assign not found' });

        ticket.assignee = userId || null;
        ticket.history.push({ user: req.user.id, action: 'Assignment Change', newValue: userToAssign ? userToAssign.name : 'Unassigned' });
        
        await ticket.save();
        logger.info(`Ticket ${ticket._id} assigned to ${userToAssign ? userToAssign.email : 'Unassigned'} by ${req.user.email}`);
        
        if (userId && userId.toString() !== req.user.id.toString()) {
            await Notification.create({
                user: userId,
                message: `You have been assigned ticket "${ticket.title}" by ${req.user.name}`,
                link: `/tickets/${ticket._id}`
            });
        }
        
        const populatedTicket = await Ticket.findById(ticket._id).populate('assignee', 'name email');
        res.status(200).json({ success: true, data: populatedTicket });
    } catch (error) {
        next(error);
    }
});

export default router;
