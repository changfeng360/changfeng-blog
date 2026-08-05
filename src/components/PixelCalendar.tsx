"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

export default function PixelCalendar() {
  const today = new Date();
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const firstDay = new Date(view.year, view.month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((startOffset + daysInMonth) / 7) * 7 },
    (_, index) => {
      const dayNumber = index - startOffset + 1;
      return dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : null;
    },
  );

  const isToday = (day: number) =>
    day === today.getDate() &&
    view.month === today.getMonth() &&
    view.year === today.getFullYear();

  const move = (delta: number) => {
    setView((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink">Calendar</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => move(-1)}
            className="icon-button !h-8 !w-8"
            aria-label="上一个月"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            className="icon-button !h-8 !w-8"
            aria-label="下一个月"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="pixel-panel rounded-2xl p-3">
        <div className="pixel-font mb-3 flex items-center justify-between text-[12px] text-pixel-ink">
          <span>{view.year}</span>
          <span className="text-accent-pink">
            {new Intl.DateTimeFormat("en-US", { month: "long" }).format(
              new Date(view.year, view.month, 1),
            )}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="pixel-font pb-1 text-[7px] text-pixel-ink/60"
            >
              {day}
            </div>
          ))}
          {cells.map((day, index) => (
            <div
              key={`${day ?? "empty"}-${index}`}
              className="flex aspect-square items-center justify-center"
            >
              {day ? (
                <span
                  className={`pixel-font flex h-7 w-7 items-center justify-center text-[14px] ${
                    isToday(day)
                      ? "border-2 border-pixel-ink bg-pixel-gold text-pixel-ink shadow-pixel-sm"
                      : "text-pixel-ink/80"
                  }`}
                >
                  {day}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-soft">
        <span className="inline-block h-2 w-2 border border-pixel-ink bg-pixel-gold" />
        Today
        <span className="ml-auto pixel-font text-[14px] text-pixel-ink">
          {daysInMonth} DAYS
        </span>
      </div>
    </div>
  );
}
