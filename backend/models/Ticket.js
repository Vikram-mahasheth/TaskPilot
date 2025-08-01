import mongoose from 'mongoose';
import Comment from './Comment.js';

const historySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    field: { type: String },
    oldValue: { type: String },
    newValue: { type: String },
    timestamp: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
    title: { type: String, required: [true, 'Please add a title'], trim: true },
    description: { type: String, required: [true, 'Please add a description'] },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    type: { type: String, enum: ['Bug', 'Feature', 'Task'], default: 'Task' },
    dueDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    attachments: [{ filename: String, path: String, originalName: String }],
    history: [historySchema],
}, { timestamps: true });

ticketSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    await Comment.deleteMany({ ticket: this._id });
    next();
});

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;