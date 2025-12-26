import dbConnect from '@/lib/db';
import User from '@/models/User';
import Subscriber from '@/models/Subscriber';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Resend } from 'resend';
import { WelcomeEmailTemplate } from '@/lib/email-template';

const signupSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req) {
    try {
        const body = await req.json();

        // Zod Validation
        const validation = signupSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 });
        }

        const { email, password } = validation.data;

        await dbConnect();

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ success: false, error: 'User already exists' }, { status: 409 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Determine role
        const role = process.env.ADMIN_EMAIL === email ? 'admin' : 'user';

        // Create user
        await User.create({
            email,
            password: hashedPassword,
            role,
        });

        // OPTIMIZATION: Auto-subscribe new registered users
        try {
            // Check if already subscribed to avoid unique constraint error
            const existingSub = await Subscriber.findOne({ email });
            if (!existingSub) {
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
                    console.error("Failed to send welcome email during signup:", emailError);
                }
            } else if (!existingSub.isActive) {
                // Optional: Reactivate if they were unsubscribed? 
                // Let's leave it for now to respect their previous choice
            }

        } catch (subError) {
            console.error("Failed to auto-subscribe user:", subError);
        }

        return NextResponse.json({ success: true, message: 'User created successfully' }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
