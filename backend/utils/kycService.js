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

module.exports = KYCService; 