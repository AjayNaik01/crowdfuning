const mongoose = require('mongoose');
const AuditLog = require('./models/AuditLog');
require('dotenv').config({ path: './config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Sample audit log data
const sampleAuditLogs = [
    {
        action: 'kyc_approve',
        actor: {
            _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5935'),
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'super_admin'
        },
        target: {
            _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5936'),
            type: 'user',
            name: 'John Doe',
            email: 'john@example.com'
        },
        details: {
            method: 'PUT',
            url: '/api/admin/kyc/123456789/approve',
            body: { userId: '123456789' },
            params: { userId: '123456789' },
            response: { success: true, message: 'KYC approved' }
        },
        ip: '192.168.1.100'
    },
    {
        action: 'campaign_approve',
        actor: {
            _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5935'),
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'super_admin'
        },
        target: {
            _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5937'),
            type: 'campaign',
            name: 'Help for Medical Treatment',
            email: null
        },
        details: {
            method: 'PUT',
            url: '/api/admin/campaigns/987654321/approve',
            body: { id: '987654321' },
            params: { id: '987654321' },
            response: { success: true, message: 'Campaign approved' }
        },
        ip: '192.168.1.100'
    },
    {
        action: 'withdrawal_approve',
        actor: {
            _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5935'),
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'super_admin'
        },
        target: {
            _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5938'),
            type: 'withdrawal',
            name: 'Withdrawal Request #001',
            email: null
        },
        details: {
            method: 'PUT',
            url: '/api/admin/withdrawals/456789123/approve',
            body: { id: '456789123' },
            params: { id: '456789123' },
            response: { success: true, message: 'Withdrawal approved' }
        },
        ip: '192.168.1.100'
    },
    {
        action: 'admin_create',
        actor: {
            _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5935'),
            name: 'Super Admin',
            email: 'superadmin@example.com',
            role: 'super_admin'
        },
        target: {
            _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5939'),
            type: 'admin',
            name: 'New Admin',
            email: 'newadmin@example.com'
        },
        details: {
            method: 'POST',
            url: '/api/admin/admins',
            body: { name: 'New Admin', email: 'newadmin@example.com', role: 'admin' },
            params: {},
            response: { success: true, message: 'Admin created successfully' }
        },
        ip: '192.168.1.100'
    },
    {
        action: 'platform_settings_update',
        actor: {
            _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5935'),
            name: 'Super Admin',
            email: 'superadmin@example.com',
            role: 'super_admin'
        },
        target: {
            _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5940'),
            type: 'platform',
            name: 'Platform Settings',
            email: null
        },
        details: {
            method: 'PUT',
            url: '/api/platform-settings',
            body: { platformName: 'Updated Platform Name', platformFees: 5 },
            params: {},
            response: { success: true, message: 'Platform settings updated successfully' }
        },
        ip: '192.168.1.100'
    }
];

// Function to seed audit logs
async function seedAuditLogs() {
    try {
        // Clear existing audit logs
        await AuditLog.deleteMany({});
        console.log('Cleared existing audit logs');

        // Insert sample audit logs
        const result = await AuditLog.insertMany(sampleAuditLogs);
        console.log(`Successfully seeded ${result.length} audit logs`);

        // Display the created logs
        const logs = await AuditLog.find().sort({ createdAt: -1 });
        console.log('\nCreated audit logs:');
        logs.forEach((log, index) => {
            console.log(`${index + 1}. ${log.action} - ${log.actor.email} -> ${log.target.name || log.target.email}`);
        });

    } catch (error) {
        console.error('Error seeding audit logs:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the seeding function
seedAuditLogs(); 