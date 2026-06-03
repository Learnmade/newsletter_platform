import mongoose from 'mongoose';

const ActiveViewerSchema = new mongoose.Schema({
    streamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LiveStream',
        required: true,
    },
    viewerId: {
        type: String,
        required: true,
        unique: true, // one entry per unique viewer session
    },
    lastPing: {
        type: Date,
        default: Date.now,
    },
});

// Index for fast querying of recent pings
ActiveViewerSchema.index({ streamId: 1, lastPing: -1 });

export default mongoose.models.ActiveViewer || mongoose.model('ActiveViewer', ActiveViewerSchema);
