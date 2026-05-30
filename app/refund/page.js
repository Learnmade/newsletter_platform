import Navbar from "@/components/Navbar";

export const metadata = {
    title: "Refund Policy",
};

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />
            <div className="pt-24 max-w-4xl mx-auto px-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 md:p-14">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Refund & Cancellation Policy</h1>
                    
                    <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
                        <p>Last updated: {new Date().toLocaleDateString()}</p>
                        
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Digital Products and Courses</h2>
                        <p>Due to the nature of digital goods and video courses, we offer a <strong>7-day money-back guarantee</strong>. If you are not satisfied with your purchase, you may request a full refund within 7 days of your original purchase date.</p>
                        
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. How to Request a Refund</h2>
                        <p>To request a refund, please email us at <strong>support@learnmade.in</strong> with your order details and the reason for your request. We will process your refund within 5-7 business days.</p>
                        
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Conditions</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Refund requests must be made within 7 days of purchase.</li>
                            <li>Refunds will be issued to the original payment method used during the purchase (e.g., Credit Card, UPI, etc. via Razorpay).</li>
                            <li>After a refund is processed, your access to the purchased course(s) will be revoked.</li>
                        </ul>
                        
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Cancellations</h2>
                        <p>If you are on a recurring subscription, you can cancel your subscription at any time from your account settings. Cancellations will take effect at the end of your current billing cycle.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
