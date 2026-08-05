"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import {
  ListMusic,
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { PLAYLIST, usePlayer, type PlaybackMode } from "./PlayerProvider";

const FALLBACK_COVER = "/pixels/luv-sic-album.jpg";
const MODE_LABELS: Record<PlaybackMode, string> = {
  sequential: "顺序",
  single: "单曲",
  shuffle: "乱序",
};

function formatTime(percent: number, totalSeconds: number) {
  const seconds = Math.floor((percent / 100) * totalSeconds);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const {
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
  } = usePlayer();

  const hasTrack = currentTrack !== null;
  const totalSeconds = duration || currentTrack?.duration || 0;
  const canPrevious =
    hasTrack &&
    (playbackMode === "shuffle" ? true : (trackIndex ?? 0) > 0);
  const canNext =
    hasTrack &&
    (playbackMode === "shuffle"
      ? true
      : (trackIndex ?? 0) < PLAYLIST.length - 1);

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

  useEffect(() => {
    rotationRef.current = 0;
    setRotation(0);
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!playlistOpen) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (
        playerRef.current &&
        !playerRef.current.contains(event.target as Node)
      ) {
        setPlaylistOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [playlistOpen]);

  useEffect(() => {
    if (!expanded) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (
        playerRef.current &&
        !playerRef.current.contains(event.target as Node)
      ) {
        setExpanded(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [expanded]);

  return (
    <div
      ref={playerRef}
      className="relative h-24 w-16 shrink-0 sm:w-[340px]"
      data-expanded={expanded}
      onMouseLeave={(event) => {
        const related = event.relatedTarget as Node | null;
        if (
          playlistOpen ||
          (related && playerRef.current?.contains(related))
        ) {
          return;
        }
        setExpanded(false);
      }}
      onClick={() => setExpanded((value) => !value)}
    >
      <button
        type="button"
        onMouseEnter={() => setExpanded(true)}
        onClick={(event) => {
          event.stopPropagation();
          if (!currentTrack) {
            setExpanded(true);
            setPlaylistOpen(true);
          } else {
            togglePlayback();
          }
        }}
        className={`absolute left-0 top-1/2 z-10 h-14 w-14 -translate-y-1/2 overflow-hidden rounded-full border-2 border-white/70 shadow-apple-sm dark:border-white/15 ${
          currentTrack ? "bg-pixel-slate" : "bg-black"
        }`}
        aria-label={
          currentTrack ? (playing ? "暂停" : "播放") : "选择音乐"
        }
      >
        {currentTrack ? (
          <img
            src={currentTrack.cover}
            alt={`${currentTrack.title} 专辑封面`}
            draggable={false}
            className="h-full w-full object-cover"
            style={{ transform: `rotate(${rotation}deg)` }}
            data-rotation={Math.round(rotation)}
            onError={(event) => {
              const image = event.currentTarget;
              if (!image.dataset.fallbackUsed) {
                image.dataset.fallbackUsed = "1";
                image.src = FALLBACK_COVER;
              }
            }}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-white">
            <Music className="h-6 w-6" />
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/15 text-white opacity-0 transition-opacity duration-200 hover:opacity-100">
          {playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 translate-x-[1px]" />
          )}
        </span>
      </button>

      <div
        className={`absolute left-0 top-16 z-20 flex h-[104px] max-w-[calc(100vw-3rem)] items-center overflow-hidden rounded-full border border-white/60 bg-white/70 shadow-apple-hover backdrop-blur-2xl transition-all duration-300 ease-out dark:border-white/10 dark:bg-white/10 sm:left-16 sm:top-1/2 sm:h-24 sm:-translate-y-1/2 ${
          expanded
            ? "w-[260px] opacity-100 sm:w-[320px]"
            : "pointer-events-none w-0 opacity-0 sm:w-0"
        }`}
        data-player-strip={expanded ? "expanded" : "collapsed"}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="w-full shrink-0 space-y-2 px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-ink">
                {currentTrack?.title ?? "选择音乐"}
              </p>
              <p className="truncate text-[10px] text-ink-soft">
                {currentTrack?.artist ?? "从播放列表选择"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  previousTrack();
                }}
                disabled={!canPrevious}
                className="icon-button !h-7 !w-7 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="上一首"
                title="上一首"
              >
                <SkipBack className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  nextTrack();
                }}
                disabled={!canNext}
                className="icon-button !h-7 !w-7 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="下一首"
                title="下一首"
              >
                <SkipForward className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  cyclePlaybackMode();
                }}
                className="flex h-7 items-center gap-1 rounded-full border border-white/60 bg-white/70 px-2 text-[10px] font-medium text-ink-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white"
                aria-label={`播放模式：${MODE_LABELS[playbackMode]}`}
                title={`播放模式：${MODE_LABELS[playbackMode]}`}
              >
                {playbackMode === "shuffle" ? (
                  <Shuffle className="h-3 w-3" />
                ) : playbackMode === "single" ? (
                  <Repeat1 className="h-3 w-3" />
                ) : (
                  <Repeat className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">
                  {MODE_LABELS[playbackMode]}
                </span>
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setPlaylistOpen((value) => !value);
                }}
                className="icon-button !h-7 !w-7"
                aria-label="播放列表"
                title="播放列表"
              >
                <ListMusic className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid w-full grid-cols-[1.25rem_1fr_2.5rem] items-center gap-x-2 gap-y-1.5">
            <span className="text-right font-mono text-[10px] text-ink-soft">
              {formatTime(100, totalSeconds)}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(event) => seek(Number(event.target.value))}
              disabled={!hasTrack}
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

      {playlistOpen ? (
        <div
          className="absolute left-0 top-full z-30 mt-2 w-[min(300px,calc(100vw-3rem))] rounded-3xl border border-white/60 bg-white/90 p-2 shadow-apple-hover backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 sm:left-16"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="pixel-font px-3 pb-1.5 pt-1 text-[11px] text-ink-soft">
            PLAYLIST
          </p>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {PLAYLIST.map((track, index) => {
              const active = index === trackIndex;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    selectTrack(index);
                    setPlaylistOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all duration-150 ease-out active:scale-[0.98] ${
                    active
                      ? "border border-pixel-ink bg-pixel-cream text-pixel-ink shadow-pixel-sm"
                      : "border border-transparent hover:bg-white/80 dark:hover:bg-white/10"
                  }`}
                >
                  <img
                    src={track.cover}
                    alt=""
                    draggable={false}
                    className="h-9 w-9 shrink-0 rounded-lg border border-white/40 object-cover dark:border-white/10"
                    onError={(event) => {
                      const image = event.currentTarget;
                      if (!image.dataset.fallbackUsed) {
                        image.dataset.fallbackUsed = "1";
                        image.src = FALLBACK_COVER;
                      }
                    }}
                  />
                  <span className="pixel-font shrink-0 text-[11px] text-ink-soft">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {track.title}
                    </span>
                    <span className="block truncate text-xs text-ink-soft">
                      {track.artist}
                    </span>
                  </span>
                  {active ? (
                    <span className="pixel-font shrink-0 text-[10px] text-accent-pink">
                      NOW
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
