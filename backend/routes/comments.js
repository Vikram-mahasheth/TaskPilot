import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Comment from '../models/Comment.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router({ mergeParams: true });

router.post('/', protect, async (req, res, next) => {
    const { text } = req.body;
    const { ticketId } = req.params;
    try {
        const ticket = await Ticket.findById(ticketId).populate('createdBy');
        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }
        const comment = await Comment.create({ text, author: req.user.id, ticket: ticketId });
        const populatedComment = await Comment.findById(comment._id).populate('author', 'name email');
        
        const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
        const mentionedEmails = text.match(mentionRegex)?.map(e => e.substring(1));
        
        if (mentionedEmails) {
            const mentionedUsers = await User.find({ email: { $in: mentionedEmails } });
            mentionedUsers.forEach(async (mentionedUser) => {
                if (mentionedUser._id.toString() !== req.user.id) {
                    await Notification.create({
                        user: mentionedUser._id,
                        message: `${req.user.name} mentioned you in a comment on ticket "${ticket.title}"`,
                        link: `/tickets/${ticketId}`
                    });
                    await sendEmail({ to: mentionedUser.email, subject: `You were mentioned in ticket #${ticket._id}`, text: `${req.user.name} wrote: "${text}"` });
                }
            });
        }
        
        res.status(201).json({ success: true, data: populatedComment });
    } catch (error) {
        next(error);
    }
});

router.get('/', protect, async (req, res, next) => {
    try {
        const comments = await Comment.find({ ticket: req.params.ticketId }).populate('author', 'name email');
        res.status(200).json({ success: true, count: comments.length, data: comments });
    } catch (error) {
        next(error);
    }
});

export default router;
