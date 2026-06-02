import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import LiveStream from '@/models/LiveStream';

// GET - fetch current/latest live stream
export async function GET() {
    try {
        await dbConnect();
        // Return the most recent stream (admin always works on one at a time)
        const stream = await LiveStream.findOne().sort({ updatedAt: -1 }).lean();
        return NextResponse.json({ success: true, data: stream });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST - create a new live stream session
export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const stream = await LiveStream.create(body);
        return NextResponse.json({ success: true, data: stream }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

// PATCH - update existing stream (status, viewer count, etc.)
export async function PATCH(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Stream ID is required' }, { status: 400 });
        }

        const stream = await LiveStream.findByIdAndUpdate(
            id,
            { ...updates },
            { new: true, runValidators: true }
        );

        if (!stream) {
            return NextResponse.json({ success: false, error: 'Stream not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: stream });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

// DELETE - remove a stream session
export async function DELETE(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Stream ID is required' }, { status: 400 });
        }

        await LiveStream.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
