import dbConnect from '@/lib/db';
import Subscriber from '@/models/Subscriber';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

// GET: Fetch all subscribers
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const subscribers = await Subscriber.find({}).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: subscribers });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a subscriber
export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ success: false, error: 'Subscriber ID is required' }, { status: 400 });
        }

        await Subscriber.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: 'Subscriber deleted' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
