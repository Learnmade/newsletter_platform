import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Follower from '@/models/Follower';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET - get total follower count and current user's follow status
export async function GET(request) {
    try {
        await dbConnect();
        
        // Get total count
        const totalFollowers = await Follower.countDocuments();
        
        // Check if current user is following
        let isFollowing = false;
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
            const follow = await Follower.findOne({ userId: session.user.id });
            if (follow) isFollowing = true;
        }

        return NextResponse.json({ success: true, data: { totalFollowers, isFollowing } });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST - toggle follow status
export async function POST(request) {
    try {
        await dbConnect();
        
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const existingFollow = await Follower.findOne({ userId });

        if (existingFollow) {
            // Unfollow
            await Follower.deleteOne({ _id: existingFollow._id });
            const totalFollowers = await Follower.countDocuments();
            return NextResponse.json({ success: true, data: { isFollowing: false, totalFollowers } });
        } else {
            // Follow
            await Follower.create({ userId });
            const totalFollowers = await Follower.countDocuments();
            return NextResponse.json({ success: true, data: { isFollowing: true, totalFollowers } });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
