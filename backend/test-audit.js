const axios = require('axios');

// Test the audit logs API
async function testAuditLogs() {
    try {
        // First, let's test the audit logs endpoint
        console.log('Testing audit logs API...');

        const response = await axios.get('http://localhost:5001/api/audit-logs', {
            headers: {
                'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // You'll need to replace this with a real token
            }
        });

        console.log('Audit logs response:', response.data);

    } catch (error) {
        console.error('Error testing audit logs:', error.response?.data || error.message);
    }
}

// Test creating a test audit log via the test route
async function createTestAuditLog() {
    try {
        console.log('Creating test audit log...');

        const response = await axios.post('http://localhost:5001/api/admin/test-audit', {}, {
            headers: {
                'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE' // You'll need to replace this with a real token
            }
        });

        console.log('Test audit log response:', response.data);

    } catch (error) {
        console.error('Error creating test audit log:', error.response?.data || error.message);
    }
}

// Run tests
testAuditLogs();
// createTestAuditLog(); 