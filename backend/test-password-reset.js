const http = require('http');

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(body);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (error) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testRequestPasswordReset() {
    const testEmail = "naikajay952@gmail.com";

    try {
        console.log('\n🔐 Testing Request Password Reset API...');
        console.log('URL: http://localhost:5001/api/auth/request-password-reset');
        console.log('Email:', testEmail);

        const result = await makeRequest('POST', '/api/auth/request-password-reset', {
            email: testEmail
        });

        console.log('\nResponse Status:', result.status);
        console.log('Response Body:', JSON.stringify(result.data, null, 2));

        if (result.data.success) {
            console.log('\n✅ Password reset email sent successfully!');
            console.log('📧 Check your email inbox for the reset link');
        } else {
            console.log('\n❌ Failed to send password reset email:', result.data.message);
        }

    } catch (error) {
        console.error('\n❌ Error testing request password reset:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Server might not be running. Start it with: npm run dev');
        }
    }
}

async function testResetPassword() {
    // This test requires a valid token from the email
    const testData = {
        token: "test_token_here", // Replace with actual token from email
        email: "naikajay952@gmail.com",
        password: "newpassword123"
    };

    try {
        console.log('\n🔑 Testing Reset Password API...');
        console.log('URL: http://localhost:5001/api/auth/reset-password');
        console.log('Note: This test requires a valid token from the email');

        const result = await makeRequest('POST', '/api/auth/reset-password', testData);

        console.log('\nResponse Status:', result.status);
        console.log('Response Body:', JSON.stringify(result.data, null, 2));

        if (result.data.success) {
            console.log('\n✅ Password reset successful!');
        } else {
            console.log('\n❌ Password reset failed:', result.data.message);
        }

    } catch (error) {
        console.error('\n❌ Error testing reset password:', error.message);
    }
}

async function testHealthCheck() {
    try {
        console.log('Testing Health Check...');
        const result = await makeRequest('GET', '/');
        console.log('Health Check Response:', result);
    } catch (error) {
        console.error('Health Check Error:', error.message);
    }
}

// Run tests
async function runTests() {
    console.log('🧪 Testing Password Reset APIs...\n');

    await testHealthCheck();
    await testRequestPasswordReset();

    console.log('\n📝 To test the reset password endpoint:');
    console.log('1. Check your email for the reset link');
    console.log('2. Copy the token from the URL');
    console.log('3. Update the testResetPassword function with the real token');
    console.log('4. Run: node test-password-reset.js');
}

runTests(); 