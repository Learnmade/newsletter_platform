import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false,
    },
    role: {
        type: String,
        default: 'user', // For now, we only have admin
    },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
