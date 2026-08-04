"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";
import { PLAYER_TRACK, usePlayer } from "./PlayerProvider";

function formatTime(percent: number, totalSeconds: number) {
  const seconds = Math.floor((percent / 100) * totalSeconds);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const {
    playing,
    progress,
    volume,
    duration,
    togglePlayback,
    seek,
    changeVolume,
  } = usePlayer();

  const totalSeconds = duration || PLAYER_TRACK.duration || 0;

  useEffect(() => {
    if (!playing) {
      return;
    }

    const speed = 51.4;
    const startedAt = performance.now();
    const startRotation = rotationRef.current;
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      const next = (startRotation + elapsed * speed) % 360;
      rotationRef.current = next;
      setRotation(next);
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing]);

  return (
    <div
      className="relative h-16 w-16 shrink-0 sm:w-[340px]"
      data-expanded={expanded}
      onMouseLeave={() => setExpanded(false)}
      onClick={() => setExpanded((value) => !value)}
    >
      <button
        type="button"
        onMouseEnter={() => setExpanded(true)}
        onClick={(event) => {
          event.stopPropagation();
          togglePlayback();
        }}
        className="absolute left-0 top-1/2 z-10 h-14 w-14 -translate-y-1/2 overflow-hidden rounded-full border-2 border-white/70 shadow-apple-sm dark:border-white/15"
        aria-label={playing ? "暂停" : "播放"}
      >
        <Image
          src="/pixels/luv-sic-album.jpg"
          alt="Luv(sic) Part 2 专辑封面"
          width={300}
          height={263}
          className="h-full w-full object-cover"
          style={{ transform: `rotate(${rotation}deg)` }}
          data-rotation={Math.round(rotation)}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/15 text-white opacity-0 transition-opacity duration-200 hover:opacity-100">
          {playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 translate-x-[1px]" />
          )}
        </span>
      </button>

      <div
        className={`absolute left-0 top-14 z-20 flex h-12 max-w-[calc(100vw-3rem)] items-center overflow-hidden rounded-full border border-white/60 bg-white/70 shadow-apple-hover backdrop-blur-2xl transition-all duration-300 ease-out dark:border-white/10 dark:bg-white/10 sm:left-16 sm:top-1/2 sm:h-14 sm:-translate-y-1/2 ${
          expanded
            ? "w-[236px] opacity-100 sm:w-[276px]"
            : "pointer-events-none w-0 opacity-0 sm:w-0"
        }`}
        data-player-strip={expanded ? "expanded" : "collapsed"}
      >
        <div className="grid w-full shrink-0 grid-cols-[1.25rem_1fr_2.5rem] items-center gap-x-2 gap-y-1.5 px-4">
          <span className="text-right font-mono text-[10px] text-ink-soft">
            {formatTime(100, totalSeconds)}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(event) => seek(Number(event.target.value))}
            className="pixel-range h-2"
            aria-label="播放进度"
          />
          <span className="text-right font-mono text-[10px] text-ink-soft">
            {formatTime(progress, totalSeconds)}
          </span>

          <Volume2 className="h-3.5 w-3.5 justify-self-center text-ink-soft" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(event) => changeVolume(Number(event.target.value))}
            className="pixel-range h-2"
            aria-label="音量"
          />
          <span className="text-right font-mono text-[10px] text-ink-soft">
            {volume}
          </span>
        </div>
      </div>
    </div>
  );
}
