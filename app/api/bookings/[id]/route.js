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

export async function PATCH(request, context) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        
        // Ensure params are awaited according to Next.js 15+ changes
        const { id } = await context.params;
        const body = await request.json();
        
        const { status, meetLink } = body;

        // Build update object
        const updateData = {};
        if (status) updateData.status = status;
        if (meetLink !== undefined) updateData.meetLink = meetLink;

        const updatedBooking = await Booking.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedBooking) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedBooking });
    } catch (error) {
        console.error('Error updating booking:', error);
        return NextResponse.json({ success: false, error: 'Failed to update booking' }, { status: 500 });
    }
}
