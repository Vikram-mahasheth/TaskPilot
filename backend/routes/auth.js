import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../config/logger.js';

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

router.post('/register', async (req, res, next) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }
        
        const isFirstAccount = (await User.countDocuments({})) === 0;
        const role = isFirstAccount ? 'admin' : 'user';

        const user = await User.create({ name, email, password, role });
        
        const token = generateToken(user._id);
        logger.info(`New user registered: ${user.email} with role: ${user.role}`);

        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');
        if (user && (await user.matchPassword(password))) {
            const token = generateToken(user._id);
            logger.info(`User logged in: ${user.email}`);
            res.json({
                success: true,
                token,
                user: { id: user._id, name: user.name, email: user.email, role: user.role },
            });
        } else {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (error) {
        next(error);
    }
});

export default router;
