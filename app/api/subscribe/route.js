import dbConnect from '@/lib/db';
import Subscriber from '@/models/Subscriber';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';

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

        // Send Welcome Email
        try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
                from: 'LearnMade <onboarding@resend.dev>', // Use resend.dev for testing if they don't have a domain yet, or tell them to update
                to: email,
                subject: 'Welcome to LearnMade! 🚀',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #4F46E5;">Welcome to LearnMade!</h1>
                        <p>Hey there,</p>
                        <p>Thanks for subscribing to LearnMade. You're now on the list to receive high-quality code breakdowns and developer tutorials.</p>
                        <p>Here is what you can expect:</p>
                        <ul>
                            <li>Deep dives into modern tech stacks</li>
                            <li>Production-ready code snippets</li>
                            <li>Software architecture explanations</li>
                        </ul>
                        <p>Stay tuned for our next issue!</p>
                        <p>Happy coding,<br/>The LearnMade Team</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            // Don't fail the request if email fails, just log it
        }

        return NextResponse.json({ success: true, message: 'Successfully subscribed! Check your inbox.' }, { status: 201 });

    } catch (error) {
        // Handle duplicate key error (11000) gracefully just in case
        if (error.code === 11000) {
            return NextResponse.json({ success: false, error: 'You are already subscribed!' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: 'Server error, please try again.' }, { status: 500 });
    }
}
