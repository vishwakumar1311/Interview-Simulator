from flask import Flask, Response, jsonify, request
import cv2
import mediapipe as mp
from flask_cors import CORS
from deepface import DeepFace
import sys
import os
import atexit
from collections import defaultdict
import time
from datetime import datetime, timedelta
import requests
import PyPDF2
from io import BytesIO
from mysql.connector import connect
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
import speech_recognition as sr
import threading

# Redirect stdout to devnull to suppress progress bar
old_stdout = sys.stdout
sys.stdout = open(os.devnull, 'w')

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'your-secret-key'  # Change this to a secure secret key

mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(min_detection_confidence=0.5)
cap = None

# Add global variables for emotion tracking
emotion_counts = defaultdict(int)
total_emotions = 0

# Add these global variables at the top with other globals
video_writer = None
recording = False
output_folder = "recorded_videos"

# Create output folder if it doesn't exist
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# Add global variable for speech recognition
recognizer = sr.Recognizer()
is_listening = False
current_response = ""

# Add global variables for storing interview responses
interview_responses = []
current_question = None

def init_camera():
    global cap
    try:
        # Make sure to properly release any existing camera
        if cap is not None:
            cap.release()
            cv2.destroyAllWindows()
            cap = None
        
        # Add a small delay before opening new capture
        time.sleep(0.5)
        
        cap = cv2.VideoCapture(0)
        
        # Try reopening if first attempt fails
        if not cap.isOpened():
            cap.release()
            time.sleep(1)  # Wait a bit longer
            cap = cv2.VideoCapture(0)
        
        if cap.isOpened():
            # Set camera properties for better performance
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            cap.set(cv2.CAP_PROP_FPS, 30)
            return True
            
        return False
    except Exception as e:
        print(f"Error initializing camera: {str(e)}")
        return False

def analyze_face(frame):
    try:
        result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False, silent=True)
        # Track the emotion
        global emotion_counts, total_emotions
        emotion = result[0]['dominant_emotion']
        emotion_counts[emotion] += 1
        total_emotions += 1
        return emotion
    except:
        return None

def generate_frames():
    global cap, video_writer, recording
    if not init_camera():
        print("Failed to initialize camera in generate_frames")
        return

    try:
        while True:
            if cap is None or not cap.isOpened():
                print("Camera not available")
                break
                
            success, frame = cap.read()
            if not success:
                print("Failed to read frame")
                break

            try:
                # Face detection and emotion analysis
                results = face_detection.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                if results.detections:
                    emotion = analyze_face(frame)
                    if emotion:
                        print(f"Detected emotion: {emotion}")

                # Save frame if recording
                if recording and video_writer is not None:
                    try:
                        video_writer.write(frame)
                    except Exception as e:
                        print(f"Error writing frame: {str(e)}")

                # Convert for streaming
                _, buffer = cv2.imencode('.jpg', frame)
                frame_bytes = buffer.tobytes()

                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            except Exception as e:
                print(f"Error processing frame: {str(e)}")
                break

    except Exception as e:
        print(f"Error in generate_frames: {str(e)}")
    finally:
        print("Exiting generate_frames")

@app.route('/video_feed')
def video_feed():
    global cap, video_writer, recording
    # Reset everything when starting a new video feed
    if cap is not None:
        cap.release()
        cap = None
    if video_writer is not None:
        video_writer.release()
        video_writer = None
    recording = False
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/analyze_emotion', methods=['GET'])
def analyze_emotion():
    global cap
    if cap is None or not cap.isOpened():
        if not init_camera():
            return jsonify({"error": "Failed to initialize camera"})

    try:
        success, frame = cap.read()
        if not success or frame is None:
            return jsonify({"error": "Failed to capture frame"})

        emotion = analyze_face(frame)
        if emotion:
            return jsonify({"status": "Face detected", "emotion": emotion})
        return jsonify({"status": "No face detected"})

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"})

@app.route('/reset_camera', methods=['POST'])
def reset_camera():
    if init_camera():
        return jsonify({"status": "Camera reset successful"})
    return jsonify({"error": "Failed to reset camera"}), 500

