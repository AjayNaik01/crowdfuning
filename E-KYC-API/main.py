import os
import tempfile
import json
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from PIL import Image
import numpy as np
from deepface import DeepFace
import easyocr
import cv2
from datetime import datetime
import re
import logging

# Logging
logging_str = "[%(asctime)s: %(levelname)s: %(module)s]: %(message)s"
os.makedirs("logs", exist_ok=True)
logging.basicConfig(filename=os.path.join("logs", "ekyc_logs.log"), level=logging.INFO, format=logging_str, filemode="a")

# Paths
CASCADE_PATH = "haarcascade_frontalface_default.xml"
INTERMEDIATE_DIR = "intermediate"
os.makedirs(INTERMEDIATE_DIR, exist_ok=True)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def read_image(image_path, is_uploaded=False):
    return cv2.imread(image_path)

def file_exists(path):
    return os.path.exists(path)

def words_array(*args):
    arr = []
    for a in args:
        if a:
            arr.extend(str(a).upper().split())
    return arr

def match_percentage(user_arr, extracted_arr):
    if not user_arr or not extracted_arr:
        return 0
    match_count = sum(1 for w in user_arr if w in extracted_arr)
    return int((match_count / len(user_arr)) * 100) if user_arr else 0

def extract_text(image_path, confidence_threshold=0.3, languages=['en']):
    logging.info("Text Extraction Started...")
    reader = easyocr.Reader(languages)
    try:
        result = reader.readtext(image_path)
        filtered_text = "|"
        for text in result:
            _, recognized_text, confidence = text
            if confidence > confidence_threshold:
                filtered_text += recognized_text + "|"
        logging.info(f"Extracted Text: {filtered_text}")
        return filtered_text
    except Exception as e:
        logging.error(f"Text extraction error: {e}")
        return ""

def detect_and_extract_face(img):
    logging.info("Extracting face...")
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(CASCADE_PATH)
    faces = face_cascade.detectMultiScale(gray_img, scaleFactor=1.1, minNeighbors=5)
    max_area = 0
    largest_face = None
    for (x, y, w, h) in faces:
        area = w * h
        if area > max_area:
            max_area = area
            largest_face = (x, y, w, h)

    if largest_face is not None:
        (x, y, w, h) = largest_face
        new_w = int(w * 1.5)
        new_h = int(h * 1.5)
        new_x = max(0, x - int((new_w - w) / 2))
        new_y = max(0, y - int((new_h - h) / 2))
        extracted_face = img[new_y:new_y+new_h, new_x:new_x+new_w]
        filename = os.path.join(INTERMEDIATE_DIR, "extracted_face.jpg")
        if os.path.exists(filename):
            os.remove(filename)
        cv2.imwrite(filename, extracted_face)
        logging.info(f"Extracted face saved at: {filename}")
        return filename
    else:
        logging.warning("No face detected")
        return None

def deepface_face_comparison(image1_path, image2_path):
    if not (file_exists(image1_path) and file_exists(image2_path)):
        return False, 0.0
    try:
        verification = DeepFace.verify(img1_path=image1_path, img2_path=image2_path)
        distance = verification.get('distance', 0)
        threshold = verification.get('threshold', 0.4)
        verified = verification.get('verified', False)
        if distance <= threshold:
            similarity_percentage = 100 - (distance / threshold) * 50
        else:
            similarity_percentage = max(0, 50 - (distance - threshold) / threshold * 50)
        return verified, similarity_percentage
    except Exception as e:
        logging.error(f"Face verification error: {e}")
        return False, 0.0

def extract_information(data_string):
    words = [w.strip() for w in data_string.replace(".", "").split("|") if len(w.strip()) > 2]
    extracted_info = {"ID": "", "Name": "", "Father's Name": "", "DOB": "", "ID Type": "PAN"}
    try:
        name_index = words.index("NAME") + 1
        extracted_info["Name"] = words[name_index]
        extracted_info["Father's Name"] = words[name_index + 2]
        id_number_index = words.index("PERMANENT ACCOUNT NUMBER CARD") + 1
        extracted_info["ID"] = words[id_number_index]
        for word in words:
            try:
                dob = datetime.strptime(word, "%d/%m/%Y")
                extracted_info["DOB"] = dob
                break
            except ValueError:
                continue
    except ValueError:
        logging.warning("PAN extraction error")
    return extracted_info

