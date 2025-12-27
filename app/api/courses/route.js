import dbConnect from '@/lib/db';
import Course from '@/models/Course';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import Subscriber from '@/models/Subscriber';
import { Resend } from 'resend';
import { NewCourseEmailTemplate } from '@/lib/course-template';

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('search');

        let filter = {};
        if (query) {
            filter = {
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { 'codeSnippets.code': { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                ],
            };
        }

        const courses = await Course.find(filter).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: courses });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

import { z } from 'zod';

const snippetSchema = z.object({
    title: z.string().min(1, "Snippet title is required"),
    language: z.string().default('javascript'),
    code: z.string().min(1, "Code content is required"),
});

const courseSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    slug: z.string().min(1),
    thumbnail: z.string().url("Invalid thumbnail URL"),
    videoUrl: z.string().url("Invalid video URL"),
    description: z.string().min(10, "Description is too short"),
    fileStructure: z.string().optional(),
    tags: z.array(z.string()),
    codeSnippets: z.array(snippetSchema).optional(),
});

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        // Validate input with Zod
        const validation = courseSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                success: false,
                error: 'Validation Error',
                details: validation.error.format()
            }, { status: 400 });
        }

        const course = await Course.create(validation.data);

        // AUTHOR: Automated Email Broadcast
        // Fire and forget - don't block the response
        (async () => {
            try {
                const subscribers = await Subscriber.find({ isActive: true });
                if (subscribers.length === 0) return;

                const resend = new Resend(process.env.RESEND_API_KEY);
                const fromEmail = process.env.FROM_EMAIL || 'LearnMade <no-reply@learn-made.in>';
                const BATCH_SIZE = 50; // Resend limit is usually 100

                // Split into batches
                for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
                    const batch = subscribers.slice(i, i + BATCH_SIZE);

                    const emails = batch.map(sub => ({
                        from: fromEmail,
                        to: sub.email,
                        subject: `New Course: ${course.title} 🚀`,
                        html: NewCourseEmailTemplate(course),
                        headers: {
                            'List-Unsubscribe': '<mailto:unsubscribe@learn-made.in>',
                            'X-Entity-ID': `LearnMade-Course-${course.slug}`
                        }
                    }));

                    try {
                        await resend.batch.send(emails);
                        console.log(`Brodacast batch ${i / BATCH_SIZE + 1} sent to ${emails.length} subscribers.`);
                    } catch (batchError) {
                        console.error(`Failed to send batch ${i / BATCH_SIZE + 1}:`, batchError);
                    }
                }
            } catch (broadcastError) {
                console.error("Failed to broadcast new course email:", broadcastError);
            }
        })();

        return NextResponse.json({ success: true, data: course }, { status: 201 });
    } catch (error) {
        // Handle duplicate key error (E11000) for slug
        if (error.code === 11000) {
            return NextResponse.json({ success: false, error: 'A course with this slug already exists.' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
