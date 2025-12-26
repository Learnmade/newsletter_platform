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
                        const role = process.env.ADMIN_EMAIL === user.email ? 'admin' : 'user';

                        await User.create({
                            email: user.email,
                            role: role,
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
            await dbConnect();

            if (user) {
                // Initial sign in
                if (account?.provider === 'github') {
                    const dbUser = await User.findOne({ email: user.email });
                    if (dbUser) {
                        token.role = dbUser.role;
                        token.id = dbUser._id.toString();
                    }
                } else {
                    token.role = user.role;
                    token.id = user.id;
                }
            } else if (token?.email) {
                // Subsequent calls - sync role from DB
                const dbUser = await User.findOne({ email: token.email });
                if (dbUser) {
                    token.role = dbUser.role;
                    token.id = dbUser._id.toString();
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
