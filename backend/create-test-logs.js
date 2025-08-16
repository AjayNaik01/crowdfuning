const mongoose = require('mongoose');
const AuditLog = require('./models/AuditLog');
require('dotenv').config({ path: './config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Create a simple test audit log
async function createTestLog() {
    try {
        const testLog = new AuditLog({
            action: 'test_action',
            actor: {
                _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5935'),
                name: 'Test Admin',
                email: 'test@example.com',
                role: 'super_admin'
            },
            target: {
                _id: new mongoose.Types.ObjectId('68720cd5e770653a7e9e5936'),
                type: 'test',
                name: 'Test Target',
                email: 'target@example.com'
            },
            details: {
                method: 'GET',
                url: '/api/test',
                message: 'Test audit log'
            },
            ip: '127.0.0.1'
        });

        await testLog.save();
        console.log('Test audit log created successfully:', testLog._id);

        // Fetch and display all logs
        const logs = await AuditLog.find().sort({ createdAt: -1 });
        console.log('\nAll audit logs:');
        logs.forEach((log, index) => {
            console.log(`${index + 1}. ${log.action} - ${log.actor.email} -> ${log.target.name}`);
        });

    } catch (error) {
        console.error('Error creating test log:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed');
    }
}

createTestLog(); 