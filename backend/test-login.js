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

async function testHealthCheck() {
    try {
        console.log('Testing Health Check...');
        const result = await makeRequest('GET', '/');
        console.log('Health Check Response:', result);
    } catch (error) {
        console.error('Health Check Error:', error.message);
    }
}

async function testLoginAPI() {
    const loginData = {
        email: "naikajay952@gmail.com",
        password: "123456"
    };

    try {
        console.log('\nTesting Login API...');
        console.log('URL: http://localhost:5001/api/auth/login');
        console.log('Data:', loginData);

        const result = await makeRequest('POST', '/api/auth/login', loginData);

        console.log('\nResponse Status:', result.status);
        console.log('Response Body:', JSON.stringify(result.data, null, 2));

        if (result.data.success) {
            console.log('\n✅ Login successful!');
            console.log('User:', result.data.data.user.name);
            console.log('Token received:', result.data.data.token ? 'Yes' : 'No');
        } else {
            console.log('\n❌ Login failed:', result.data.message);
        }

    } catch (error) {
        console.error('\n❌ Error testing login API:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Server might not be running. Start it with: npm run dev');
        }
    }
}

// Run tests
async function runTests() {
    await testHealthCheck();
    await testLoginAPI();
}

runTests(); 