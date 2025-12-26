import dbConnect from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

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

        // Create user (default role is 'user')
        await User.create({
            email,
            password: hashedPassword,
        });

        return NextResponse.json({ success: true, message: 'User created successfully' }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
