from flask import Flask, Response, jsonify
import cv2
import mediapipe as mp
from flask_cors import CORS
from deepface import DeepFace
import sys
import os

# Redirect stdout to devnull to suppress progress bar
old_stdout = sys.stdout
sys.stdout = open(os.devnull, 'w')

app = Flask(__name__)
CORS(app)

mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(min_detection_confidence=0.5)
cap = None

def init_camera():
    global cap
    if cap is not None:
        cap.release()
    cap = cv2.VideoCapture(0)
    return cap.isOpened()

def analyze_face(frame):
    try:
        result = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False, silent=True)
        return result[0]['dominant_emotion']
    except:
        return None

def generate_frames():
    global cap
    if not init_camera():
        return

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break

            # Convert frame to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            try:
                # Face detection
                results = face_detection.process(rgb_frame)

                if results.detections:
                    for detection in results.detections:
                        bboxC = detection.location_data.relative_bounding_box
                        ih, iw, _ = frame.shape
                        x, y, w, h = int(bboxC.xmin * iw), int(bboxC.ymin * ih), \
                                    int(bboxC.width * iw), int(bboxC.height * ih)
                        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                        
                        # Analyze emotion for detected face
                        emotion = analyze_face(frame)
                        if emotion:
                            cv2.putText(frame, emotion, (x, y-10), 
                                      cv2.FONT_HERSHEY_SIMPLEX, 0.9, 
                                      (36,255,12), 2)

                _, buffer = cv2.imencode('.jpg', frame)
                frame_bytes = buffer.tobytes()

                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            except Exception as e:
                print(f"Error processing frame: {str(e)}")
                break

    finally:
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

@app.route('/stop_camera', methods=['POST'])
def stop_camera():
    global cap
    try:
        if cap is not None:
            cap.release()
            cap = None
        return jsonify({"status": "Camera stopped successfully"})
    except Exception as e:
        return jsonify({"error": f"Failed to stop camera: {str(e)}"}), 500

def cleanup():
    global cap
    if cap is not None:
        cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    try:
        init_camera()
        app.run(debug=True)
    finally:
        cleanup()
        # Restore stdout
        sys.stdout = old_stdout
