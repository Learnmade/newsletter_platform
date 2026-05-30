import Navbar from "@/components/Navbar";

export const metadata = {
    title: "Privacy Policy",
};

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Navbar />
            <div className="pt-24 max-w-4xl mx-auto px-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 md:p-14">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
                    
                    <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
                        <p>Last updated: {new Date().toLocaleDateString()}</p>
                        
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
                        <p>We collect information you provide directly to us when you create an account, subscribe to our newsletter, or purchase a course. This may include your name, email address, and payment information (processed securely via our payment providers like Razorpay).</p>
                        
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process transactions and send related information</li>
                            <li>Send technical notices, updates, and support messages</li>
                            <li>Respond to your comments, questions, and requests</li>
                        </ul>
                        
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Information Sharing</h2>
                        <p>We do not share your personal information with third parties except as necessary to provide our services (e.g., payment processors) or to comply with the law.</p>
                        
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Data Security</h2>
                        <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
                        
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Contact Us</h2>
                        <p>If you have any questions about this Privacy Policy, please contact us at support@learnmade.in.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
