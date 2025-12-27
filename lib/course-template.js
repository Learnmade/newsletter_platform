export const NewCourseEmailTemplate = (course, unsubscribeUrl = '#') => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Course: ${course.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #111827;">
    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <!-- Header -->
        <div style="background-color: #4F46E5; padding: 32px 40px; text-align: center;">
             <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">New Course Alert 🚨</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px;">
            <p style="color: #6B7280; font-size: 14px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">Just Released</p>
            <h2 style="margin-top: 0; color: #111827; font-size: 28px; font-weight: 800; line-height: 1.2;">${course.title}</h2>
            
            <p style="color: #4B5563; font-size: 16px; line-height: 26px; margin-top: 16px;">
                ${course.description}
            </p>

            <div style="background-color: #F3F4F6; border-left: 4px solid #4F46E5; padding: 20px; margin: 32px 0;">
                <p style="margin: 0; font-weight: 600; color: #374151;">What you'll learn:</p>
                <!-- We can parse tags or highlights here if available, for now just static text or generic call to action -->
                <p style="margin: 8px 0 0; color: #4B5563;">
                    Master the concepts in this comprehensive video breakdown. Includes source code and production patterns.
                </p>
            </div>

            <div style="margin-top: 32px; text-align: center;">
                <a href="${process.env.NEXTAUTH_URL}/courses/${course.slug}" style="background-color: #4F46E5; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">
                    Watch Now
                </a>
            </div>
        </div>

        <!-- Thumbnail Image (Optional, if course has one) -->
        ${course.thumbnail ? `
        <div style="width: 100%; height: 200px; background-image: url('${course.thumbnail}'); background-size: cover; background-position: center;"></div>
        ` : ''}

        <!-- Footer -->
        <div style="background-color: #F9FAFB; padding: 24px 40px; border-top: 1px solid #E5E7EB; text-align: center;">
            <p style="margin: 0; color: #9CA3AF; font-size: 14px;">
                © ${new Date().getFullYear()} LearnMade. Crafted for builders.
            </p>
            <p style="margin: 8px 0 0; color: #9CA3AF; font-size: 12px;">
                You're receiving this because you subscribed to updates.
                <br/>
                <a href="${unsubscribeUrl}" style="color: #6B7280; text-decoration: underline;">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>
`;
