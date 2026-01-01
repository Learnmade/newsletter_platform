import dbConnect from '@/lib/db';
import Course from '@/models/Course';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { slug } = await params;

        const course = await Course.findOne({ slug });

        if (!course) {
            return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
        }

        // Increment views asynchronously
        // In a real app, do this more carefully to avoid write contention or use specific analyticsDB
        await Course.updateOne({ slug }, { $inc: { views: 1 } });

        return NextResponse.json({ success: true, data: course });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
