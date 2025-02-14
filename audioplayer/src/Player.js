import React, { useState, useEffect, useRef } from "react";
import { Card, Input, Button, List, message ,Image} from "antd";

const { Search } = Input;

const YouTubeAudioPlayer = () => {
  const [videos, setVideos] = useState([]);
  const [newUrl, setNewUrl] = useState("");
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const storedVideos = JSON.parse(localStorage.getItem("videos")) || [];
    setVideos(storedVideos);

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    } else {
      initializePlayer();
    }

    window.onYouTubeIframeAPIReady = initializePlayer;

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const initializePlayer = () => {
    if (!window.YT || !window.YT.Player) return;

    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player("youtube-player", {
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

    setIsPlayerReady(true);
  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.ENDED) {
      setTimeout(playNextVideo, 500);
    }
  };

  const playNextVideo = () => {
    const storedVideos = JSON.parse(localStorage.getItem("videos")) || [];
    if (storedVideos.length === 0) {
      message.error("No videos in the list.");
      return;
    }

    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < storedVideos.length) {
        loadVideo(storedVideos[nextIndex].videoId);
        setCurrentVideo(storedVideos[nextIndex]);
        return nextIndex;
      } else {
        message.info("All videos have been played.");
        return 0; 
      }
    });
  };

  const loadVideo = (videoId) => {
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(videoId);
    } else {
      message.error("Player is not ready yet. Please try again.");
    }
  };

  const handlePlayAll = () => {
    if (!isPlayerReady) {
      message.error("Player is still loading, please wait.");
      return;
    }

    if (videos.length === 0) {
      message.error("No videos in the list.");
      return;
    }

    setCurrentIndex(0);
    setCurrentVideo(videos[0]);
    loadVideo(videos[0].videoId);
  };

  const handleAddUrl = async () => {
    if (!newUrl.trim()) {
      message.error("Please enter a valid YouTube URL.");
      return;
    }

    const videoId = extractVideoId(newUrl);
    if (!videoId) {
      message.error("Invalid YouTube URL.");
      return;
    }

    if (videos.some((video) => video.videoId === videoId)) {
      message.warning("This video is already in the list.");
      return;
    }

    // Check if data is already in localStorage
    const storedVideos = JSON.parse(localStorage.getItem("videos")) || [];
    const existingVideo = storedVideos.find((video) => video.videoId === videoId);
    
    let videoData;
    if (existingVideo) {
      videoData = existingVideo;
    } else {
      videoData = await fetchVideoDetails(videoId);
    }

    if (!videoData) {
      message.error("Could not fetch video details.");
      return;
    }

    const updatedVideos = [...videos, videoData];
    setVideos(updatedVideos);
    localStorage.setItem("videos", JSON.stringify(updatedVideos));
    setNewUrl("");
  };

  const handleDelete = (index) => {
    const updatedVideos = videos.filter((_, i) => i !== index);
    setVideos(updatedVideos);
    localStorage.setItem("videos", JSON.stringify(updatedVideos));
  };

  const extractVideoId = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/))([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const fetchVideoDetails = async (videoId) => {
    try {
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await response.json();
      return {
        videoId,
        title: data.title,
        thumbnail: data.thumbnail_url,
      };
    } catch (error) {
      console.error("Error fetching video details:", error);
      return null;
    }
  };

  const handleClearLocalStorage = () => {
    localStorage.removeItem("videos");
    setVideos([]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md" title="YouTube Audio Player" bordered={false} style={{ textAlign: "center" }}>
        <div className="flex mb-4">
          <Input
            placeholder="Paste YouTube link here"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-grow"
          />
          <Button type="primary" onClick={handleAddUrl} className="ml-2">
            Add
          </Button>
        </div>

        {videos.length > 0 && (
          <Button type="primary" className="mb-4 w-full" onClick={handlePlayAll}>
            Play All
          </Button>
        )}

<List
  bordered
  dataSource={videos}
  renderItem={(video, index) => (
    <List.Item
      actions={[
        <Button type="link" onClick={() => {
          loadVideo(video.videoId);
          setCurrentVideo(video);
        }}>
          Play
        </Button>,
        <Button type="link" danger onClick={() => handleDelete(index)}>
          Delete
        </Button>,
      ]}
    >
      <div className="flex items-center">
        <Image 
          src={video.thumbnail} 
          alt={video.title} 
          width={50}
        />
        <span>{video.title}</span>
      </div>
    </List.Item>
  )}
/>

        <div className="mt-4">
          <Button type="default" onClick={handleClearLocalStorage}>
            Delete All
          </Button>
        </div>

        <div id="youtube-player"></div>

        {currentVideo && (
          <Card className="fixed bottom-4 w-full max-w-md bg-white shadow-lg p-4">
            <div className="flex items-center justify-between">
              <span>{currentVideo.title}</span>
              <Button onClick={() => playerRef.current.playVideo()}>▶ Play</Button>
              <Button onClick={() => playerRef.current.pauseVideo()}>⏸ Pause</Button>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default YouTubeAudioPlayer;
