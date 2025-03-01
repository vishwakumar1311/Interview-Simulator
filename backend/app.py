from flask import Flask, Response, jsonify
import cv2
import mediapipe as mp
from flask_cors import CORS
from deepface import DeepFace
import sys
import os
import atexit
from collections import defaultdict
import time

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
        if not cap.isOpened():
            cap.open(0)  # Try explicitly opening the camera
        
        # Set camera properties for better performance
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        
        return cap.isOpened()
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
    global cap
    if not init_camera():
        return

    try:
        while True:
            if cap is None or not cap.isOpened():
                break
                
            success, frame = cap.read()
            if not success:
                break

            # Convert frame to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            try:
                # Face detection and emotion analysis (no visual indicators)
                results = face_detection.process(rgb_frame)
                if results.detections:
                    for detection in results.detections:
                        # Only analyze emotion, don't draw rectangle or text
                        analyze_face(frame)

                # Convert back to BGR for encoding
                frame = cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2BGR)
                _, buffer = cv2.imencode('.jpg', frame)
                frame_bytes = buffer.tobytes()

                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            except Exception as e:
                print(f"Error processing frame: {str(e)}")
                break

    finally:
        if cap is not None:
            cap.release()

@app.route('/video_feed')
def video_feed():
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

@app.route('/stop_camera', methods=['POST'])
def stop_camera():
    global cap, emotion_counts, total_emotions
    try:
        if cap is not None:
            cap.release()
            cap = None
            cv2.destroyAllWindows()
        
        # Get the summary before resetting
        summary = {
            "summary": {
                emotion: (count / total_emotions) * 100 
                for emotion, count in emotion_counts.items()
            } if total_emotions > 0 else {},
            "dominant_emotion": max(emotion_counts.items(), key=lambda x: x[1])[0] if emotion_counts else None,
            "total_frames": total_emotions
        }
        
        # Reset the counters
        emotion_counts = defaultdict(int)
        total_emotions = 0
        
        return jsonify({
            "status": "Camera stopped successfully",
            "emotion_summary": summary
        })
    except Exception as e:
        if cap is not None:
            cap.release()
            cap = None
            cv2.destroyAllWindows()
        return jsonify({"error": f"Failed to stop camera: {str(e)}"}), 500

@app.route('/start_recording', methods=['POST'])
def start_recording():
    global emotion_counts, total_emotions, cap
    try:
        # Make sure any existing camera is stopped
        if cap is not None:
            cap.release()
            cap = None
            cv2.destroyAllWindows()
        
        # Reset the emotion counters when starting a new recording
        emotion_counts = defaultdict(int)
        total_emotions = 0
        
        # Initialize the camera
        init_camera()
        
        return jsonify({"status": "Recording started"})
    except Exception as e:
        return jsonify({"error": f"Failed to start recording: {str(e)}"}), 500

def cleanup():
    global cap, emotion_counts, total_emotions
    try:
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

if __name__ == "__main__":
    try:
        init_camera()
        app.run(debug=False, threaded=True)  # Changed debug to False and added threaded=True
    except Exception as e:
        print(f"Error running server: {str(e)}")
    finally:
        cleanup()
