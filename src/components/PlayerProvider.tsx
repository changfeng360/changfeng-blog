"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  src: string;
  cover: string;
  duration: number;
};

export type PlaybackMode = "sequential" | "single" | "shuffle";

export const PLAYLIST: PlayerTrack[] = [
  {
    id: "luv-sic",
    title: "Luv(sic) Part 2",
    artist: "Nujabes feat. Shing02",
    src: "/music/luv-sic-part-2.mp3",
    cover: "/pixels/luv-sic-album.jpg",
    duration: 270.26,
  },
  {
    id: "sacred-play",
    title: "Sacred Play Secret Place",
    artist: "Matryoshka",
    src: "/music/sacred-play-secret-place.mp3",
    cover: "/pixels/cover-sacred-play.jpg",
    duration: 317.55,
  },
  {
    id: "unnamed-summer",
    title: "未命名夏天",
    artist: "木宇ning",
    src: "/music/unnamed-summer-2022.mp3",
    cover: "/pixels/cover-summer.jpg",
    duration: 246.19,
  },
  {
    id: "blue-dragon",
    title: "Blue Dragon (piano & guitar ver.)",
    artist: "澤野弘之",
    src: "/music/blue-dragon-piano-guitar.mp3",
    cover: "/pixels/cover-blue-dragon.jpg",
    duration: 213.36,
  },
];

export const PLAYER_TRACK = PLAYLIST[0];

type PlayerContextValue = {
  playing: boolean;
  progress: number;
  volume: number;
  duration: number;
  currentTrack: PlayerTrack | null;
  trackIndex: number | null;
  playbackMode: PlaybackMode;
  togglePlayback: () => void;
  seek: (value: number) => void;
  changeVolume: (value: number) => void;
  selectTrack: (index: number) => void;
  cyclePlaybackMode: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
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
  const [trackIndex, setTrackIndex] = useState<number | null>(null);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("sequential");

  const currentTrack = trackIndex === null ? null : PLAYLIST[trackIndex];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const playRequestedRef = useRef(false);
  const historyRef = useRef<number[]>([]);

  const stopPlayback = () => {
    playRequestedRef.current = false;
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    audioRef.current?.pause();
    setPlaying(false);
  };

  const startPlayback = (startAt = progress) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = volume / 100;
    if (audio.duration > 0) {
      audio.currentTime = (startAt / 100) * audio.duration;
    }
    playRequestedRef.current = true;
    void audio.play().catch((error) => {
      if (error?.name !== "AbortError") {
        playRequestedRef.current = false;
        setPlaying(false);
      }
    });
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

  const pickRandomIndex = (current: number) => {
    const candidates = PLAYLIST.map((_, index) => index).filter(
      (index) => index !== current,
    );
    if (candidates.length === 0) {
      return null;
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const playTrack = (index: number, recordHistory = true) => {
    const count = PLAYLIST.length;
    const nextIndex = Math.max(0, Math.min(count - 1, index));
    const audio = audioRef.current;

    if (recordHistory && trackIndex !== null && nextIndex !== trackIndex) {
      historyRef.current.push(trackIndex);
      if (historyRef.current.length > 30) {
        historyRef.current.shift();
      }
    }

    if (audio) {
      audio.src = PLAYLIST[nextIndex].src;
      audio.load();
      audio.currentTime = 0;
      audio.volume = volume / 100;
    }

    setTrackIndex(nextIndex);
    setProgress(0);
    setDuration(0);
    startPlayback(0);
  };

  const selectTrack = (index: number) => {
    playTrack(index);
  };

  const nextTrack = () => {
    if (trackIndex === null) {
      return;
    }
    if (playbackMode === "shuffle") {
      const nextIndex = pickRandomIndex(trackIndex);
      if (nextIndex !== null) {
        playTrack(nextIndex);
      }
      return;
    }
    if (trackIndex >= PLAYLIST.length - 1) {
      return;
    }
    playTrack(trackIndex + 1);
  };

  const previousTrack = () => {
    if (trackIndex === null) {
      return;
    }
    if (playbackMode === "shuffle") {
      const previous = historyRef.current.pop();
      if (
        typeof previous === "number" &&
        previous >= 0 &&
        previous < PLAYLIST.length &&
        previous !== trackIndex
      ) {
        playTrack(previous, false);
        return;
      }
    }
    if (trackIndex <= 0) {
      return;
    }
    playTrack(trackIndex - 1);
  };

  const handleEnded = () => {
    if (trackIndex === null) {
      return;
    }
    if (playbackMode === "single") {
      startPlayback(0);
      return;
    }
    if (playbackMode === "shuffle") {
      const nextIndex = pickRandomIndex(trackIndex);
      if (nextIndex !== null) {
        playTrack(nextIndex);
      } else {
        stopPlayback();
      }
      return;
    }
    if (trackIndex >= PLAYLIST.length - 1) {
      setProgress(100);
      stopPlayback();
      return;
    }
    nextTrack();
  };

  const cyclePlaybackMode = () => {
    setPlaybackMode((current) => {
      const order: PlaybackMode[] = ["sequential", "single", "shuffle"];
      return order[(order.indexOf(current) + 1) % order.length];
    });
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
    if (trackIndex === null) {
      return;
    }
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
        currentTrack,
        trackIndex,
        playbackMode,
        togglePlayback,
        seek,
        changeVolume,
        selectTrack,
        cyclePlaybackMode,
        nextTrack,
        previousTrack,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        src={currentTrack?.src ?? ""}
        preload="metadata"
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration);
          if (playRequestedRef.current) {
            void event.currentTarget.play().catch(() => {
              playRequestedRef.current = false;
              setPlaying(false);
            });
          }
        }}
        onEnded={handleEnded}
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
