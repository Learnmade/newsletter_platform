import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Booking from '@/models/Booking';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(MONGODB_URI);
}

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        
        // Fetch bookings for the logged-in user
        const bookings = await Booking.find({ userId: session.user.email }).sort({ date: -1 });

        return NextResponse.json({ success: true, data: bookings });
    } catch (error) {
        console.error('Error fetching my bookings:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
    }
}