def extract_information1(data_string):
    words_raw = data_string.replace(".", "").split("|")
    words = []
    for item in words_raw:
        words.extend(item.strip().upper().split())

    extracted_info = {
        "ID": "",
        "Name": "",
        "Gender": "",
        "DOB": "",
        "ID Type": "AADHAR"
    }

    try:
        gender_index = next((i for i, word in enumerate(words) if word.lower() in {"male", "female"}), -1)
        if gender_index != -1:
            extracted_info["Gender"] = words[gender_index]

        dob_index = None
        for i, word in enumerate(words):
            try:
                dob = datetime.strptime(word, "%d/%m/%Y")
                dob_index = i
                extracted_info["DOB"] = dob
                break
            except ValueError:
                continue

        if dob_index is not None and dob_index > 0:
            extracted_info["Name"] = words[dob_index - 1]

        pattern1 = re.compile(r'^\\d{4} \\d{4} \\d{4}$')
        pattern2 = re.compile(r'^\\d{4}$')

        id_number_index1 = next((i for i, word in enumerate(words) if pattern1.match(word)), -1)
        if id_number_index1 != -1:
            extracted_info["ID"] = words[id_number_index1]
        else:
            id_number_index2 = next((i for i, word in enumerate(words) if pattern2.match(word)), -1)
            try:
                extracted_info["ID"] = f"{words[id_number_index2]} {words[id_number_index2+1]} {words[id_number_index2+2]}"
            except:
                extracted_info["ID"] = ""
    except Exception as e:
        logging.warning(f"AADHAR extraction error: {e}")

    return extracted_info

def convert_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

@app.post("/ekyc/verify")
async def ekyc_verify(
    id_card: UploadFile = File(...),
    face_photo: UploadFile = File(...),
    name: str = Form(...),
    id_type: str = Form(...),
    id_number: str = Form(...)
):
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    id_path = os.path.join(upload_dir, f"id_{id_card.filename}")
    face_path = os.path.join(upload_dir, f"face_{face_photo.filename}")

    with open(id_path, "wb") as f:
        f.write(await id_card.read())
    with open(face_path, "wb") as f:
        f.write(await face_photo.read())

    id_img = read_image(id_path)
    face_img = read_image(face_path)

    id_face_path = detect_and_extract_face(id_img)
    extracted_text = extract_text(id_path)
    ocr_words = words_array(extracted_text)
    user_arr = words_array(name, id_type, id_number)
    id_data_match_percent = match_percentage(user_arr, ocr_words)

    info_pan = extract_information(extracted_text)
    info_aadhar = extract_information1(extracted_text)
    extracted_info = info_pan if sum(bool(v) for v in info_pan.values()) >= sum(bool(v) for v in info_aadhar.values()) else info_aadhar

    face_verified, similarity = False, 0
    if id_face_path:
        face_verified, similarity = deepface_face_comparison(face_path, id_face_path)
        similarity = int(similarity)

    face_match_percent = similarity
    kyc_status = "FAILED"
    details = [
        f"ID data match: {id_data_match_percent}% ({'>=40%' if id_data_match_percent >= 40 else '<40%'})",
        f"Face match: {face_match_percent}% ({'>=70%' if face_match_percent >= 70 else '<70%'})"
    ]

    if face_match_percent >= 70:
        kyc_status = "VERIFIED"

    return JSONResponse(
        content=json.loads(json.dumps({
            "kyc_status": kyc_status,
            "id_data_match_percent": id_data_match_percent,
            "face_match_percent": face_match_percent,
            "details": details,
            "extracted_info": extracted_info,
            "ocr_words": ocr_words,
            "user_input": {
                "name": name,
                "id_type": id_type,
                "id_number": id_number
            },
            "saved_images": {
                "id_card": id_path,
                "face_photo": face_path
            }
        }, default=convert_datetime))
    )
