const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const Admin = require('./models/Admin');

dotenv.config({ path: './config.env' });

const seedAdmin = async () => {
    await connectDB();
    const name = 'Super Admin';
    const email = 'naikajay952@gmail.com';
    const password = '123456';
    try {
        const existing = await Admin.findOne({ email });
        if (existing) {
            console.log('Super admin already exists:', email);
            process.exit(0);
        }
        const hashed = await bcrypt.hash(password, 10);
        const admin = new Admin({
            name,
            email,
            password: hashed,
            role: 'super_admin',
            isActive: true
        });
        await admin.save();
        console.log('Super admin created:', email);
        console.log('Login credentials:');
        console.log('Email:', email);
        console.log('Password:', password);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding super admin:', err);
        process.exit(1);
    }
};

seedAdmin(); 