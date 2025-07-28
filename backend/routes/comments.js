import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Comment from '../models/Comment.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';
import Notification from '../models/Notification.js';

const router = express.Router({ mergeParams: true });

const notifyMentionedUsers = async (text, ticket, currentUser) => {
    const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    let match;
    const mentionedEmails = new Set();
    while ((match = mentionRegex.exec(text)) !== null) {
        mentionedEmails.add(match[1]);
    }

    if (mentionedEmails.size === 0) return;
    const mentionedUsers = await User.find({ email: { $in: [...mentionedEmails] } });
    
    for (const user of mentionedUsers) {
        if (user.id.toString() !== currentUser.id.toString()) {
            await sendEmail({
                to: user.email,
                subject: `[Phoenix] You were mentioned in ticket #${ticket._id}`,
                text: `Hello ${user.name},\n\n${currentUser.name} mentioned you in a comment on the ticket "${ticket.title}".`
            });
             await Notification.create({
                user: user._id,
                message: `${currentUser.name} mentioned you in a comment on "${ticket.title}"`,
                link: `/tickets/${ticket._id}`
            });
        }
    }
};

router.post('/', protect, async (req, res, next) => {
    const { text } = req.body;
    const { ticketId } = req.params;
    try {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Ticket not found' });
        }
        const comment = await Comment.create({ text, author: req.user.id, ticket: ticketId });
        await notifyMentionedUsers(text, ticket, req.user);
        const populatedComment = await Comment.findById(comment._id).populate('author', 'name email');
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
