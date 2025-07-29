import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

const router = express.Router();

router.get('/', protect, admin, async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json({ success: true, data: users });
    } catch (error) { next(error); }
});

router.put('/:id/role', protect, admin, async (req, res, next) => {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, error: 'Invalid role' });
    }
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        user.role = role;
        await user.save();
        logger.info(`User role updated for ${user.email} to ${role} by ${req.user.email}`);
        res.status(200).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) { next(error); }
});

router.delete('/:id', protect, admin, async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        await user.deleteOne();
        logger.warn(`User deleted: ${user.email} by ${req.user.email}`);
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) { next(error); }
});

export default router;
