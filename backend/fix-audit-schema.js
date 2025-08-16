const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

async function fixAuditSchema() {
    try {
        console.log('Fixing audit log schema...');

        // Drop the existing auditlogs collection to reset schema
        try {
            await mongoose.connection.db.dropCollection('auditlogs');
            console.log('✅ Dropped existing auditlogs collection');
        } catch (dropError) {
            console.log('ℹ️ Collection might not exist, continuing...');
        }

        // Create a test audit log to verify schema works
        const AuditLog = require('./models/AuditLog');

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
        console.log('✅ Test audit log created successfully');

        // Fetch and display the test log
        const logs = await AuditLog.find();
        console.log('📊 Current audit logs:', logs.length);
        logs.forEach((log, index) => {
            console.log(`${index + 1}. ${log.action} - ${log.actor.email} -> ${log.target.name}`);
        });

    } catch (error) {
        console.error('Error fixing audit schema:', error);
    } finally {
        mongoose.connection.close();
        console.log('Database connection closed');
    }
}

fixAuditSchema(); 