@app.route('/get_emotion_summary')
def get_emotion_summary():
    global emotion_counts, total_emotions
    if total_emotions == 0:
        return jsonify({
            "error": "No emotions recorded",
            "summary": {},
            "dominant_emotion": None
        })
    
    # Calculate percentages
    emotion_percentages = {
        emotion: (count / total_emotions) * 100 
        for emotion, count in emotion_counts.items()
    }
    
    # Find dominant emotion
    dominant_emotion = max(emotion_counts.items(), key=lambda x: x[1])[0]
    
    return jsonify({
        "summary": emotion_percentages,
        "dominant_emotion": dominant_emotion,
        "total_frames": total_emotions
    })

@app.route('/start_recording', methods=['POST'])
def start_recording():
    global emotion_counts, total_emotions, cap, video_writer, recording
    try:
        print("Starting recording process...")
        
        # Reset the emotion counters
        emotion_counts = defaultdict(int)
        total_emotions = 0
        
        # Initialize the camera if needed
        if cap is None or not cap.isOpened():
            print("Initializing camera...")
            success = init_camera()
            if not success:
                print("Failed to initialize camera")
                return jsonify({"error": "Camera initialization failed"}), 500
        
        print("Camera status:", cap.isOpened())
        
        # Setup video writer
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = os.path.join(output_folder, f"interview_{timestamp}.mp4")
            print(f"Creating video writer at: {output_path}")
            
            fourcc = cv2.VideoWriter_fourcc(*'XVID')  # Changed from mp4v to XVID
            frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            print(f"Frame dimensions: {frame_width}x{frame_height}")
            
            video_writer = cv2.VideoWriter(output_path, fourcc, 20.0, (frame_width, frame_height))
            if not video_writer.isOpened():
                print("Failed to create video writer")
                return jsonify({"error": "Failed to create video writer"}), 500
                
            recording = True
            print("Recording started successfully")
            
        except Exception as e:
            print(f"Error setting up video writer: {str(e)}")
            return jsonify({"error": f"Video writer setup failed: {str(e)}"}), 500
        
        return jsonify({"status": "Recording started"})
    except Exception as e:
        print(f"Error in start_recording: {str(e)}")
        return jsonify({"error": f"Failed to start recording: {str(e)}"}), 500

@app.route('/stop_camera', methods=['POST'])
def stop_camera():
    global cap, emotion_counts, total_emotions, video_writer, recording
    try:
        print("Stopping recording...")
        print(f"Current emotion counts: {emotion_counts}")
        print(f"Total emotions: {total_emotions}")
        
        recording = False
        
        if video_writer is not None:
            video_writer.release()
            video_writer = None
            print("Video writer released")
            
        if cap is not None:
            cap.release()
            cap = None
            cv2.destroyAllWindows()
            print("Camera released")
        
        # Get the summary before resetting
        summary = {
            "summary": {
                emotion: (count / total_emotions) * 100 
                for emotion, count in emotion_counts.items()
            } if total_emotions > 0 else {},
            "dominant_emotion": max(emotion_counts.items(), key=lambda x: x[1])[0] if emotion_counts else None,
            "total_frames": total_emotions
        }
        
        print(f"Generated summary: {summary}")
        
        # Reset the counters
        emotion_counts = defaultdict(int)
        total_emotions = 0
        
        return jsonify({
            "status": "Recording stopped successfully",
            "emotion_summary": summary
        })
    except Exception as e:
        print(f"Error in stop_camera: {str(e)}")
        # Ensure cleanup even on error
        recording = False
        if video_writer is not None:
            video_writer.release()
            video_writer = None
        if cap is not None:
            cap.release()
            cap = None
        cv2.destroyAllWindows()
        return jsonify({"error": f"Failed to stop camera: {str(e)}"}), 500

