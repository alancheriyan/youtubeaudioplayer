import React, { useState, useEffect } from "react";
import { Card, Input, message } from "antd";

const { Search } = Input;

const YouTubeAudioPlayer = () => {
  const [urls, setUrls] = useState([
    "https://www.youtube.com/watch?v=xuP4g7IDgDM", 
    "https://www.youtube.com/watch?v=g4xs_5rZdos", 
    "", 
    "", 
    ""
  ]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      initializePlayer();
    }

    window.onYouTubeIframeAPIReady = initializePlayer;

    return () => {
      if (player) {
        player.destroy(); // Clean up the player when the component unmounts
      }
    };
  }, []);

  const initializePlayer = () => {
    if (!window.YT || !window.YT.Player) return;

    const newPlayer = new window.YT.Player("youtube-player", {
      height: "0",
      width: "0",
      playerVars: {
        autoplay: 1,
        controls: 0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onStateChange: onPlayerStateChange,
      },
    });
    setPlayer(newPlayer);
  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.ENDED) {
      playNextVideo(); // Play next video when the current one ends
    }
  };

  const playNextVideo = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < urls.length && urls[nextIndex].trim()) {
      setCurrentIndex(nextIndex);
      const nextVideoId = extractVideoId(urls[nextIndex]);
      if (nextVideoId) {
        loadVideo(nextVideoId);
      } else {
        message.error("Could not extract video ID. Please check the URL.");
      }
    } else {
      message.info("All videos have been played.");
    }
  };

  const loadVideo = (videoId) => {
    debugger
    if (player && player.loadVideoById) {
      player.loadVideoById(videoId);
    } else {
      message.error("Player is not ready yet. Please try again.");
    }
  };

  const handlePlay = (index) => {
    const url = urls[index];
    if (!url) {
      message.error("Please provide a valid YouTube URL.");
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      message.error("Could not extract video ID. Please check the URL.");
      return;
    }

    setCurrentIndex(index);
    loadVideo(videoId);
  };

  const extractVideoId = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/))([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md" title="YouTube Audio Player" bordered={false} style={{ textAlign: "center" }}>
        {urls.map((url, index) => (
          <Search
            key={index}
            placeholder={`Paste YouTube link ${index + 1} here`}
            enterButton={`Play ${index + 1}`}
            size="large"
            value={urls[index]}
            onChange={(e) => {
              const newUrls = [...urls];
              newUrls[index] = e.target.value;
              setUrls(newUrls);
            }}
            onSearch={() => handlePlay(index)}
            className="mb-4"
          />
        ))}
        <div id="youtube-player"></div>
      </Card>
    </div>
  );
};

export default YouTubeAudioPlayer;
