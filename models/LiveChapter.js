import mongoose from 'mongoose';

const LiveChapterSchema = new mongoose.Schema({
    streamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LiveStream',
        required: true,
    },
    title: {
        type: String,
        required: true,
        maxlength: 150,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

export default mongoose.models.LiveChapter || mongoose.model('LiveChapter', LiveChapterSchema);
