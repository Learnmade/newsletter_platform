import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ActiveViewer from '@/models/ActiveViewer';
import LiveStream from '@/models/LiveStream';

// PATCH - heartbeat ping to keep viewer count accurate
export async function PATCH(request) {
    try {
        await dbConnect();
        const { viewerId } = await request.json();

        if (!viewerId) {
            return NextResponse.json({ success: false, error: 'viewerId required' }, { status: 400 });
        }

        const stream = await LiveStream.findOne().sort({ updatedAt: -1 }).lean();
        if (!stream) {
            return NextResponse.json({ success: false, error: 'No active stream' }, { status: 404 });
        }

        // Upsert the viewer's heartbeat
        await ActiveViewer.findOneAndUpdate(
            { viewerId, streamId: stream._id },
            { lastPing: new Date() },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
