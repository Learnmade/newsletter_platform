import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
        });

        // Fixed amount: 199 INR
        const amount = 19900; // in paise

        const options = {
            amount,
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`,
            payment_capture: 1, // Auto capture
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({ success: true, data: order });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
    }
}
