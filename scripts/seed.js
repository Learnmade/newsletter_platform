const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Config
const MONGODB_URI = 'mongodb://localhost:27017/newsletter-platform';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin';

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await User.create({
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin',
        });

        console.log('Admin user created successfully');
        console.log(`Email: ${ADMIN_EMAIL}`);
        console.log(`Password: ${ADMIN_PASSWORD}`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seed();
