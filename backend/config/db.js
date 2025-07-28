import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false);
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error('MongoDB URI not found. Make sure MONGO_URI is set.');
        }

        const conn = await mongoose.connect(mongoUri);
        logger.info(`MongoDB Connected: ${conn.connection.host}`);

    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        logger.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;