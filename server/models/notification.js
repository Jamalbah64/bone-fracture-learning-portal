// Need comments here

import mongoose from 'mongoose';
const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    message: String,
    type: { type: String, enum: ['info', 'assignment', 'exam'], default: 'info' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});
export default mongoose.model('Notification', notificationSchema);
