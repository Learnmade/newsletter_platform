import mongoose from 'mongoose';

const VisitSchema = new mongoose.Schema({
    path: {
        type: String,
        required: true,
    },
    referrer: {
        type: String,
        default: 'Direct',
    },
    ip: {
        type: String, // We'll hash this or keep it generic for privacy
    },
    userAgent: {
        type: String,
    },
    country: {
        type: String,
    },
}, { timestamps: true });

export default mongoose.models.Visit || mongoose.model('Visit', VisitSchema);
