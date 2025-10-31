import React, { useState, useRef, useEffect } from 'react';
import { TimedLyric } from '../types';
import KaraokeLyric from './KaraokeLyric';
import { ColorPalette, lyricColorPalettes } from '../styles/colors';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import PrevIcon from './icons/PrevIcon';
import AlignLeftIcon from './icons/AlignLeftIcon';
import AlignRightIcon from './icons/AlignRightIcon';
import FanIcon from './icons/FanIcon';
import VerticalLinesIcon from './icons/VerticalLinesIcon';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';

interface VideoPlayerProps {
  timedLyrics: TimedLyric[];
  audioUrl: string;
  imageUrls: string[];
  videoUrl: string | null;
  onBack: () => void;
  songTitle: string;
  artistName: string;
}

type LyricAlignment = 'text-left' | 'text-center' | 'text-right';
type VisualEffect = 'none' | 'subtle-pan' | 'rain';

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  timedLyrics,
  audioUrl,
  imageUrls,
  videoUrl,
  onBack,
  songTitle,
  artistName,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [colorPalette, setColorPalette] = useState<ColorPalette>(lyricColorPalettes[0]);
  const [fontSize, setFontSize] = useState(3.5); // Using rem units
  const [alignment, setAlignment] = useState<LyricAlignment>('text-center');
  const [effect, setEffect] = useState<VisualEffect>('subtle-pan');
  const [showControls, setShowControls] = useState(true);
  
  const activeLyricIndex = timedLyrics.findIndex(
    lyric => currentTime >= lyric.startTime && currentTime < lyric.endTime
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    // Sync video playback with audio
    const video = videoRef.current;
    if (!video || !audioRef.current) return;
    if (isPlaying && video.paused) {
      video.play().catch(console.error);
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
    // Sync time
    if (Math.abs(video.currentTime - audioRef.current.currentTime) > 0.5) {
      video.currentTime = audioRef.current.currentTime;
    }
  }, [isPlaying, currentTime]);

  useEffect(() => {
    if (imageUrls.length <= 1 || !isPlaying) return;
    const imageChangeInterval = 10000; // Change image every 10 seconds
    const intervalId = setInterval(() => {
      setCurrentImageIndex(prevIndex => (prevIndex + 1) % imageUrls.length);
    }, imageChangeInterval);
    return () => clearInterval(intervalId);
  }, [isPlaying, imageUrls.length]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return isNaN(minutes) || isNaN(secs) ? '0:00' : `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderLyrics = () => {
    const lyricWindow = 2; // Show 2 lines of context before and after
    const start = Math.max(0, activeLyricIndex - lyricWindow);
    const end = Math.min(timedLyrics.length, activeLyricIndex + lyricWindow + 1);

    return timedLyrics.slice(start, end).map((lyric, index) => {
      const globalIndex = start + index;
      const isActive = globalIndex === activeLyricIndex;
      const isPast = globalIndex < activeLyricIndex;

      let opacity = 0.3;
      if (isActive) opacity = 1;
      
      const textStyle: React.CSSProperties = {
        opacity: opacity,
        color: isPast ? colorPalette.highlight : colorPalette.base,
        transition: 'opacity 0.3s ease, color 0.3s ease, font-size 0.3s ease, font-weight 0.3s ease',
        fontWeight: isActive ? 'bold' : 'normal',
        fontSize: `${fontSize * (isActive ? 1 : 0.8)}rem`,
        lineHeight: 1.2,
      };

      if (isActive) {
        return (
          <KaraokeLyric
            key={`${lyric.startTime}-${lyric.text}`}
            text={lyric.text}
            startTime={lyric.startTime}
            endTime={lyric.endTime}
            currentTime={currentTime}
            isPlaying={isPlaying}
            colorPalette={colorPalette}
            style={{...textStyle, fontSize: `${fontSize}rem`}}
          />
        );
      } else {
        return <p key={`${lyric.startTime}-${lyric.text}`} style={textStyle}>{lyric.text}</p>;
      }
    });
  };

  const backgroundImageUrl = imageUrls[currentImageIndex] || '';

  return (
    <div className="w-screen h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative font-sans">
      {/* Background */}
      <div className="absolute inset-0 w-full h-full">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full bg-cover bg-center transition-all duration-1000 ${effect === 'subtle-pan' ? 'animate-subtle-pan' : ''}`}
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        {effect === 'rain' && <div className="absolute inset-0 bg-rain-effect opacity-30"></div>}
      </div>
      
      {/* Overlay Content */}
      <div className={`relative z-10 w-full h-full flex flex-col p-4 sm:p-8 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100 focus-within:opacity-100'}`}>
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between w-full">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black/30 hover:bg-black/50 border border-white/20 rounded-lg transition-colors">
            <PrevIcon className="w-5 h-5" />
            返回
          </button>
          <div className="text-right">
             <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">{songTitle}</h1>
             <p className="text-sm sm:text-md text-gray-300 drop-shadow-md">{artistName}</p>
          </div>
        </header>
        
        {/* Lyrics Container */}
        <div className="flex-grow flex items-center justify-center overflow-hidden">
            <div className={`w-full max-w-4xl p-4 flex flex-col gap-4 items-center ${alignment}`}>
                {renderLyrics()}
            </div>
        </div>

        {/* Controls */}
        <footer className="flex-shrink-0 space-y-4">
            {/* Timeline */}
            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300 font-mono w-12 text-center">{formatTime(currentTime)}</span>
                <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step="0.01"
                    value={currentTime}
                    onChange={handleTimelineChange}
                    className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
                />
                <span className="text-sm text-gray-300 font-mono w-12 text-center">{formatTime(duration)}</span>
            </div>

            {/* Buttons & Settings */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left Settings */}
                <div className="flex items-center gap-2 p-2 bg-black/30 rounded-full border border-white/10">
                    <span className="text-gray-300 pl-2 text-sm">顏色:</span>
                    {lyricColorPalettes.map(p => (
                        <button key={p.name} title={p.name} onClick={() => setColorPalette(p)} className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${colorPalette.name === p.name ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50' : ''}`} style={{background: p.bg}} />
                    ))}
                </div>

                {/* Play Button */}
                <button onClick={handlePlayPause} className="bg-white text-black rounded-full p-4 transform hover:scale-110 transition-transform shadow-lg">
                    {isPlaying ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7" />}
                </button>

                {/* Right Settings */}
                <div className="flex items-center justify-end gap-2 p-1.5 bg-black/30 rounded-full border border-white/10">
                    <button onClick={() => setAlignment(a => a === 'text-left' ? 'text-center' : 'text-left')} title="靠左" className={`p-2 rounded-full transition-colors ${alignment === 'text-left' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}> <AlignLeftIcon className="w-5 h-5" /></button>
                    <button onClick={() => setAlignment(a => a === 'text-right' ? 'text-center' : 'text-right')} title="靠右" className={`p-2 rounded-full transition-colors ${alignment === 'text-right' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}> <AlignRightIcon className="w-5 h-5" /></button>
                    <div className="w-px h-6 bg-white/20 mx-1"></div>
                    <button onClick={() => setEffect(e => e === 'subtle-pan' ? 'none' : 'subtle-pan')} title="背景動畫" className={`p-2 rounded-full transition-colors ${effect === 'subtle-pan' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}> <FanIcon className="w-5 h-5" /></button>
                    <button onClick={() => setEffect(e => e === 'rain' ? 'none' : 'rain')} title="下雨特效" className={`p-2 rounded-full transition-colors ${effect === 'rain' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}> <VerticalLinesIcon className="w-5 h-5" /></button>
                    <div className="w-px h-6 bg-white/20 mx-1"></div>
                    <button onClick={() => setShowControls(s => !s)} title="顯示/隱藏控制項" className="p-2 text-gray-300 hover:bg-white/10 rounded-full transition-colors">{showControls ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button>
                </div>
            </div>
        </footer>
      </div>

      <audio ref={audioRef} src={audioUrl} playsInline />

      <style>{`
        @keyframes subtle-pan {
          0% { background-position: 45% 50%; transform: scale(1); }
          50% { background-position: 55% 50%; transform: scale(1.05); }
          100% { background-position: 45% 50%; transform: scale(1); }
        }
        .animate-subtle-pan {
          animation: subtle-pan 20s ease-in-out infinite;
        }
        .accent-white::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #ffffff;
            cursor: pointer;
        }
        .accent-white::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #ffffff;
            cursor: pointer;
            border: none;
        }
        @keyframes rain-fall {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
        }
        .bg-rain-effect {
            background-image: linear-gradient(transparent, transparent), linear-gradient(180deg, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.2) 1px, transparent 1px);
            background-size: 100% 100%, 2px 20px, 4px 30px;
            background-repeat: repeat;
            animation: rain-fall 0.5s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;
