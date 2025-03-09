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

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

@app.route('/generate_questions', methods=['POST'])
def generate_questions():
    try:
        data = request.get_json()
        print("Received data:", data)  # Debug log

        branch = data.get('branch')
        role = data.get('role')
        experience = data.get('experience')

        if not all([branch, role, experience]):
            return jsonify({"error": "Missing required fields"}), 400

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}"
        }

        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "You are an expert technical interviewer."},
                {"role": "user", "content": f"Generate 10 technical and behavioral interview questions for a {role} position with {experience} years of experience and background in {branch}."}
            ],
            "temperature": 0.7,
            "max_tokens": 200  # Limits response size
        }

        print("Sending request to OpenAI:", payload)  # Debug log
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload
        )

        print("OpenAI response status:", response.status_code)  # Debug log
        print("OpenAI response:", response.text)  # Debug log

        if response.status_code == 200:
            try:
                result = response.json()
                if 'choices' in result and result['choices']:
                    content = result['choices'][0]['message']['content']
                    questions = [q.strip() for q in content.split('\n') if q.strip()]
                    return jsonify({"questions": questions})
                else:
                    return jsonify({"error": "Unexpected OpenAI response format"}), 500
            except ValueError:
                return jsonify({"error": "Invalid JSON response from OpenAI"}), 500
        else:
            error_message = f"OpenAI API error: {response.text}"
            print(error_message)  # Debug log
            return jsonify({"error": error_message}), response.status_code

    except Exception as e:
        print(f"Error generating questions: {str(e)}")  # Debug log
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    try:
        init_camera()
        app.run(debug=False, threaded=True)  # Changed debug to False and added threaded=True
    except Exception as e:
        print(f"Error running server: {str(e)}")
    finally:
        cleanup()
