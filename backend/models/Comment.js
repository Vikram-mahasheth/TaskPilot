import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    text: { type: String, required: [true, 'Comment text is required'] },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
