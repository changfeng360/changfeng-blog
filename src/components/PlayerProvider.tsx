"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export const PLAYER_TRACK = {
  title: "Luv(sic) Part 2",
  artist: "Nujabes feat. Shing02",
  src: "/music/luv-sic-part-2.mp3",
  duration: 270.26,
};

type PlayerContextValue = {
  playing: boolean;
  progress: number;
  volume: number;
  duration: number;
  togglePlayback: () => void;
  seek: (value: number) => void;
  changeVolume: (value: number) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(62);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopPlayback = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    audioRef.current?.pause();
    setPlaying(false);
  };

  const startPlayback = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = volume / 100;
    if (audio.duration > 0) {
      audio.currentTime = (progress / 100) * audio.duration;
    }
    void audio.play().catch(() => setPlaying(false));
    setPlaying(true);

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
    }
    timerRef.current = window.setInterval(() => {
      if (audio.duration > 0) {
        setProgress(
          Math.min(100, (audio.currentTime / audio.duration) * 100),
        );
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      audioRef.current?.pause();
    };
  }, []);

  const togglePlayback = () => {
    if (playing) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const seek = (value: number) => {
    setProgress(value);
    if (playing && audioRef.current && audioRef.current.duration > 0) {
      audioRef.current.currentTime =
        (value / 100) * audioRef.current.duration;
    }
  };

  const changeVolume = (value: number) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value / 100;
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        playing,
        progress,
        volume,
        duration,
        togglePlayback,
        seek,
        changeVolume,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        src={PLAYER_TRACK.src}
        loop
        preload="metadata"
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration);
        }}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used inside PlayerProvider");
  }
  return context;
}
