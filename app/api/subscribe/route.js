import dbConnect from '@/lib/db';
import Subscriber from '@/models/Subscriber';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const subscribeSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

export async function POST(req) {
    try {
        const body = await req.json();

        // Validation
        const validation = subscribeSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 });
        }

        const { email } = validation.data;

        await dbConnect();

        // Check if already subscribed
        const existing = await Subscriber.findOne({ email });
        if (existing) {
            if (!existing.isActive) {
                // Reactivate if previously unsubscribed
                existing.isActive = true;
                await existing.save();
                return NextResponse.json({ success: true, message: 'Welcome back! You have been resubscribed.' }, { status: 200 });
            }
            return NextResponse.json({ success: false, error: 'You are already subscribed!' }, { status: 409 });
        }

        // Create new subscriber
        await Subscriber.create({ email });

        return NextResponse.json({ success: true, message: 'Successfully subscribed!' }, { status: 201 });

    } catch (error) {
        // Handle duplicate key error (11000) gracefully just in case
        if (error.code === 11000) {
            return NextResponse.json({ success: false, error: 'You are already subscribed!' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: 'Server error, please try again.' }, { status: 500 });
    }
}
