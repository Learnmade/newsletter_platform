import mongoose from 'mongoose';

const SubscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

export default mongoose.models.Subscriber || mongoose.model('Subscriber', SubscriberSchema);
