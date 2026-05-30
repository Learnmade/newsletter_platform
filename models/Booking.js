import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ],
    },
    date: {
        type: String, // Stored as YYYY-MM-DD
        required: [true, 'Please provide a date'],
    },
    timeSlot: {
        type: String, // e.g., "11:00 AM - 12:00 PM"
        required: [true, 'Please provide a time slot'],
    },
    topic: {
        type: String,
        trim: true,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending',
    },
    meetLink: {
        type: String,
        trim: true,
        default: '',
    },
    userId: {
        type: String,
        required: [true, 'Please provide the user ID'],
    },
    razorpayOrderId: {
        type: String,
        default: '',
    },
    razorpayPaymentId: {
        type: String,
        default: '',
    }
}, {
    timestamps: true
});

// Compound index to ensure a specific time slot on a specific date can't be double booked
bookingSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

export default Booking;
