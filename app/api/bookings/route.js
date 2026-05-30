import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Booking from '@/models/Booking';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(MONGODB_URI);
}

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json({ success: false, error: 'Date is required' }, { status: 400 });
        }

        // Fetch all bookings for the specified date to see which slots are taken
        // We consider any status other than 'cancelled' as occupying the slot
        const bookings = await Booking.find({ 
            date, 
            status: { $ne: 'cancelled' } 
        }).select('timeSlot -_id');

        const bookedSlots = bookings.map(b => b.timeSlot);

        return NextResponse.json({ success: true, data: bookedSlots });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch availability' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        
        const { name, email, date, timeSlot, topic } = body;

        if (!name || !email || !date || !timeSlot) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Double check if slot is still available
        const existingBooking = await Booking.findOne({ 
            date, 
            timeSlot, 
            status: { $ne: 'cancelled' } 
        });

        if (existingBooking) {
            return NextResponse.json({ success: false, error: 'This time slot was just booked by someone else. Please choose another.' }, { status: 409 });
        }

        const newBooking = await Booking.create({
            name,
            email,
            date,
            timeSlot,
            topic,
            status: 'pending' // Defaulting to pending as per plan
        });

        return NextResponse.json({ success: true, data: newBooking }, { status: 201 });
    } catch (error) {
        console.error('Error creating booking:', error);
        // Handle unique constraint violation manually just in case
        if (error.code === 11000) {
            return NextResponse.json({ success: false, error: 'This time slot is already booked.' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: 'Failed to create booking' }, { status: 500 });
    }
}
