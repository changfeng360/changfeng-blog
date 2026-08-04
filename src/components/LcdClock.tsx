"use client";

import { useEffect, useState } from "react";
import { CloudSun, MapPin } from "lucide-react";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export default function LcdClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const date = now
    ? `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`
    : "----.--.--";
  const weekday = now ? weekdays[now.getDay()] : "---";
  const time = now
    ? `${pad(now.getHours())}:${pad(now.getMinutes())}`
    : "--:--";
  const seconds = now ? pad(now.getSeconds()) : "--";

  return (
    <div className="flex h-full flex-col justify-between gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <CloudSun className="h-4 w-4 text-accent-tangerine" />
          LCD Clock
        </div>
        <span className="chip pixel-font !text-[14px]">LIVE</span>
      </div>

      <div className="lcd-screen rounded-2xl p-4">
        <div className="pixel-font flex items-baseline gap-2 text-4xl leading-none sm:text-5xl">
          <span>{time}</span>
          <span className="animate-blink-cursor text-lg">:</span>
          <span className="text-lg">{seconds}</span>
        </div>
        <div className="pixel-font mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-cyan-200/80">
          <span>{date}</span>
          <span className="text-pixel-gold">{weekday}</span>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-cyan-300/10 pt-3 text-[12px]">
          <MapPin className="h-3 w-3" />
          <span className="pixel-font">HKG / 27C / CLOUDY</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span>Hong Kong</span>
        <span>Humidity 68%</span>
      </div>
    </div>
  );
}
