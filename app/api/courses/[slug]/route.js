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

import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { slug } = await params;
        const body = await req.json();

        const updatedCourse = await Course.findOneAndUpdate(
            { slug },
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!updatedCourse) {
            return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedCourse });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
