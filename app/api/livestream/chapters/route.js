import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import LiveChapter from '@/models/LiveChapter';
import LiveStream from '@/models/LiveStream';

// GET - Fetch chapters for the current stream
export async function GET() {
    try {
        await dbConnect();
        const stream = await LiveStream.findOne().sort({ updatedAt: -1 }).lean();
        if (!stream) {
            return NextResponse.json({ success: true, data: [] });
        }
        const chapters = await LiveChapter.find({ streamId: stream._id }).sort({ timestamp: 1 }).lean();
        return NextResponse.json({ success: true, data: chapters });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST - Create a new chapter marker
export async function POST(request) {
    try {
        await dbConnect();
        const { title } = await request.json();

        if (!title?.trim()) {
            return NextResponse.json({ success: false, error: 'Chapter title is required' }, { status: 400 });
        }

        const stream = await LiveStream.findOne().sort({ updatedAt: -1 }).lean();
        if (!stream) {
            return NextResponse.json({ success: false, error: 'No active stream' }, { status: 404 });
        }

        const chapter = await LiveChapter.create({
            streamId: stream._id,
            title: title.trim(),
            timestamp: new Date()
        });

        return NextResponse.json({ success: true, data: chapter }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
