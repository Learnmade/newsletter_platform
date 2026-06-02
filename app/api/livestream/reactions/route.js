import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import LiveStream from '@/models/LiveStream';

const VALID_REACTIONS = ['fire', 'heart', 'clap', 'idea'];

// PATCH - increment a reaction count for the current stream
export async function PATCH(request) {
    try {
        await dbConnect();
        const { reaction } = await request.json();

        if (!VALID_REACTIONS.includes(reaction)) {
            return NextResponse.json({ success: false, error: 'Invalid reaction' }, { status: 400 });
        }

        const stream = await LiveStream.findOne().sort({ updatedAt: -1 });
        if (!stream) {
            return NextResponse.json({ success: false, error: 'No active stream' }, { status: 404 });
        }

        // Atomically increment the reaction count
        const updated = await LiveStream.findByIdAndUpdate(
            stream._id,
            { $inc: { [`reactions.${reaction}`]: 1 } },
            { new: true }
        );

        return NextResponse.json({ success: true, data: updated.reactions });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// GET - fetch current reaction counts
export async function GET() {
    try {
        await dbConnect();
        const stream = await LiveStream.findOne().sort({ updatedAt: -1 }).select('reactions').lean();
        if (!stream) return NextResponse.json({ success: true, data: { fire: 0, heart: 0, clap: 0, idea: 0 } });
        return NextResponse.json({ success: true, data: stream.reactions || { fire: 0, heart: 0, clap: 0, idea: 0 } });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
