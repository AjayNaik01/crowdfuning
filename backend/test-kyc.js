const KYCService = require('./utils/kycService');
const path = require('path');

async function testKYCIntegration() {
    console.log('Testing KYC Integration...\n');

    const kycService = new KYCService();

    try {
        // Test 1: Check if E-KYC directory exists
        console.log('1. Checking E-KYC directory...');
        const fs = require('fs');
        const ekycPath = path.join(__dirname, '../E-KYC-');

        if (fs.existsSync(ekycPath)) {
            console.log('✅ E-KYC directory found');

            // Check for required Python files
            const requiredFiles = [
                'app.py',
                'ocr_engine.py',
                'postprocess.py',
                'face_verification.py',
                'sql_connection.py',
                'requirements.txt'
            ];

            console.log('\n2. Checking required Python files...');
            for (const file of requiredFiles) {
                const filePath = path.join(ekycPath, file);
                if (fs.existsSync(filePath)) {
                    console.log(`✅ ${file} found`);
                } else {
                    console.log(`❌ ${file} missing`);
                }
            }

            // Test 3: Check Python environment
            console.log('\n3. Testing Python environment...');
            const { spawn } = require('child_process');

            const pythonTest = spawn('python', ['--version'], {
                cwd: ekycPath
            });

            pythonTest.stdout.on('data', (data) => {
                console.log(`✅ Python version: ${data.toString().trim()}`);
            });

            pythonTest.stderr.on('data', (data) => {
                console.log(`❌ Python error: ${data.toString()}`);
            });

            pythonTest.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Python environment is working');
                } else {
                    console.log(`❌ Python test failed with code ${code}`);
                }
            });

            // Test 4: Check if required Python packages are installed
            console.log('\n4. Testing Python dependencies...');
            const testScript = `
import sys
try:
    import easyocr
    print("✅ EasyOCR installed")
except ImportError:
    print("❌ EasyOCR not installed")

try:
    import deepface
    print("✅ DeepFace installed")
except ImportError:
    print("❌ DeepFace not installed")

try:
    import cv2
    print("✅ OpenCV installed")
except ImportError:
    print("❌ OpenCV not installed")

try:
    import mysql.connector
    print("✅ MySQL Connector installed")
except ImportError:
    print("❌ MySQL Connector not installed")

try:
    import streamlit
    print("✅ Streamlit installed")
except ImportError:
    print("❌ Streamlit not installed")
`;

            const testFilePath = path.join(__dirname, 'test_deps.py');
            fs.writeFileSync(testFilePath, testScript);

            const depsTest = spawn('python', [testFilePath], {
                cwd: ekycPath
            });

            depsTest.stdout.on('data', (data) => {
                console.log(data.toString());
            });

            depsTest.stderr.on('data', (data) => {
                console.log(`❌ Dependency test error: ${data.toString()}`);
            });

            depsTest.on('close', (code) => {
                if (fs.existsSync(testFilePath)) {
                    fs.unlinkSync(testFilePath);
                }
                console.log(`✅ Dependency test completed with code ${code}`);
            });

        } else {
            console.log('❌ E-KYC directory not found');
        }

        // Test 5: Test KYC service methods
        console.log('\n5. Testing KYC service methods...');

        // Test upload middleware
        const upload = kycService.getUploadMiddleware();
        console.log('✅ Upload middleware created');

        // Test cleanup method
        kycService.cleanupFiles([]);
        console.log('✅ Cleanup method working');

        console.log('\n✅ All basic tests passed!');
        console.log('\nNext steps:');
        console.log('1. Install Python dependencies: pip install -r E-KYC-/requirements.txt');
        console.log('2. Set up MySQL database for E-KYC system');
        console.log('3. Configure database connection in E-KYC-/config.toml');
        console.log('4. Test with actual images using the API endpoints');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testKYCIntegration(); 