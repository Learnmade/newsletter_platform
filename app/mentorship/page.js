'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Calendar, Clock, ChevronRight, Loader2, CheckCircle2, User, Mail, MessageSquare, Video } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Generate slots from 11 AM to 8 PM
const generateTimeSlots = () => {
    const slots = [];
    for (let i = 11; i < 20; i++) {
        const startHour = i > 12 ? i - 12 : i;
        const endHour = (i + 1) > 12 ? (i + 1) - 12 : (i + 1);
        const amPmStart = i >= 12 ? 'PM' : 'AM';
        const amPmEnd = (i + 1) >= 12 ? 'PM' : 'AM';
        slots.push(`${startHour}:00 ${amPmStart} - ${endHour}:00 ${amPmEnd}`);
    }
    return slots;
};

const ALL_SLOTS = generateTimeSlots();

export default function MentorshipPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [dates, setDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({ name: '', email: '', topic: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // My Bookings state
    const [myBookings, setMyBookings] = useState([]);
    const [loadingMyBookings, setLoadingMyBookings] = useState(true);

    useEffect(() => {
        if (session?.user) {
            setFormData(prev => ({ ...prev, name: session.user.name || '', email: session.user.email || '' }));
            fetchMyBookings();
        }
    }, [session]);

    const fetchMyBookings = async () => {
        try {
            const res = await fetch('/api/bookings/my');
            const json = await res.json();
            if (json.success) {
                setMyBookings(json.data);
            }
        } catch (error) {
            console.error('Failed to fetch my bookings', error);
        } finally {
            setLoadingMyBookings(false);
        }
    };

    useEffect(() => {
        // Generate next 14 days
        const next14Days = [];
        for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            next14Days.push(date);
        }
        setDates(next14Days);
        setSelectedDate(next14Days[0]);
    }, []);

    useEffect(() => {
        if (!selectedDate) return;

        const fetchSlots = async () => {
            setLoadingSlots(true);
            const dateStr = selectedDate.toISOString().split('T')[0];
            try {
                const res = await fetch(`/api/bookings?date=${dateStr}`);
                const json = await res.json();
                if (json.success) {
                    setBookedSlots(json.data);
                } else {
                    setBookedSlots([]);
                }
            } catch (err) {
                console.error("Failed to fetch slots", err);
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
        setSelectedSlot(null);
    }, [selectedDate]);

    const handleBooking = async (e) => {
        e.preventDefault();
        
        if (!session) {
            router.push('/login?callbackUrl=/mentorship');
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Create Razorpay Order
            const orderRes = await fetch('/api/razorpay/order', { method: 'POST' });
            const orderJson = await orderRes.json();

            if (!orderJson.success) {
                alert(orderJson.error || 'Failed to create payment order');
                setIsSubmitting(false);
                return;
            }

            const options = {
                key: 'dummy_key', // This will be replaced by env var in real env if exposed to client, or leave blank to use the one from order creation if server sends it, but Razorpay requires public key here. 
                // Wait, we need the public key here. We can pass it from env.
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy_key',
                amount: orderJson.data.amount,
                currency: orderJson.data.currency,
                name: "LearnMade Mentorship",
                description: `1-on-1 Session at ${selectedSlot}`,
                order_id: orderJson.data.id,
                handler: async function (response) {
                    // 2. Verify and Save Booking
                    const dateStr = selectedDate.toISOString().split('T')[0];
                    const verifyRes = await fetch('/api/bookings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...formData,
                            date: dateStr,
                            timeSlot: selectedSlot,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    });
                    
                    const verifyJson = await verifyRes.json();
                    
                    if (verifyJson.success) {
                        setIsSuccess(true);
                        fetchMyBookings();
                    } else {
                        alert(verifyJson.error || 'Failed to confirm booking.');
                        setBookedSlots(prev => [...prev, selectedSlot]);
                    }
                    setIsModalOpen(false);
                    setIsSubmitting(false);
                },
                prefill: {
                    name: formData.name,
                    email: formData.email,
                },
                theme: {
                    color: "#1d4ed8" // blue-700
                }
            };

            const rzp1 = new window.Razorpay(options);
            
            rzp1.on('payment.failed', function (response){
                alert("Payment failed! " + response.error.description);
                setIsSubmitting(false);
            });

            rzp1.open();

        } catch (error) {
            console.error('Error during checkout', error);
            alert('An unexpected error occurred during checkout.');
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-200">
                        <CheckCircle2 size={40} className="text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed!</h1>
                    <p className="text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
                        Your 1-on-1 mentorship slot for <strong>{selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong> at <strong>{selectedSlot}</strong> has been successfully booked.
                    </p>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 max-w-md mx-auto text-sm text-gray-700 mb-8">
                        <p className="font-semibold text-gray-900 mb-2">Next Steps:</p>
                        <p>Our admin will review your topic and attach a Google Meet link shortly. You can find the link below in your <strong>"My Bookings"</strong> dashboard.</p>
                    </div>
                    <button onClick={() => setIsSuccess(false)} className="bg-blue-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-sm">
                        View My Bookings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <Navbar />
            
            <div className="bg-white border-b border-gray-200 pt-24 pb-12">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">1-on-1 Mentorship</h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed mb-4">
                        Book a dedicated 60-minute session to review your code, map out your career path, or overcome technical roadblocks.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-1.5 rounded-full font-bold text-sm border border-blue-200">
                        <span className="text-xl">₹</span> 199 per session
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                    
                    {/* Date Selector */}
                    <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3 mb-6">
                            <Calendar className="text-blue-600" size={24} />
                            <h2 className="text-xl font-bold text-gray-900">Select a Date</h2>
                        </div>
                        
                        <div className="flex overflow-x-auto pb-4 gap-3 snap-x scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                            {dates.map((date, i) => {
                                const isSelected = selectedDate?.toDateString() === date.toDateString();
                                const isToday = new Date().toDateString() === date.toDateString();
                                
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(date)}
                                        className={`snap-start shrink-0 w-24 h-28 rounded-2xl border flex flex-col items-center justify-center transition-all
                                            ${isSelected 
                                                ? 'bg-blue-700 border-blue-700 text-white shadow-md transform -translate-y-1' 
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
                                            }`}
                                    >
                                        <span className={`text-xs font-bold uppercase tracking-wider mb-2 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </span>
                                        <span className="text-2xl font-bold mb-1">
                                            {date.getDate()}
                                        </span>
                                        <span className={`text-xs font-medium ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                            {date.toLocaleDateString('en-US', { month: 'short' })}
                                        </span>
                                        {isToday && !isSelected && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time Slots */}
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <Clock className="text-blue-600" size={24} />
                            <h2 className="text-xl font-bold text-gray-900">Available Slots</h2>
                            {loadingSlots && <Loader2 size={16} className="animate-spin text-blue-600 ml-2" />}
                        </div>

                        {loadingSlots ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {ALL_SLOTS.map((slot, i) => {
                                    const isBooked = bookedSlots.includes(slot);
                                    const isSelected = selectedSlot === slot;

                                    if (isBooked) {
                                        return (
                                            <div key={i} className="h-16 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center cursor-not-allowed opacity-60">
                                                <span className="text-sm font-bold text-gray-400 line-through">{slot}</span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`h-16 rounded-xl border-2 transition-all flex items-center justify-center text-sm font-bold
                                                ${isSelected 
                                                    ? 'border-blue-600 bg-blue-50 text-blue-800' 
                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50/30 hover:text-blue-700'
                                                }`}
                                        >
                                            {slot}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-10 flex justify-end">
                            {session ? (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    disabled={!selectedSlot}
                                    className="bg-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    Proceed to Checkout <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => router.push('/login?callbackUrl=/mentorship')}
                                    className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition-all shadow-sm flex items-center gap-2"
                                >
                                    Log In to Book <ChevronRight size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* My Bookings Section */}
                {session && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">My Bookings</h2>
                            <p className="text-sm text-gray-500 mt-1">View your upcoming sessions and meeting links.</p>
                        </div>
                        <div className="p-8">
                            {loadingMyBookings ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-blue-600" size={24} />
                                </div>
                            ) : myBookings.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    You have no bookings yet.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {myBookings.map((b) => (
                                        <div key={b._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                                                        b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                        b.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                        b.status === 'cancelled' ? 'bg-gray-200 text-gray-700' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {b.status}
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-medium">Order: {b.razorpayOrderId}</span>
                                                </div>
                                                <h3 className="font-bold text-gray-900">{b.date}</h3>
                                                <p className="text-sm text-gray-600">{b.timeSlot}</p>
                                            </div>
                                            <div>
                                                {b.meetLink ? (
                                                    <a href={b.meetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 hover:bg-blue-200 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors border border-blue-200 shadow-sm">
                                                        <Video size={16} /> Join Google Meet
                                                    </a>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-400 px-5 py-2.5 rounded-xl font-bold text-sm border border-gray-200 cursor-not-allowed">
                                                        <Video size={16} /> Link Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-900">Checkout Details</h3>
                                <p className="text-xs text-gray-500 mt-1">{selectedDate?.toLocaleDateString()} · {selectedSlot}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600 transition-colors">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleBooking} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><User size={18} /></div>
                                    <input 
                                        type="text" required disabled
                                        value={formData.name} 
                                        className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 outline-none text-sm font-medium cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={18} /></div>
                                    <input 
                                        type="email" required disabled
                                        value={formData.email} 
                                        className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 outline-none text-sm font-medium cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">What would you like to discuss? <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3 text-gray-400"><MessageSquare size={18} /></div>
                                    <textarea 
                                        value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium resize-none"
                                        placeholder="e.g. Need help with Next.js architecture..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-4 mt-6 border-t border-gray-100 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2">
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Pay ₹199'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
