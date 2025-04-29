import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

const CustomAudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressBarRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnd = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
    };
  }, []);

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (e) => {
    const time = parseFloat(e.target.value);
    if (!isNaN(time)) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-900 to-blue-200 rounded-3xl shadow-sm border border-gray-100 w-full min-w-[160px] md:min-w-[200px] max-w-[320px] group relative">
      <button
        onClick={togglePlayPause}
        className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white transition-all duration-300 shadow-lg z-10"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-2 relative h-12">
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2">
          <div className="relative h-2 bg-gray-200/50 rounded-full overflow-hidden">
            <div
              ref={progressBarRef}
              className="absolute h-full bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-100"
              style={{
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                transition: isPlaying ? 'width 0.1s linear' : 'none'
              }}
            />
            <input
              type="range"
              min="0"
              max={duration || 1}
              value={currentTime}
              onChange={handleTimeChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <div className="absolute bottom-0 right-0">
          <span className="text-sm text-black font-medium">
            {formatTime(isPlaying ? currentTime : duration > 0 ? duration : 0)}
          </span>
        </div>
      </div>

      <audio ref={audioRef} src={src} />
    </div>
  );
};

export default CustomAudioPlayer;