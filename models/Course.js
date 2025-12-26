import mongoose from 'mongoose';

const SnippetSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        default: 'javascript',
    },
    code: {
        type: String,
        required: true,
    },
});

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title for this course.'],
        maxlength: [100, 'Title cannot be more than 100 characters'],
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
    videoUrl: {
        type: String,
        required: [true, 'Please provide a video URL.'],
    },
    description: {
        type: String,
        required: [true, 'Please provide a description/explanation.'],
    },
    fileStructure: {
        type: String,
        // This can be a JSON string or Markdown representing the tree
    },
    codeSnippets: [SnippetSchema],
    tags: {
        type: [String],
    },
    views: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

export default mongoose.models.Course || mongoose.model('Course', CourseSchema);
