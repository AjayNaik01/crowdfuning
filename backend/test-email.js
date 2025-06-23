const dotenv = require('dotenv');
const { sendOTPEmail, generateOTP } = require('./utils/emailService');

// Load environment variables
dotenv.config({ path: './config.env' });

async function testEmail() {
    try {
        console.log('Testing email configuration...');
        console.log('Email User:', process.env.EMAIL_USER);
        console.log('Email From:', process.env.EMAIL_FROM);

        const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
        const testOTP = generateOTP();
        const testName = 'Test User';

        console.log('Sending test email with OTP:', testOTP);

        const result = await sendOTPEmail(testEmail, testOTP, testName);

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', result.messageId);
        console.log('Check your inbox for the test email.');

    } catch (error) {
        console.error('❌ Email test failed:');
        console.error('Error:', error.message);

        if (error.message.includes('Invalid email')) {
            console.log('\n💡 Troubleshooting tips:');
            console.log('1. Check if EMAIL_USER and EMAIL_FROM are correct');
            console.log('2. Verify EMAIL_PASS is the 16-character app password');
            console.log('3. Make sure 2-factor authentication is enabled');
            console.log('4. Ensure the app password was generated for "Mail"');
        }
    }
}

testEmail(); 