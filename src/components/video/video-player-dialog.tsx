"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import type { Video } from "@/types/video";

type VideoPlayerDialogProps = {
  video: Video | null;
  onClose: () => void;
};

export function VideoPlayerDialog({ video, onClose }: VideoPlayerDialogProps) {
  useEffect(() => {
    if (!video) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, video]);

  if (!video) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="player-dialog" role="dialog" aria-modal="true" aria-labelledby="player-title">
        <div className="player-dialog-header">
          <div>
            <h2 id="player-title">{video.title}</h2>
            <p>{video.channelTitle}</p>
          </div>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar reproductor" title="Cerrar">
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className="player-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </section>
    </div>
  );
}
