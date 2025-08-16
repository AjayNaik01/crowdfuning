const mongoose = require('mongoose');
const AuditLog = require('./models/AuditLog');
require('dotenv').config({ path: './config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Test login/logout audit logs
async function testLoginLogoutLogs() {
    try {
        console.log('Testing login/logout audit logs...');

        // Create test login log
        const loginLog = new AuditLog({
            action: 'admin_login',
            actor: {
                _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5935'),
                name: 'Test Admin',
                email: 'test@example.com',
                role: 'super_admin'
            },
            target: {
                _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5935'),
                type: 'admin',
                name: 'Test Admin',
                email: 'test@example.com'
            },
            details: {
                method: 'POST',
                url: '/api/admin/auth/login',
                body: { email: 'test@example.com' },
                response: { success: true, message: 'Login successful' }
            },
            ip: '127.0.0.1'
        });

        await loginLog.save();
        console.log('✅ Login audit log created');

        // Create test logout log
        const logoutLog = new AuditLog({
            action: 'admin_logout',
            actor: {
                _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5935'),
                name: 'Test Admin',
                email: 'test@example.com',
                role: 'super_admin'
            },
            target: {
                _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5935'),
                type: 'admin',
                name: 'Test Admin',
                email: 'test@example.com'
            },
            details: {
                method: 'POST',
                url: '/api/admin/auth/logout',
                response: { success: true, message: 'Logout successful' }
            },
            ip: '127.0.0.1'
        });

        await logoutLog.save();
        console.log('✅ Logout audit log created');

        // Fetch and display all logs
        const logs = await AuditLog.find().sort({ createdAt: -1 });
        console.log('\n📊 All audit logs:');
        logs.forEach((log, index) => {
            const action = log.action === 'admin_login' ? 'LOGIN' :
                log.action === 'admin_logout' ? 'LOGOUT' :
                    log.action.toUpperCase();
            console.log(`${index + 1}. ${action} - ${log.actor.email} at ${log.createdAt.toLocaleString()}`);
        });

    } catch (error) {
        console.error('Error testing login/logout logs:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed');
    }
}

testLoginLogoutLogs(); 