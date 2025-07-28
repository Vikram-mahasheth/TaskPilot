import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String }, // e.g., /tickets/ticketId
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