def cleanup():
    global cap, emotion_counts, total_emotions, video_writer, recording
    try:
        recording = False
        if video_writer is not None:
            video_writer.release()
        if cap is not None:
            cap.release()
            cap = None
        cv2.destroyAllWindows()
        sys.stdout = old_stdout
        # Reset emotion tracking
        emotion_counts = defaultdict(int)
        total_emotions = 0
    except Exception as e:
        print(f"Error during cleanup: {str(e)}")

# Register cleanup function to run on exit
atexit.register(cleanup)

import re

TOGETHER_API_KEY = "06150d84db100f3ea0d4793266abeed1834b2b0ff3c1af53d650afab023bdef5"
TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions"

@app.route('/generate_questions', methods=['POST'])
def generate_questions():
    try:
        data = request.get_json()
        role = data.get('role')
        experience = data.get('experience')

        headers = {
            "Authorization": f"Bearer {TOGETHER_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
            "messages": [
                {"role": "system", "content": "You are an expert technical interviewer."},
                {"role": "user", "content": f"Generate 10 interview questions (5 technical and 5 behavioral) for a {role} position with {experience} years of experience. Format the response with clear sections for Technical Questions and Behavioral Questions, numbered 1-5 in each section."}
            ]
        }

        print("Sending request to Together API...")
        response = requests.post(TOGETHER_API_URL, headers=headers, json=payload)
        print("Response status:", response.status_code)

        if response.status_code == 200:
            result = response.json()
            print("Raw API Response:", result)  # Debugging

            if "choices" not in result or not result["choices"]:
                return jsonify({"error": "No choices returned from API"}), 500

            content = result["choices"][0]["message"]["content"]
            print("Extracted Content:", content)  # Debugging

            questions_data = {"technical": [], "behavioral": []}

            # Check if expected headers exist
            if "**Technical Questions**" in content and "**Behavioral Questions**" in content:
                sections = content.split("**Behavioral Questions**")
                technical_section = sections[0].split("**Technical Questions**")[-1] if len(sections) > 0 else None
                behavioral_section = sections[1] if len(sections) > 1 else None
            else:
                # Fallback: Extract all numbered questions without relying on headers
                technical_section = content
                behavioral_section = None

            # Extract technical questions (1-5)
            if technical_section:
                technical_questions = re.findall(r"^\d+\.\s*(.+)", technical_section, re.MULTILINE)
                for idx, question in enumerate(technical_questions[:5], start=1):
                    questions_data["technical"].append({"id": idx, "question": question})

            # Extract behavioral questions (6-10)
            if behavioral_section:
                behavioral_questions = re.findall(r"^\d+\.\s*(.+)", behavioral_section, re.MULTILINE)
            else:
                # Fallback: If no behavioral section is found, extract remaining questions from technical_section
                behavioral_questions = technical_questions[5:]

            for idx, question in enumerate(behavioral_questions[:5], start=6):
                questions_data["behavioral"].append({"id": idx, "question": question})

            print("Parsed Questions:", questions_data)  # Debugging
            return jsonify(questions_data)

        else:
            print("API Error:", response.text)
            return jsonify({"error": "Failed to generate questions"}), response.status_code

    except Exception as e:
        print(f"Error generating questions: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/extract-text', methods=['POST'])
def extract_text():
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file provided'}), 400
    
    pdf_file = request.files['pdf']
    
    try:
        # Read PDF file
        pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_file.read()))
        
        # Extract text from all pages
        text = ''
        for page in pdf_reader.pages:
            text += page.extract_text() + '\n'
        
        return jsonify({'text': text.strip()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_db_connection():
    return connect(
        host="localhost",
        user="root",
        password="root",
        database="interview_simulator"
    )

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            db = get_db_connection()
            cursor = db.cursor(dictionary=True)
            cursor.execute('SELECT * FROM users WHERE id = %s', (data['user_id'],))
            current_user = cursor.fetchone()
            cursor.close()
            db.close()
        except:
            return jsonify({'message': 'Token is invalid'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not all(k in data for k in ('username', 'email', 'password')):
        return jsonify({'message': 'Missing required fields'}), 400
    
    hashed_password = generate_password_hash(data['password'])
    
    db = get_db_connection()
    cursor = db.cursor()
    
    try:
        cursor.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)',
            (data['username'], data['email'], hashed_password)
        )
        db.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        return jsonify({'message': 'Username or email already exists'}), 409
    finally:
        cursor.close()
        db.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not all(k in data for k in ('email', 'password')):
        return jsonify({'message': 'Missing required fields'}), 400
    
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute('SELECT * FROM users WHERE email = %s', (data['email'],))
        user = cursor.fetchone()
        
        if user and check_password_hash(user['password_hash'], data['password']):
            token = jwt.encode({
                'user_id': user['id'],
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, app.config['SECRET_KEY'])
            
            return jsonify({
                'token': token,
                'username': user['username']
            })
        
        return jsonify({'message': 'Invalid credentials'}), 401
    finally:
        cursor.close()
        db.close()

# Protected route example
@app.route('/protected', methods=['GET'])
@token_required
def protected(current_user):
    return jsonify({'message': f'Hello {current_user["username"]}!'})

def listen_for_speech():
    global is_listening, current_response, current_question
    with sr.Microphone() as source:
        print("Listening for speech...")
        # Adjust for ambient noise with longer duration for better calibration
        recognizer.adjust_for_ambient_noise(source, duration=2)
        
        # Initialize empty list to store all responses
        all_responses = []
        
        while is_listening:
            try:
                # Use non-blocking listen with longer timeout
                # Set phrase_time_limit to None to allow unlimited recording
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=None)
                
                # Use Google's speech recognition with better settings
                text = recognizer.recognize_google(
                    audio,
                    language="en-US",
                    show_all=False
                )
                
                if text:
                    # Clean up the text
                    text = text.strip()
                    if text:
                        all_responses.append(text)
                        current_response = " ".join(all_responses)  # Join all responses
                        print(f"User said: {text}")
                        print(f"Full response so far: {current_response}")
                
            except sr.WaitTimeoutError:
                continue
            except sr.UnknownValueError:
                print("Could not understand audio")
            except sr.RequestError as e:
                print(f"Could not request results; {e}")
            except Exception as e:
                print(f"Error in speech recognition: {str(e)}")

@app.route('/start_listening', methods=['POST'])
def start_listening():
    global is_listening, current_response, current_question
    if not is_listening:
        is_listening = True
        current_response = ""  # Reset response when starting new recording
        
        # Get the current question from the request
        data = request.get_json()
        if data and 'question' in data:
            current_question = data['question']
            print(f"Starting recording for question: {current_question}")
        
        threading.Thread(target=listen_for_speech, daemon=True).start()
        return jsonify({"status": "Started listening"})
    return jsonify({"status": "Already listening"})

@app.route('/stop_listening', methods=['POST'])
def stop_listening():
    global is_listening, current_response, current_question, interview_responses
    is_listening = False
    
    # Store the response with its question
    if current_question and current_response:
        response_data = {
            "question": current_question,
            "response": current_response,
            "timestamp": datetime.now().isoformat()
        }
        interview_responses.append(response_data)
        print(f"Stored response for question: {current_question}")
        print(f"Current interview responses: {interview_responses}")
    
    response = current_response
    current_response = ""
    current_question = None
    
    return jsonify({
        "status": "Stopped listening",
        "response": response,
        "interview_responses": interview_responses
    })

@app.route('/get_interview_responses', methods=['GET'])
def get_interview_responses():
    return jsonify({
        "status": "success",
        "responses": interview_responses
    })

@app.route('/clear_interview_responses', methods=['POST'])
def clear_interview_responses():
    global interview_responses
    interview_responses = []
    return jsonify({"status": "Responses cleared"})

if __name__ == '__main__':
    app.run(debug=True)



if __name__ == "__main__":
    try:
        init_camera()
        app.run(debug=False, threaded=True)  # Changed debug to False and added threaded=True
    except Exception as e:
        print(f"Error running server: {str(e)}")
    finally:
        cleanup()
