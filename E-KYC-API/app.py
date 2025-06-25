# app.py

from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
from verifier import verify_aadhaar, verify_pan

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def save_file(file, filename):
    if file:
        path = os.path.join(UPLOAD_FOLDER, secure_filename(filename))
        file.save(path)
        return path
    return None

@app.route('/verify/aadhaar', methods=['POST'])
def verify_aadhaar_route():
    name = request.form.get("name")
    dob = request.form.get("dob")
    gender = request.form.get("gender")
    aadhaar_number = request.form.get("aadhaar_number")

    aadhaar_path = save_file(request.files.get("aadhaar_img"), "aadhaar.jpg")
    face_path = save_file(request.files.get("face_img"), "face.jpg")

    if not aadhaar_path:
        return jsonify({"error": "Aadhaar image is required"}), 400

    result = verify_aadhaar(aadhaar_path, face_path, name, dob, gender, aadhaar_number)
    return jsonify({"result": result})

@app.route('/verify/pan', methods=['POST'])
def verify_pan_route():
    name = request.form.get("name")
    dob = request.form.get("dob")
    father_name = request.form.get("father_name")
    pan_number = request.form.get("pan_number")

    pan_path = save_file(request.files.get("pan_img"), "pan.jpg")
    face_path = save_file(request.files.get("face_img"), "face.jpg")

    if not pan_path:
        return jsonify({"error": "PAN image is required"}), 400

    result = verify_pan(pan_path, face_path, name, dob, father_name, pan_number)
    return jsonify({"result": result})

if __name__ == '__main__':
    app.run(debug=True)
