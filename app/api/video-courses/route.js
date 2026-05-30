import dbConnect from '@/lib/db';
import VideoCourse from '@/models/VideoCourse';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const episodeSchema = z.object({
    title: z.string().min(1, 'Episode title is required'),
    videoUrl: z.string().url('Invalid video URL'),
    duration: z.string().optional().default(''),
    order: z.number().default(0),
    isFree: z.boolean().default(false),
});

const chapterSchema = z.object({
    title: z.string().min(1, 'Chapter title is required'),
    order: z.number().default(0),
    episodes: z.array(episodeSchema).default([]),
});

const videoCourseSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(120),
    slug: z.string().min(1),
    thumbnail: z.string().url('Invalid thumbnail URL'),
    description: z.string().min(10, 'Description is too short'),
    tags: z.array(z.string()).default([]),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Beginner'),
    status: z.enum(['draft', 'published']).default('draft'),
    isPaid: z.boolean().default(false),
    chapters: z.array(chapterSchema).default([]),
});

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const filter = status ? { status } : {};
        const courses = await VideoCourse.find(filter).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: courses });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        const validation = videoCourseSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                success: false,
                error: 'Validation Error',
                details: validation.error.format(),
            }, { status: 400 });
        }

        const course = await VideoCourse.create(validation.data);
        return NextResponse.json({ success: true, data: course }, { status: 201 });
    } catch (error) {
        if (error.code === 11000) {
            return NextResponse.json({ success: false, error: 'A course with this slug already exists.' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
