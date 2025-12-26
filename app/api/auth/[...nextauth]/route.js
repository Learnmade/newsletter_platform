import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Please provide email and password');
                }

                await dbConnect();

                // Find user - specifically looking for admin
                // For the purpose of this task, we will allow a "seed" admin if none exists
                // simplified logic: Check if any user exists, if not, create one with env credentials?
                // Better: Just check database. User must be seeded manually or via script.

                const user = await User.findOne({ email: credentials.email });

                if (!user) {
                    throw new Error('Invalid email or password');
                }

                const isMatch = await bcrypt.compare(credentials.password, user.password);

                if (!isMatch) {
                    throw new Error('Invalid email or password');
                }

                return { id: user._id.toString(), email: user.email, role: user.role };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.role = token.role;
                session.user.id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
