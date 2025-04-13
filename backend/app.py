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
import jwt
import speech_recognition as sr
import threading
import traceback
import re
import json

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

# Add Together API configuration at the top of the file
TOGETHER_API_KEY = "06150d84db100f3ea0d4793266abeed1834b2b0ff3c1af53d650afab023bdef5"  # Replace with your actual Together API key
TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions"

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
    global cap, emotion_counts, total_emotions, video_writer, recording, is_listening
    try:
        print("Stopping recording and cleaning up resources...")
        
        # First stop listening if active
        is_listening = False
        time.sleep(0.5)  # Give time for listening thread to stop
        
        # Stop recording first
        recording = False
        time.sleep(0.5)  # Give time for recording to stop
        
        # Release video writer
        if video_writer is not None:
            try:
                video_writer.release()
                video_writer = None
                print("Video writer released")
            except Exception as e:
                print(f"Error releasing video writer: {str(e)}")
        
        # Release camera
        if cap is not None:
            try:
                cap.release()
                cap = None
                print("Camera released")
            except Exception as e:
                print(f"Error releasing camera: {str(e)}")
        
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
        
        print("Cleanup completed successfully")
        return jsonify({
            "status": "Recording stopped successfully",
            "emotion_summary": summary
        })
        
    except Exception as e:
        print(f"Error in stop_camera: {str(e)}")
        print("Stack trace:", traceback.format_exc())
        # Ensure cleanup even on error
        recording = False
        is_listening = False
        if video_writer is not None:
            try:
                video_writer.release()
                video_writer = None
            except:
                pass
        if cap is not None:
            try:
                cap.release()
                cap = None
            except:
                pass
        cv2.destroyAllWindows()
        return jsonify({
            "error": "Failed to stop camera",
            "message": str(e)
        }), 500

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

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not all(k in data for k in ('email', 'password')):
        return jsonify({'message': 'Missing required fields'}), 400
    
    # Check for admin credentials
    if data['email'] == 'admin' and data['password'] == 'admin@123':
        token = jwt.encode({
            'user_id': 1,  # Using a fixed user_id for admin
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            'token': token,
            'username': 'admin'
        })
    
    return jsonify({'message': 'Invalid credentials'}), 401

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

@app.route('/evaluate_interview', methods=['POST'])
def evaluate_interview():
    try:
        # Check if API key is configured
        if not TOGETHER_API_KEY or TOGETHER_API_KEY == "your-api-key-here":
            print("Error: Together API key not configured")
            return jsonify({
                "error": "API configuration error",
                "message": "Together API key not configured. Please set up your API key."
            }), 500

        # Get the interview responses from the request
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        responses = data.get('responses', [])
        
        if not responses:
            return jsonify({"error": "No interview responses provided"}), 400
        
        print(f"Received {len(responses)} responses for evaluation")
        
        # Format the responses for the API
        formatted_responses = "\n\n".join([
            f"Question {i+1}: {resp.get('question', 'No question')}\nAnswer: {resp.get('response', 'No response')}"
            for i, resp in enumerate(responses)
        ])
        
        # Prepare the prompt for evaluation
        evaluation_prompt = f"""Please evaluate the following interview responses and provide a single score out of 100.
        Consider:
        1. Technical accuracy (if applicable)
        2. Communication skills
        3. Problem-solving approach
        4. Clarity of responses
        
        Interview Responses:
        {formatted_responses}
        
        Please provide ONLY a number between 0 and 100 as your response."""
        
        headers = {
            "Authorization": f"Bearer {TOGETHER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
            "messages": [
                {"role": "system", "content": "You are an expert technical interviewer and evaluator."},
                {"role": "user", "content": evaluation_prompt}
            ]
        }
        
        print("Sending evaluation request to Together API...")
        try:
            response = requests.post(TOGETHER_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            
            result = response.json()
            if "choices" not in result or not result["choices"]:
                raise ValueError("Invalid response format from API")
                
            score_text = result["choices"][0]["message"]["content"]
            # Extract the first number from the response
            score_match = re.search(r'\d+', score_text)
            if not score_match:
                raise ValueError("No score found in API response")
                
            score = int(score_match.group())
            
            # Ensure score is between 0 and 100
            score = max(0, min(100, score))
            
            return jsonify({
                "status": "success",
                "score": score
            })
            
        except requests.exceptions.RequestException as e:
            print(f"API Request Error: {str(e)}")
            return jsonify({
                "error": "API request failed",
                "message": str(e)
            }), 500
        except ValueError as e:
            print(f"API Response Error: {str(e)}")
            return jsonify({
                "error": "Invalid API response",
                "message": str(e)
            }), 500
            
    except Exception as e:
        print(f"Error in evaluation: {str(e)}")
        print("Stack trace:", traceback.format_exc())
        return jsonify({
            "error": "Evaluation failed",
            "message": str(e)
        }), 500

@app.route('/generate_aptitude_questions', methods=['GET'])
def generate_aptitude_questions():
    """
    Generate a set of aptitude test questions using Together API.
    Returns a JSON object containing questions, options, and correct answers.
    """
    try:
        headers = {
            'Authorization': f'Bearer {TOGETHER_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        messages = [
            {"role": "system", "content": "You are an expert at creating aptitude test questions. You must generate exactly 20 questions."},
            {"role": "user", "content": """Generate exactly 20 aptitude test questions. The response must be in valid JSON format like this:
            {
                "questions": [
                    {
                        "id": 1,
                        "question": "question text",
                        "options": ["option1", "option2", "option3", "option4"],
                        "correct_answer": 0
                    }
                    ... (repeat for all 20 questions)
                ]
            }
            Questions should cover:
            - Mathematical reasoning (5 questions)
            - Logical reasoning (5 questions)
            - Verbal ability (5 questions)
            - Problem solving (5 questions)
            
            Each question must have exactly 4 options.
            Ensure the response contains ONLY the JSON with exactly 20 questions, no other text."""}
        ]
        
        response = requests.post(
            TOGETHER_API_URL,
            headers=headers,
            json={
                "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 2000  # Increased to handle 20 questions
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            if "choices" not in result or not result["choices"]:
                raise ValueError("No choices in API response")
                
            content = result["choices"][0]["message"]["content"]
            
            # Extract JSON from the response
            try:
                # Find the JSON object in the response
                json_str = re.search(r'\{[\s\S]*\}', content).group()
                questions_data = json.loads(json_str)
                
                # Verify we have exactly 20 questions
                if len(questions_data["questions"]) != 20:
                    raise ValueError(f"Expected 20 questions, but got {len(questions_data['questions'])}")
                
                # Add correct answer text to each question
                for question in questions_data["questions"]:
                    question['correct_answer_text'] = question['options'][question['correct_answer']]
                
                return jsonify({
                    "success": True,
                    "questions": questions_data["questions"]
                })
            except (json.JSONDecodeError, AttributeError) as e:
                print(f"Error parsing API response: {str(e)}")
                print(f"API Response content: {content}")
                raise ValueError("Invalid JSON in API response")
        else:
            print(f"API Error: {response.text}")
            return jsonify({
                "success": False,
                "error": f"API request failed with status {response.status_code}"
            }), 500
            
    except Exception as e:
        print(f"Error generating aptitude questions: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

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
