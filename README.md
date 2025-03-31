CREATE DATABASE interview_simulator;
USE interview_simulator;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


## Features
- Real-time Interview Simulation
- Web-based interface with React
- Resume Screener
- Curated Resources based on User Performance

## Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn
- Webcam

## Installation

### Backend Setup
\`\`\`bash
# Create and activate virtual environment
python -m venv venv

# On Windows
.\\venv\\Scripts\\activate

# On Unix or MacOS
source venv/bin/activate

# Install dependencies
cd backend
pip install flask flask-cors opencv-python mediapipe
\`\`\`

### Frontend Setup
\`\`\`bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
\`\`\`

## Running the Application

1. Start the Backend:
\`\`\`bash
# Make sure your virtual environment is activated
cd backend
python app.py
\`\`\`

2. Start the Frontend (in a new terminal):
\`\`\`bash
cd frontend
npm start
\`\`\`

3. Open http://localhost:3000 in your browser
4. Click \"Start Interview\" to begin the face detection session

## Contributing
1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## License
MIT License" > README.md
