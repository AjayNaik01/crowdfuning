const KYCService = require('./utils/kycService');
const path = require('path');
const fs = require('fs');

async function testPythonKYC() {
    console.log('Testing Python KYC Integration...\n');

    const kycService = new KYCService();

    try {
        // Check if we have sample images in the E-KYC data folder
        const sampleImagesPath = path.join(__dirname, '../E-KYC-/data/01_raw_data');

        if (!fs.existsSync(sampleImagesPath)) {
            console.log('❌ Sample images directory not found');
            return;
        }

        // Look for sample images
        const files = fs.readdirSync(sampleImagesPath);
        const imageFiles = files.filter(file =>
            file.toLowerCase().endsWith('.jpg') ||
            file.toLowerCase().endsWith('.jpeg') ||
            file.toLowerCase().endsWith('.png') ||
            file.toLowerCase().endsWith('.webp')
        );

        if (imageFiles.length === 0) {
            console.log('❌ No sample images found');
            return;
        }

        console.log(`✅ Found ${imageFiles.length} sample images`);

        // Use the first image as both ID card and face image for testing
        const testImagePath = path.join(sampleImagesPath, imageFiles[0]);
        console.log(`Using sample image: ${imageFiles[0]}`);

        // Test the KYC processing
        console.log('\nTesting KYC processing...');
        const result = await kycService.processKYC(testImagePath, testImagePath, 'AADHAR');

        console.log('✅ KYC processing completed successfully!');
        console.log('Result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error.message);

        // If it's a Python error, show more details
        if (error.message.includes('KYC processing failed')) {
            console.log('\nThis might be due to:');
            console.log('1. Missing Python dependencies - run: pip install -r E-KYC-/requirements.txt');
            console.log('2. Database connection issues - check E-KYC-/config.toml');
            console.log('3. Missing model files - check E-KYC-/data/models/');
        }
    }
}

// Run the test
testPythonKYC(); 