'use client';

import { useState, useEffect } from 'react';
import { Calendar, MoreVertical, Edit, Video, Mail, CheckCircle2, User, Clock, Loader2, Link as LinkIcon } from 'lucide-react';

export default function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Edit Modal state
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [statusInput, setStatusInput] = useState('');
    const [meetLinkInput, setMeetLinkInput] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bookings/admin');
            const json = await res.json();
            if (json.success) {
                setBookings(json.data);
            }
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (booking) => {
        setSelectedBooking(booking);
        setStatusInput(booking.status);
        setMeetLinkInput(booking.meetLink || '');
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        
        try {
            const res = await fetch(`/api/bookings/${selectedBooking._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: statusInput,
                    meetLink: meetLinkInput
                })
            });
            const json = await res.json();
            
            if (json.success) {
                setBookings(prev => prev.map(b => b._id === selectedBooking._id ? json.data : b));
                setSelectedBooking(null);
            } else {
                alert(json.error || 'Failed to update booking');
            }
        } catch (error) {
            console.error('Update error:', error);
            alert('An unexpected error occurred');
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
            case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">1-on-1 Sessions</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your mentorship bookings and Google Meet links.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Session Date & Time</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Google Meet</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bookings.map((booking) => (
                                <tr key={booking._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                                {booking.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{booking.name}</p>
                                                <p className="text-xs text-gray-500">{booking.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="flex items-center gap-1.5 font-medium text-gray-900">
                                                <Calendar size={14} className="text-gray-400" /> {booking.date}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Clock size={14} className="text-gray-400" /> {booking.timeSlot}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${getStatusStyle(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {booking.meetLink ? (
                                            <a href={booking.meetLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-xs">
                                                <Video size={14} /> Join Meet
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Not set</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => openEditModal(booking)}
                                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No bookings found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Manage Booking</h3>
                            <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        
                        <form onSubmit={handleUpdate} className="p-6">
                            {/* Student Info Box */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                                <p className="text-sm font-bold text-blue-900 mb-1">{selectedBooking.name}</p>
                                <p className="text-xs text-blue-700 flex items-center gap-2 mb-3"><Mail size={12}/> {selectedBooking.email}</p>
                                <div className="text-xs text-blue-800 bg-white/60 p-3 rounded-lg border border-blue-200/50">
                                    <span className="font-bold block mb-1">Topic/Notes:</span>
                                    {selectedBooking.topic || <span className="italic text-gray-500">No specific topic provided.</span>}
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                                    <select 
                                        value={statusInput} 
                                        onChange={(e) => setStatusInput(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-medium"
                                    >
                                        <option value="pending">Pending Payment</option>
                                        <option value="confirmed">Confirmed (Paid)</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Google Meet Link</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><LinkIcon size={16} /></div>
                                        <input 
                                            type="url" 
                                            value={meetLinkInput} 
                                            onChange={(e) => setMeetLinkInput(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm"
                                            placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t border-gray-100 flex gap-3">
                                <button type="button" onClick={() => setSelectedBooking(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isUpdating} className="flex-[2] py-2.5 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-sm flex items-center justify-center gap-2">
                                    {isUpdating && <Loader2 size={16} className="animate-spin" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
