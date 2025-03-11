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
from datetime import datetime
import requests

# Redirect stdout to devnull to suppress progress bar
old_stdout = sys.stdout
sys.stdout = open(os.devnull, 'w')

app = Flask(__name__)
CORS(app)

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
        branch = data.get('branch')
        experience = data.get('experience')

        headers = {
            "Authorization": f"Bearer {TOGETHER_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
            "messages": [
                {"role": "system", "content": "You are an expert technical interviewer."},
                {"role": "user", "content": f"Generate 10 interview questions (5 technical and 5 behavioral) for a {role} position with {experience} years of experience in {branch}. Format the response with clear sections for Technical Questions and Behavioral Questions, numbered 1-5 in each section."}
            ]
        }

        print("Sending request to Together API...")
        response = requests.post(TOGETHER_API_URL, headers=headers, json=payload)
        print("Response status:", response.status_code)

        if response.status_code == 200:
            result = response.json()
            print("Raw API Response:", result)  # DEBUGGING

            if "choices" not in result or not result["choices"]:
                return jsonify({"error": "No choices returned from API"}), 500

            content = result["choices"][0]["message"]["content"]
            print("Extracted Content:", content)  # DEBUGGING

            # Initialize storage
            questions_data = {"technical": [], "behavioral": []}

            # Split into sections
            sections = content.split("**Behavioral Questions**")
            technical_section = sections[0] if "**Technical Questions**" in sections[0] else None
            behavioral_section = sections[1] if len(sections) > 1 else None

            # Extract technical questions
            if technical_section:
                technical_questions = re.findall(r"\d+\.\s*(.+)", technical_section)
                for idx, question in enumerate(technical_questions, start=1):
                    questions_data["technical"].append({"id": idx, "type": "technical", "question": question})

            # Extract behavioral questions
            if behavioral_section:
                behavioral_questions = re.findall(r"\d+\.\s*(.+)", behavioral_section)
                for idx, question in enumerate(behavioral_questions, start=6):
                    questions_data["behavioral"].append({"id": idx, "type": "behavioral", "question": question})

            print("Parsed Questions:", questions_data)  # DEBUGGING
            return jsonify(questions_data)

        else:
            print("API Error:", response.text)
            return jsonify({"error": "Failed to generate questions"}), response.status_code

    except Exception as e:
        print(f"Error generating questions: {str(e)}")
        return jsonify({"error": str(e)}), 500

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
