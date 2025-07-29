import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import Notification from '../models/Notification.js';

const router = express.Router();

router.get('/', protect, admin, async (req, res, next) => {
    try {
        const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20);
        res.status(200).json({ success: true, data: notifications });
    } catch (error) { next(error); }
});

router.put('/:id/read', protect, admin, async (req, res, next) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.status(200).json({ success: true });
    } catch (error) { next(error); }
});

router.post('/read-all', protect, admin, async (req, res, next) => {
    try {
        await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
        res.status(200).json({ success: true });
    } catch (error) { next(error); }
});

export default router;