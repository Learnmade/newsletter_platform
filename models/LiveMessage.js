import mongoose from 'mongoose';

const LiveMessageSchema = new mongoose.Schema({
    streamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LiveStream',
        required: true,
    },
    name: {
        type: String,
        default: 'Anonymous',
        maxlength: 50,
    },
    text: {
        type: String,
        required: true,
        maxlength: 500,
    },
    upvotes: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

// Index for fast lookup by stream, sorted by time
LiveMessageSchema.index({ streamId: 1, createdAt: -1 });

export default mongoose.models.LiveMessage || mongoose.model('LiveMessage', LiveMessageSchema);
