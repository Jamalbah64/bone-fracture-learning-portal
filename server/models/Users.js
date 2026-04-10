//schema for the users collection in the database
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'radiologist', 'head_radiologist'], default: 'patient' },
    staffId: { type: String, unique: true, sparse: true, trim: true }
});
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
export default mongoose.model('Users', userSchema);
