import mongoose from 'mongoose';

const FollowerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // A user can only follow once
    },
}, { timestamps: true });

export default mongoose.models.Follower || mongoose.model('Follower', FollowerSchema);
