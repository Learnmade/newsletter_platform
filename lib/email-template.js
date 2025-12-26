
export const WelcomeEmailTemplate = (email) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to LearnMade</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #111827;">
    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        <!-- Header -->
        <div style="background-color: #4F46E5; padding: 32px 40px; text-align: center;">
             <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">LearnMade</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px;">
            <h2 style="margin-top: 0; color: #111827; font-size: 20px; font-weight: 600;">Welcome to the community! 🚀</h2>
            
            <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin-top: 16px;">
                Hey there,
            </p>
            <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin-top: 16px;">
                Thanks for subscribing to <strong>LearnMade</strong>. You've just joined a community of developers dedicated to mastering modern web development.
            </p>

            <div style="background-color: #F3F4F6; border-radius: 8px; padding: 24px; margin: 32px 0;">
                <p style="margin: 0; font-weight: 600; color: #374151; margin-bottom: 12px;">What you can expect directly in your inbox:</p>
                <ul style="margin: 0; padding-left: 20px; color: #4B5563;">
                    <li style="margin-bottom: 8px;">🔥 Deep dives into Next.js & React patterns</li>
                    <li style="margin-bottom: 8px;">💻 Production-ready code snippets</li>
                    <li style="margin-bottom: 0;">🏗️ Real-world architecture breakdowns</li>
                </ul>
            </div>

            <p style="color: #4B5563; font-size: 16px; line-height: 24px;">
                We send out new breakdowns twice a week. No fluff, just code that helps you build better software.
            </p>

            <div style="margin-top: 32px; text-align: center;">
                <a href="https://codex.learn-made.in" style="background-color: #4F46E5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Browse Course Library</a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #F9FAFB; padding: 24px 40px; border-top: 1px solid #E5E7EB; text-align: center;">
            <p style="margin: 0; color: #9CA3AF; font-size: 14px;">
                © 2024 LearnMade. Crafted for builders.
            </p>
            <p style="margin: 8px 0 0; color: #9CA3AF; font-size: 12px;">
                If you didn't request this email, you can ignore it.
                <br/>
                <a href="#" style="color: #6B7280; text-decoration: underline;">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>
`;
