"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type CuteCatProps = {
  className?: string;
};

export default function CuteCat({ className }: CuteCatProps) {
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const triggerSpin = () => {
    setSpinning(true);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => setSpinning(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={triggerSpin}
      aria-label="点击小猫"
      className={`animate-float-soft shrink-0 cursor-pointer appearance-none bg-transparent p-0 ${
        className ?? ""
      }`}
    >
      {spinning ? (
        <Image
          src="https://imdoro.com/assets/doro-spin.gif"
          alt="Doro 转圈"
          width={256}
          height={256}
          unoptimized
          draggable={false}
          className="h-full w-auto object-contain"
        />
      ) : (
        <Image
          src="/pixels/cute-cat-clean.png"
          alt="可爱小猫"
          width={636}
          height={358}
          priority
          draggable={false}
          className="h-full w-auto object-contain"
        />
      )}
    </button>
  );
}
