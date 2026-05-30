import mongoose from 'mongoose';

const EpisodeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
    duration: { type: String, default: '' }, // e.g. "12:34"
    order: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
});

const ChapterSchema = new mongoose.Schema({
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    episodes: [EpisodeSchema],
});

const VideoCourseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a course title.'],
        maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    thumbnail: {
        type: String,
        required: [true, 'Please provide a thumbnail URL.'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description.'],
    },
    tags: {
        type: [String],
        default: [],
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner',
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft',
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    chapters: [ChapterSchema],
    views: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

export default mongoose.models.VideoCourse || mongoose.model('VideoCourse', VideoCourseSchema);
