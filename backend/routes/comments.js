import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Comment from '../models/Comment.js';
import Ticket from '../models/Ticket.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const router = express.Router({ mergeParams: true });

router.post('/', protect, async (req, res, next) => {
    const { text } = req.body;
    const { ticketId } = req.params;

    try {
        const ticket = await Ticket.findById(ticketId).populate('assignee', 'email');
        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }

        const comment = await Comment.create({
            text,
            author: req.user.id,
            ticket: ticketId,
        });

        const mentionRegex = /@(\S+@\S+\.\S+)/g;
        let match;
        const mentionedEmails = new Set();
        while ((match = mentionRegex.exec(text)) !== null) {
            mentionedEmails.add(match[1]);
        }
        
        if (mentionedEmails.size > 0) {
            const mentionedUsers = await User.find({ email: { $in: [...mentionedEmails] } });
            for (const mentionedUser of mentionedUsers) {
                if (mentionedUser._id.toString() !== req.user.id) { // Don't notify self
                    await Notification.create({
                        user: mentionedUser._id,
                        message: `${req.user.name} mentioned you in a comment on ticket "${ticket.title}"`,
                        link: `/tickets/${ticketId}`
                    });
                }
            }
        }
        
        const populatedComment = await Comment.findById(comment._id).populate('author', 'name email');
        res.status(201).json({ success: true, data: populatedComment });
    } catch (error) {
        next(error);
    }
});

router.get('/', protect, async (req, res, next) => {
    try {
        const comments = await Comment.find({ ticket: req.params.ticketId }).populate('author', 'name email').sort({ createdAt: 'asc' });
        res.status(200).json({ success: true, count: comments.length, data: comments });
    } catch (error) {
        next(error);
    }
});

export default router;