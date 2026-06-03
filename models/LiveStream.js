import mongoose from 'mongoose';

const LiveStreamSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a stream title.'],
        maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
        type: String,
        default: '',
    },
    youtubeVideoId: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['offline', 'scheduled', 'live', 'ended'],
        default: 'offline',
    },
    scheduledAt: {
        type: Date,
        default: null,
    },
    thumbnail: {
        type: String,
        default: '',
    },
    viewerCount: {
        type: Number,
        default: 0,
    },
    chatEnabled: {
        type: Boolean,
        default: true,
    },
    tags: {
        type: [String],
        default: [],
    },
    reactions: {
        fire: { type: Number, default: 0 },
        heart: { type: Number, default: 0 },
        clap: { type: Number, default: 0 },
        idea: { type: Number, default: 0 },
    },
    pinnedResource: {
        title: { type: String, default: '' },
        url: { type: String, default: '' },
    },
}, { timestamps: true });

export default mongoose.models.LiveStream || mongoose.model('LiveStream', LiveStreamSchema);
