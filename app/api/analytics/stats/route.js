import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Visit from '@/models/Visit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
    try {
        constsession = await getServerSession(authOptions);

        // Security: Only admins can view stats
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // 1. Total Visits (All time)
        const totalVisits = await Visit.countDocuments();

        // 2. Top Referrers
        const topReferrers = await Visit.aggregate([
            {
                $group: {
                    _id: "$referrer",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // 3. Recent Logs
        const recentLogs = await Visit.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .select('path referrer createdAt userAgent');

        // 4. Page Views (Top Pages)
        const topPages = await Visit.aggregate([
            {
                $group: {
                    _id: "$path",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        return NextResponse.json({
            success: true,
            data: {
                totalVisits,
                topReferrers,
                recentLogs,
                topPages
            }
        });
    } catch (error) {
        console.error('Stats Error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
