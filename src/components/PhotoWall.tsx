import { Camera } from "lucide-react";
import type { Photo } from "@/data/content";

export default function PhotoWall({ photos }: { photos: Photo[] }) {
  return (
    <div className="flex h-full flex-col p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <span className="chip pixel-font !text-[14px] text-accent-tangerine">
            07 // DAILY
          </span>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink">
            日常分享
          </h3>
        </div>
        <span className="pixel-font text-[14px] text-ink-soft">
          {photos.length} PHOTOS
        </span>
      </div>

      {photos.length > 0 ? (
        <div className="mt-5 grid flex-1 auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.slice(0, 8).map((photo, index) => (
            <figure
              key={photo.id}
              className={`group relative overflow-hidden rounded-2xl border border-white/50 bg-white/40 shadow-apple-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10 ${
                index === 0
                  ? "col-span-2 row-span-2 sm:col-span-2"
                  : ""
              }`}
            >
              <img
                src={photo.src}
                alt={photo.caption || "日常分享"}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
              {photo.caption ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-3 pb-2 pt-8 text-xs text-white/95">
                  {photo.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/60 bg-white/30 p-8 text-center dark:border-white/15 dark:bg-white/5">
          <Camera className="h-6 w-6 text-ink-soft" />
          <p className="text-sm text-ink-soft">照片墙还在整理中</p>
        </div>
      )}
    </div>
  );
}
