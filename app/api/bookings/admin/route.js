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

// Helper to verify admin
async function isAdmin() {
    const session = await getServerSession(authOptions);
    return !!session;
}

export async function GET(request) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        
        // Fetch all bookings sorted by date (newest first)
        const bookings = await Booking.find({}).sort({ date: -1, createdAt: -1 });

        return NextResponse.json({ success: true, data: bookings });
    } catch (error) {
        console.error('Error fetching admin bookings:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
    }
}
