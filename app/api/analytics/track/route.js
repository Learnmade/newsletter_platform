import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Visit from '@/models/Visit';

export async function POST(req) {
    try {
        await dbConnect();
        const data = await req.json();

        // Basic validation
        if (!data.path) {
            return NextResponse.json({ error: 'Path is required' }, { status: 400 });
        }

        // Create visit log
        await Visit.create({
            path: data.path,
            referrer: data.referrer || 'Direct',
            userAgent: req.headers.get('user-agent') || 'Unknown',
            // In a real app, you might parse X-Forwarded-For for IP/Country
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analytics Error:', error);
        return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
    }
}
