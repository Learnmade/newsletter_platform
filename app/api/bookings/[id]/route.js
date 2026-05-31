import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Booking from '@/models/Booking';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Resend } from 'resend';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(MONGODB_URI);
}

// Helper to verify admin
async function isAdmin() {
    const session = await getServerSession(authOptions);
    return !!session;
}

export async function PATCH(request, context) {
    try {
        if (!(await isAdmin())) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        
        // Ensure params are awaited according to Next.js 15+ changes
        const { id } = await context.params;
        const body = await request.json();
        
        const { status, meetLink } = body;

        // Build update object
        const updateData = {};
        if (status) updateData.status = status;
        if (meetLink !== undefined) updateData.meetLink = meetLink;

        const updatedBooking = await Booking.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedBooking) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
        }

        // Send email to user if meetLink was just added or updated
        if (meetLink && meetLink.trim() !== '') {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const fromEmail = process.env.FROM_EMAIL || 'LearnMade <no-reply@learn-made.in>';

                await resend.emails.send({
                    from: fromEmail,
                    to: updatedBooking.email,
                    subject: 'Your Google Meet Link is Ready! 🎥',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <h2 style="color: #1d4ed8;">Your 1-on-1 Mentorship Session</h2>
                            <p>Hi ${updatedBooking.name},</p>
                            <p>Your booking for <strong>${updatedBooking.date}</strong> at <strong>${updatedBooking.timeSlot}</strong> has been confirmed.</p>
                            <p>Here is your Google Meet link:</p>
                            <a href="${meetLink}" style="display: inline-block; background-color: #1d4ed8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Join Google Meet</a>
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
                            
                            <p>Want to browse your history or check out more courses before the session?</p>
                            <a href="https://courses.learnmade.in/" style="color: #1d4ed8; font-weight: bold;">Visit LearnMade Platform</a>
                            
                            <p style="margin-top: 32px; color: #666; font-size: 14px;">See you soon!<br/>The LearnMade Team</p>
                        </div>
                    `,
                });
            } catch (emailError) {
                console.error("Failed to send meet link email:", emailError);
            }
        }

        return NextResponse.json({ success: true, data: updatedBooking });
    } catch (error) {
        console.error('Error updating booking:', error);
        return NextResponse.json({ success: false, error: 'Failed to update booking' }, { status: 500 });
    }
}
