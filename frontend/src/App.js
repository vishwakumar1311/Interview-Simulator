import React, { useState } from "react";
import VideoFeed from "./components/VideoFeed";
import Home from "./components/Home";

function App() {
  const [showVideo, setShowVideo] = useState(false);

  const handleStartVideo = () => {
    setShowVideo(true);
  };

  const handleStopVideo = () => {
    setShowVideo(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      {!showVideo ? (
        <Home onStartVideo={handleStartVideo} />
      ) : (
        <VideoFeed onStopVideo={handleStopVideo} />
      )}
    </div>
  );
}

export default App;
