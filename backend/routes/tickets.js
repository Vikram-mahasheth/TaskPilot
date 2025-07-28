// --- FILE: backend/routes/tickets.js ---
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
const upload = multer({ storage, limits: { fileSize: 1024 * 1024 * 5 } });

router.get('/', protect, async (req, res, next) => {
    try {
        let query = req.user.role === 'admin' ? {} : { $or: [{ createdBy: req.user.id }, { assignee: req.user.id }] };
        if (req.query.q) { query.$text = { $search: req.query.q }; }
        const filters = ['status', 'priority', 'type', 'assignee'];
        filters.forEach(filter => {
            if (req.query[filter]) {
                if (filter === 'assignee' && req.query[filter] === 'unassigned') { query.assignee = null; }
                else { query[filter] = req.query[filter]; }
            }
        });
        const tickets = await Ticket.find(query).populate('createdBy', 'name email').populate('assignee', 'name email').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: tickets.length, data: tickets });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', protect, async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate('createdBy', 'name email').populate('assignee', 'name email').populate('history.user', 'name');
        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }
        if (req.user.role !== 'admin' && ticket.createdBy._id.toString() !== req.user.id && (!ticket.assignee || ticket.assignee._id.toString() !== req.user.id) ) {
            return res.status(403).json({ success: false, error: 'Not authorized to view this ticket' });
        }
        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        next(error);
    }
});

router.post('/', protect, async (req, res, next) => {
    try {
        const { title, description, priority, type, dueDate } = req.body;
        const ticket = await Ticket.create({ title, description, priority, type, dueDate, createdBy: req.user.id, history: [{ user: req.user.id, action: 'Ticket Created' }] });
        logger.info(`Ticket created: ${ticket._id} by ${req.user.email}`);
        res.status(201).json({ success: true, data: ticket });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', protect, async (req, res, next) => {
    try {
        let ticket = await Ticket.findById(req.params.id);
        if (!ticket) { return res.status(404).json({ success: false, error: 'Ticket not found' }); }
        
        const oldValues = { status: ticket.status, priority: ticket.priority, type: ticket.type, dueDate: ticket.dueDate };
        const updates = { title: req.body.title, description: req.body.description, status: req.body.status, priority: req.body.priority, type: req.body.type, dueDate: req.body.dueDate };
        
        for (const key in updates) {
            if (updates[key] !== undefined) {
                const oldValueString = oldValues[key] ? oldValues[key].toString() : 'Not set';
                const newValueString = updates[key] ? updates[key].toString() : 'Not set';
                if(oldValueString !== newValueString) {
                    ticket.history.push({ user: req.user.id, action: 'Field Change', field: key, oldValue: oldValues[key], newValue: updates[key] });
                }
                ticket[key] = updates[key];
            }
        }
        
        await ticket.save();
        logger.info(`Ticket updated: ${ticket._id} by ${req.user.email}`);

        if (req.body.status && req.body.status !== oldValues.status) {
            const creator = await User.findById(ticket.createdBy);
            if (creator && creator.email && creator.id.toString() !== req.user.id.toString()) {
                await sendEmail({ to: creator.email, subject: `[Phoenix] Ticket Status Updated: #${ticket._id}`, text: `Hello ${creator.name},\n\nThe status of your ticket "${ticket.title}" was updated to ${req.body.status} by ${req.user.name}.\n\nThank you.` });
                await Notification.create({ user: creator._id, message: `Status of "${ticket.title}" was updated to ${req.body.status} by ${req.user.name}`, link: `/tickets/${ticket._id}`});
            }
        }
        
        const populatedTicket = await Ticket.findById(ticket._id).populate('createdBy', 'name email').populate('assignee', 'name email').populate('history.user', 'name');
        res.status(200).json({ success: true, data: populatedTicket });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', protect, admin, async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) { return res.status(404).json({ success: false, error: 'Ticket not found' }); }
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
        if (!ticket) { return res.status(404).json({ success: false, error: 'Ticket not found' }); }
        if (!req.file) { return res.status(400).json({ success: false, error: 'Please upload a file' }); }
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
    try {
        const { userId } = req.body;
        let ticket = await Ticket.findById(req.params.id);
        if (!ticket) { return res.status(404).json({ success: false, error: 'Ticket not found' }); }
        const userToAssign = userId ? await User.findById(userId) : null;
        if (userId && !userToAssign) { return res.status(404).json({ success: false, error: 'User to assign not found' }); }
        
        const oldAssigneeId = ticket.assignee ? ticket.assignee.toString() : null;
        if (oldAssigneeId !== userId) {
            ticket.assignee = userId || null;
            ticket.history.push({ user: req.user.id, action: 'Assignment Change', oldValue: oldAssigneeId || 'None', newValue: userId || 'None' });
            await ticket.save();
            
            logger.info(`Ticket ${ticket._id} assigned to ${userToAssign ? userToAssign.email : 'Unassigned'} by ${req.user.email}`);
            
            if (userToAssign) {
                await sendEmail({ to: userToAssign.email, subject: `[Phoenix] You have been assigned ticket #${ticket._id}`, text: `Hello ${userToAssign.name},\n\nYou have been assigned the ticket "${ticket.title}" by ${req.user.name}.\n\nPlease review it.` });
                await Notification.create({ user: userToAssign._id, message: `${req.user.name} assigned you a new ticket: "${ticket.title}"`, link: `/tickets/${ticket._id}` });
            }
        }
        
        const populatedTicket = await Ticket.findById(ticket._id).populate('assignee', 'name email');
        res.status(200).json({ success: true, data: populatedTicket });
    } catch (error) {
        next(error);
    }
});

export default router;

