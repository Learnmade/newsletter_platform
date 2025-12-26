import dbConnect from '@/lib/db';
import Course from '@/models/Course';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

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
        return NextResponse.json({ success: true, data: course }, { status: 201 });
    } catch (error) {
        // Handle duplicate key error (E11000) for slug
        if (error.code === 11000) {
            return NextResponse.json({ success: false, error: 'A course with this slug already exists.' }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
