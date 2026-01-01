import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: {
        default: "LearnMade - Master Modern Development",
        template: "%s | LearnMade"
    },
    description: "The premier video course newsletter for developers. Master Next.js, React, and modern web architecture with production-ready code breakdowns.",
    keywords: ["Next.js", "React", "Web Development", "Coding Courses", "LearnMade", "JavaScript"],
    openGraph: {
        title: "LearnMade - Master Modern Development",
        description: "Production-ready code breakdowns and deep dives delivered to your inbox.",
        url: 'https://learn-made.in',
        siteName: 'LearnMade',
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'LearnMade - Master Modern Development',
        description: "Production-ready code breakdowns and deep dives delivered to your inbox.",
    },
    robots: {
        index: true,
        follow: true,
    }
};

import AnalyticsTracker from "@/components/AnalyticsTracker";
import { Suspense } from "react";

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${inter.className} antialiased text-gray-900 bg-white`}>
                <AuthProvider>
                    <Suspense fallback={null}>
                        <AnalyticsTracker />
                    </Suspense>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
