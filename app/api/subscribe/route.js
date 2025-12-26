import dbConnect from '@/lib/db';
import Subscriber from '@/models/Subscriber';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { WelcomeEmailTemplate } from '@/lib/email-template';

const subscribeSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    honeypot: z.string().optional(), // Hidden field for spam bots
});

export async function POST(req) {
    try {
        const body = await req.json();

        // Validation
        const validation = subscribeSchema.safeParse({
            email: body.email,
            honeypot: body.confirm_email_address // Map frontend field to schema
        });

        if (!validation.success) {
            return NextResponse.json({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 });
        }

        const { email, honeypot } = validation.data;

        // SPAM PROTECTION: Honeypot check
        // If the hidden field is filled, it's likely a bot. Silently return success.
        if (honeypot) {
            console.log("Spam bot detected (honeypot filled):", email);
            return NextResponse.json({ success: true, message: 'Successfully subscribed! Check your inbox.' }, { status: 201 });
        }

        await dbConnect();

        // Check if already subscribed
        const existing = await Subscriber.findOne({ email });
        if (existing) {
            if (!existing.isActive) {
                // Reactivate if previously unsubscribed
                existing.isActive = true;
                await existing.save();
                // We could resend welcome email here if we wanted
                return NextResponse.json({ success: true, message: 'Welcome back! You have been resubscribed.' }, { status: 200 });
            }
            return NextResponse.json({ success: false, error: 'You are already subscribed!' }, { status: 409 });
        }

        // Create new subscriber
        await Subscriber.create({ email });

        // Send Welcome Email
        try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            const fromEmail = process.env.FROM_EMAIL || 'LearnMade <onboarding@resend.dev>';

            await resend.emails.send({
                from: fromEmail,
                to: email,
                subject: 'Welcome to LearnMade! 🚀',
                html: WelcomeEmailTemplate(email),
                headers: {
                    'List-Unsubscribe': '<mailto:unsubscribe@learn-made.in>',
                    'X-Entity-ID': 'LearnMade-Newsletter'
                }
            });
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            // Specific handling for Resend Sandbox restriction
            if (emailError.message && emailError.message.includes('only send testing emails')) {
                console.warn("\n⚠️  RESEND SANDBOX WARNING: Email not sent.");
                console.warn("   You are in Sandbox mode, which only allows sending to your own email.");
                console.warn("   Recipient was:", email);
                console.warn("   To fix: Verify your domain at resend.com or test with your registered email.\n");
            }
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
