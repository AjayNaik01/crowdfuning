const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');

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

    // Process KYC verification
    async processKYC(idCardImage, faceImage, idType = 'AADHAR') {
        return new Promise((resolve, reject) => {
            try {
                // Create a Python script to process KYC
                const pythonScript = this.createKYCProcessingScript(idCardImage, faceImage, idType);
                const scriptPath = path.join(this.uploadDir, 'kyc_processor.py');

                fs.writeFileSync(scriptPath, pythonScript);

                // Run the Python script
                const pythonProcess = spawn('python', [scriptPath], {
                    cwd: this.ekycPath,
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                let result = '';
                let error = '';

                pythonProcess.stdout.on('data', (data) => {
                    result += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    const errorText = data.toString();
                    // Filter out TensorFlow warnings and other non-critical messages
                    if (!errorText.includes('tensorflow') &&
                        !errorText.includes('oneDNN') &&
                        !errorText.includes('TF_ENABLE_ONEDNN_OPTS')) {
                        error += errorText;
                    }
                });

                pythonProcess.on('close', (code) => {
                    try {
                        // Clean up the temporary script
                        if (fs.existsSync(scriptPath)) {
                            fs.unlinkSync(scriptPath);
                        }

                        // Check if we got a valid JSON result
                        if (result.trim()) {
                            try {
                                const kycResult = JSON.parse(result);
                                resolve(kycResult);
                                return;
                            } catch (parseError) {
                                console.error('Failed to parse KYC result:', parseError);
                                console.error('Raw result:', result);
                            }
                        }

                        // If no valid result, check for actual errors
                        if (code !== 0 || error.trim()) {
                            console.error('KYC Processing Error:', error);
                            reject(new Error(`KYC processing failed: ${error || 'Unknown error'}`));
                            return;
                        }

                        // If we get here, something went wrong but no error was captured
                        reject(new Error('KYC processing failed: No result returned'));
                    } catch (cleanupError) {
                        reject(new Error(`Cleanup error: ${cleanupError.message}`));
                    }
                });

                pythonProcess.on('error', (err) => {
                    reject(new Error(`Failed to start KYC process: ${err.message}`));
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    // Create Python script for KYC processing
    createKYCProcessingScript(idCardImage, faceImage, idType) {
        // Normalize the path and escape it properly for Python
        const normalizedPath = this.ekycPath.replace(/\\/g, '/');

        return `
import sys
import os
import json
import cv2
import numpy as np
from PIL import Image
import traceback

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Add the E-KYC directory to Python path
sys.path.append(r'${normalizedPath}')

try:
    from preprocess import read_image, extract_id_card, save_image
    from ocr_engine import extract_text
    from postprocess import extract_information, extract_information1
    from face_verification import detect_and_extract_face, deepface_face_comparison, get_face_embeddings
    from sql_connection import insert_records, insert_records_aadhar, check_duplicacy, check_duplicacy_aadhar
except ImportError as e:
    print(json.dumps({"error": f"Import error: {str(e)}"}))
    sys.exit(1)

def process_kyc(id_card_path, face_image_path, id_type):
    try:
        # Read images
        face_image = read_image(face_image_path, is_uploaded=True)
        id_card_image = read_image(id_card_path, is_uploaded=True)
        
        if face_image is None or id_card_image is None:
            return {"error": "Failed to read images"}
        
        # Extract ID card ROI
        extraction_result = extract_id_card(id_card_image)
        if extraction_result is None:
            return {"error": "No ID card detected in the uploaded image"}
        
        image_roi, _ = extraction_result
        
        # Extract faces
        face_image_path1 = save_image(face_image, "uploaded_face.jpg", path="data/02_intermediate_data")
        face_image_path2 = detect_and_extract_face(img=image_roi)
        
        if face_image_path2 is None:
            return {"error": "No face detected in ID card"}
        
        # Extract text from ID card
        extracted_text = extract_text(image_roi)
        
        # Parse information based on ID type
        if id_type == "PAN":
            text_info = extract_information(extracted_text)
        else:  # AADHAR
            text_info = extract_information1(extracted_text)
        
        # Face verification
        is_face_verified, similarity_percentage = deepface_face_comparison(
            image1_path=face_image_path1, 
            image2_path=face_image_path2
        )
        
        # Get face embeddings
        face_embedding = get_face_embeddings(face_image_path1)
        if face_embedding:
            text_info['Embedding'] = face_embedding
        
        # Check for duplicates
        is_duplicate = False
        if id_type == "PAN":
            is_duplicate = check_duplicacy(text_info)
        else:
            is_duplicate = check_duplicacy_aadhar(text_info)
        
        # Determine KYC status
        if is_duplicate:
            status = "COMPLETED"
            message = "User already exists in the system"
        elif not is_face_verified or similarity_percentage < 50:
            status = "FAILED"
            message = f"Face verification failed - similarity: {similarity_percentage:.2f}%"
        elif not all([text_info.get('Name'), text_info.get('ID'), text_info.get('DOB')]):
            status = "INCOMPLETE"
            message = "Missing required information"
        else:
            status = "READY"
            message = "All verifications passed"
        
        # Prepare result
        result = {
            "status": status,
            "message": message,
            "face_verified": is_face_verified,
            "similarity_percentage": similarity_percentage,
            "is_duplicate": is_duplicate,
            "extracted_info": {
                "name": text_info.get('Name', ''),
                "id": text_info.get('ID', ''),
                "dob": str(text_info.get('DOB', '')) if text_info.get('DOB') else '',
                "gender": text_info.get('Gender', ''),
                "father_name": text_info.get("Father's Name", ''),
                "id_type": id_type
            },
            "raw_text": extracted_text
        }
        
        # Save to database if ready
        if status == "READY":
            try:
                if id_type == "PAN":
                    insert_records(text_info)
                else:
                    insert_records_aadhar(text_info)
                result["saved_to_db"] = True
            except Exception as e:
                result["saved_to_db"] = False
                result["db_error"] = str(e)
        
        return result
        
    except Exception as e:
        return {"error": f"Processing error: {str(e)}", "traceback": traceback.format_exc()}

if __name__ == "__main__":
    try:
        if len(sys.argv) != 4:
            print(json.dumps({"error": "Invalid arguments"}))
            sys.exit(1)
        
        id_card_path = sys.argv[1]
        face_image_path = sys.argv[2]
        id_type = sys.argv[3]
        
        result = process_kyc(id_card_path, face_image_path, id_type)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": f"Script error: {str(e)}", "traceback": traceback.format_exc()}))
`;
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