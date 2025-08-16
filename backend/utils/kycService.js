const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');

class KYCService {
    constructor() {
        this.ekycPath = path.join(__dirname, '../../E-KYC-');
        this.uploadDir = path.join(__dirname, '../uploads/kyc');

        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    // Configure multer for file uploads
    getUploadMiddleware() {
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, this.uploadDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        });

        return multer({
            storage: storage,
            limits: {
                fileSize: 10 * 1024 * 1024 // 10MB limit
            },
            fileFilter: (req, file, cb) => {
                if (file.mimetype.startsWith('image/')) {
                    cb(null, true);
                } else {
                    cb(new Error('Only image files are allowed'), false);
                }
            }
        });
    }

    // Process KYC verification using E-KYC-API REST endpoints
    async processKYCWithAPI({ idType, idCardImagePath, faceImagePath, fields }) {
        // idType: 'AADHAR' or 'PAN'
        // idCardImagePath: path to ID image
        // faceImagePath: path to face image
        // fields: { name, dob, gender, aadhaar_number, father_name, pan_number }
        const apiUrl = idType === 'PAN'
            ? 'http://127.0.0.1:5000/verify/pan'
            : 'http://127.0.0.1:5000/verify/aadhaar';
        const form = new FormData();
        const fs = require('fs');
        if (idType === 'PAN') {
            form.append('name', fields.name || '');
            form.append('dob', fields.dob || '');
            form.append('father_name', fields.father_name || '');
            form.append('pan_number', fields.pan_number || '');
            form.append('pan_img', fs.createReadStream(idCardImagePath));
            if (faceImagePath) form.append('face_img', fs.createReadStream(faceImagePath));
        } else {
            form.append('name', fields.name || '');
            form.append('dob', fields.dob || '');
            form.append('gender', fields.gender || '');
            form.append('aadhaar_number', fields.aadhaar_number || '');
            form.append('aadhaar_img', fs.createReadStream(idCardImagePath));
            if (faceImagePath) form.append('face_img', fs.createReadStream(faceImagePath));
        }
        try {
            const response = await axios.post(apiUrl, form, {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            });
            return response.data.result || response.data;
        } catch (error) {
            return { error: error.response?.data?.error || error.message };
        }
    }

    // Deprecated: processKYC using Python script (kept for backward compatibility)
    async processKYC(idCardImage, faceImage, idType = 'AADHAR', fields = {}) {
        // Use the new REST API instead
        return this.processKYCWithAPI({
            idType: idType === 'PAN' ? 'PAN' : 'AADHAR',
            idCardImagePath: idCardImage,
            faceImagePath: faceImage,
            fields
        });
    }

    // Get KYC status for a user
    async getKYCStatus(userId) {
        return new Promise((resolve, reject) => {
            // Normalize the path and escape it properly for Python
            const normalizedPath = this.ekycPath.replace(/\\/g, '/');

            const pythonScript = `
import sys
import json
import os

sys.path.append(r'${normalizedPath}')

try:
    from sql_connection import fetch_records, fetch_records_aadhar
except ImportError as e:
    print(json.dumps({"error": f"Import error: {str(e)}"}))
    sys.exit(1)

def get_kyc_status(user_id):
    try:
        # Check in both PAN and AADHAR tables
        pan_result = fetch_records({"ID": user_id})
        aadhar_result = fetch_records_aadhar({"ID": user_id})
        
        if not pan_result.empty:
            return {"status": "VERIFIED", "id_type": "PAN", "data": pan_result.to_dict('records')[0]}
        elif not aadhar_result.empty:
            return {"status": "VERIFIED", "id_type": "AADHAR", "data": aadhar_result.to_dict('records')[0]}
        else:
            return {"status": "NOT_VERIFIED"}
            
    except Exception as e:
        return {"error": f"Database error: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Invalid arguments"}))
        sys.exit(1)
    
    user_id = sys.argv[1]
    result = get_kyc_status(user_id)
    print(json.dumps(result))
`;

            const scriptPath = path.join(this.uploadDir, 'kyc_status.py');
            fs.writeFileSync(scriptPath, pythonScript);

            const pythonProcess = spawn('python', [scriptPath, userId], {
                cwd: this.ekycPath
            });

            let result = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            pythonProcess.on('close', (code) => {
                try {
                    if (fs.existsSync(scriptPath)) {
                        fs.unlinkSync(scriptPath);
                    }

                    if (code !== 0) {
                        reject(new Error(`KYC status check failed: ${error}`));
                        return;
                    }

                    const kycStatus = JSON.parse(result);
                    resolve(kycStatus);
                } catch (parseError) {
                    reject(new Error(`Failed to parse KYC status: ${parseError.message}`));
                }
            });
        });
    }

    // Clean up uploaded files
    cleanupFiles(files) {
        files.forEach(file => {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        });
    }
}

// Utility: Check and fix KYC image filename mismatches
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Checks for mismatches between MongoDB KYC image filenames and files in /uploads/kyc/.
 * Logs missing files and (if fix=true) updates MongoDB to match actual files.
 * @param {boolean} fix - If true, will attempt to fix DB entries to match files.
 */
async function checkAndFixKycImageMismatches(fix = false) {
    const uploadDir = path.join(__dirname, '../uploads/kyc');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crowdfunding');
    const users = await User.find({ 'kycData.0': { $exists: true } });
    let issues = 0, fixed = 0;
    for (const user of users) {
        let updated = false;
        for (let i = 0; i < (user.kycData || []).length; i++) {
            const kyc = user.kycData[i];
            ['idCardImage', 'faceImage'].forEach(field => {
                const filename = kyc[field];
                if (!filename) return;
                const filePath = path.join(uploadDir, filename);
                if (!fs.existsSync(filePath)) {
                    issues++;
                    console.log(`User ${user._id} (${user.email}): Missing file for ${field}: ${filename}`);
                    // Try to find a file with similar prefix (e.g., idCard-...)
                    const prefix = field === 'idCardImage' ? 'idCard-' : 'faceImage-';
                    const files = fs.readdirSync(uploadDir).filter(f => f.startsWith(prefix));
                    if (files.length === 1 && fix) {
                        // Auto-fix: update DB to match the only file found
                        user.kycData[i][field] = files[0];
                        updated = true;
                        fixed++;
                        console.log(`  -> Fixed: Set ${field} to ${files[0]}`);
                    }
                }
            });
        }
        if (updated && fix) await user.save();
    }
    console.log(`\nChecked ${users.length} users. Issues found: ${issues}. Fixed: ${fixed}.`);
    await mongoose.disconnect();
}

// To run: node -e 'require("./utils/kycService").checkAndFixKycImageMismatches(true)'
module.exports.checkAndFixKycImageMismatches = checkAndFixKycImageMismatches;

module.exports = KYCService; 