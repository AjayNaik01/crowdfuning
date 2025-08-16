# verifier.py

import pytesseract
import re
from PIL import Image
from fuzzywuzzy import fuzz
import face_recognition

def clean_text(text):
    return re.sub(r'\s+', ' ', text.lower()).strip()

def extract_pan_numbers(text):
    return re.findall(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", text.upper())

def verify_field(label, value, text, threshold=85):
    score = fuzz.token_set_ratio(value.lower(), text)
    result = "✅ Verified" if score >= threshold else "❌ Not Verified"
    return f"{label}: {result} (Score: {score})"

def verify_aadhaar_number(user_number, text):
    return "✅ Aadhaar Number Verified" if user_number.replace(" ", "") in text.replace(" ", "") else "❌ Aadhaar Number Not Verified"

def verify_pan_number(user_pan, text):
    pan_regex = extract_pan_numbers(text)
    return "✅ PAN Number Verified" if user_pan.upper() in pan_regex else "❌ PAN Number Not Verified"

def match_faces(id_image_path, face_image_path, threshold=0.60):
    try:
        id_img = face_recognition.load_image_file(id_image_path)
        face_img = face_recognition.load_image_file(face_image_path)

        id_enc = face_recognition.face_encodings(id_img)
        face_enc = face_recognition.face_encodings(face_img)

        if not id_enc or not face_enc:
            return "❌ Face not detected in one or both images."

        distance = face_recognition.face_distance([id_enc[0]], face_enc[0])[0]
        score = (1 - distance)
        result = "✅ Face Match" if score >= threshold else "❌ Face Mismatch"
        return f"Face Match: {result} (Score: {round(score * 100, 2)}%)"
    except Exception as e:
        return f"❌ Face match error: {str(e)}"

def verify_aadhaar(aadhaar_path, face_path, name, dob, gender, aadhaar_number):
    results = []
    text = pytesseract.image_to_string(Image.open(aadhaar_path))
    clean = clean_text(text)

    if not re.search(r"\b\d{4}\s?\d{4}\s?\d{4}\b", clean):
        results.append("❌ Aadhaar number pattern not found.")
    else:
        results.append(verify_field("Name", name, clean))
        results.append(verify_field("DOB", dob, clean))
        results.append(verify_field("Gender", gender, clean))
        results.append(verify_aadhaar_number(aadhaar_number, clean))

    if face_path:
        results.append(match_faces(aadhaar_path, face_path))

    return "\n".join(results)

def verify_pan(pan_path, face_path, name, dob, father_name, pan_number):
    results = []
    text = pytesseract.image_to_string(Image.open(pan_path))
    clean = clean_text(text)

    pan_numbers = extract_pan_numbers(clean)
    if not pan_numbers:
        results.append("❌ PAN number format not found.")
    else:
        results.append("✅ PAN format detected.")
        results.append(verify_field("Name", name, clean))
        results.append(verify_field("Father Name", father_name, clean))
        results.append(verify_field("DOB", dob, clean))
        results.append(verify_pan_number(pan_number, clean))

    if face_path:
        results.append(match_faces(pan_path, face_path))

    return "\n".join(results)
