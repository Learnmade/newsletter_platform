import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Booking from '@/models/Booking';
import crypto from 'crypto';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: 'You must be logged in to book a session.' }, { status: 401 });
        }

        await connectDB();
        const body = await request.json();
        
        const { name, email, date, timeSlot, topic, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

        if (!name || !email || !date || !timeSlot || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ success: false, error: 'Missing required fields or payment details' }, { status: 400 });
        }

        // Verify Razorpay Signature
        const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
        }

        // Double check if slot is still available
        const existingBooking = await Booking.findOne({ 
            date, 
            timeSlot, 
            status: { $ne: 'cancelled' } 
        });

        if (existingBooking) {
            // Ideally we'd refund them here, but for now we just return error
            return NextResponse.json({ success: false, error: 'This time slot was just booked. Please contact support for a refund or reschedule.' }, { status: 409 });
        }

        const newBooking = await Booking.create({
            name,
            email,
            date,
            timeSlot,
            topic,
            status: 'confirmed', // Paid via Razorpay
            userId: session.user.email, // using email as ID since we know it's unique
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
        });

        return NextResponse.json({ success: true, data: newBooking }, { status: 201 });
    } catch (error) {
        console.error('Error creating booking:', error);
        if (error.code === 11000) {
            return NextResponse.json({ success: false, error: 'This time slot is already booked.' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: 'Failed to create booking' }, { status: 500 });
    }
}
