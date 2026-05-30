import dbConnect from '@/lib/db';
import VideoCourse from '@/models/VideoCourse';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const episodeSchema = z.object({
    title: z.string().min(1),
    videoUrl: z.string().url(),
    duration: z.string().optional().default(''),
    order: z.number().default(0),
    isFree: z.boolean().default(false),
});

const chapterSchema = z.object({
    title: z.string().min(1),
    order: z.number().default(0),
    episodes: z.array(episodeSchema).default([]),
});

const updateSchema = z.object({
    title: z.string().min(3).max(120).optional(),
    slug: z.string().min(1).optional(),
    thumbnail: z.string().url().optional(),
    description: z.string().min(10).optional(),
    tags: z.array(z.string()).optional(),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    status: z.enum(['draft', 'published']).optional(),
    chapters: z.array(chapterSchema).optional(),
});

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const course = await VideoCourse.findOne({ slug: params.slug });
        if (!course) {
            return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: course });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        const validation = updateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                success: false,
                error: 'Validation Error',
                details: validation.error.format(),
            }, { status: 400 });
        }

        const course = await VideoCourse.findOneAndUpdate(
            { slug: params.slug },
            { $set: validation.data },
            { new: true, runValidators: true }
        );

        if (!course) {
            return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: course });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const course = await VideoCourse.findOneAndDelete({ slug: params.slug });

        if (!course) {
            return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
