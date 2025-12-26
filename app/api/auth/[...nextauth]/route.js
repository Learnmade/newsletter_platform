import NextAuth from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions = {
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
        }),
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

                const user = await User.findOne({ email: credentials.email });

                if (!user) {
                    throw new Error('Invalid email or password');
                }

                // If user registered via OAuth (no password), don't allow credentials login unless they set one?
                // Or if password field is missing.
                if (!user.password) {
                    throw new Error('Please sign in with GitHub');
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
        async signIn({ user, account }) {
            if (account.provider === 'github') {
                await dbConnect();
                try {
                    const existingUser = await User.findOne({ email: user.email });
                    if (!existingUser) {
                        await User.create({
                            email: user.email,
                            role: 'user',
                            // password is not required
                        });
                    }
                    return true;
                } catch (error) {
                    console.log('Error saving user', error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                // If this is the first sign in, user object is available.
                // We might need to fetch the role again if it was just created in signIn callback
                // But for simplicity, let's assume if it came from DB authorize, it has role.
                // If it came from GitHub, 'user' object from NextAuth might not have our DB role unless we fetch it.

                // Better approach: Always fetch user from DB to get the role if not present
                if (account?.provider === 'github') {
                    await dbConnect();
                    const dbUser = await User.findOne({ email: user.email });
                    if (dbUser) {
                        token.role = dbUser.role;
                        token.id = dbUser._id.toString();
                    }
                } else {
                    token.role = user.role;
                    token.id = user.id;
                }
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
