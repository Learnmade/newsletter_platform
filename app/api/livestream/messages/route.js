import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import LiveMessage from '@/models/LiveMessage';
import LiveStream from '@/models/LiveStream';

// GET - fetch all messages for the current live stream
export async function GET() {
    try {
        await dbConnect();
        const stream = await LiveStream.findOne().sort({ updatedAt: -1 }).lean();
        if (!stream) return NextResponse.json({ success: true, data: [] });

        const messages = await LiveMessage.find({ streamId: stream._id })
            .sort({ createdAt: 1 }) // oldest first
            .limit(100)
            .lean();

        return NextResponse.json({ success: true, data: messages });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST - submit a new message
export async function POST(request) {
    try {
        await dbConnect();
        const { name, text } = await request.json();

        if (!text?.trim()) {
            return NextResponse.json({ success: false, error: 'Message text is required' }, { status: 400 });
        }

        const stream = await LiveStream.findOne().sort({ updatedAt: -1 }).lean();
        if (!stream) {
            return NextResponse.json({ success: false, error: 'No active stream' }, { status: 404 });
        }

        const message = await LiveMessage.create({
            streamId: stream._id,
            name: name?.trim() || 'Anonymous',
            text: text.trim().slice(0, 500),
        });

        return NextResponse.json({ success: true, data: message }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

// PATCH - upvote a message
export async function PATCH(request) {
    try {
        await dbConnect();
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ success: false, error: 'Message ID required' }, { status: 400 });
        }

        const message = await LiveMessage.findByIdAndUpdate(
            id,
            { $inc: { upvotes: 1 } },
            { new: true }
        );

        if (!message) {
            return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: message });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
