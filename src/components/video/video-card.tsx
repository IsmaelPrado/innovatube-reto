"use client";

import { ExternalLink, Heart, Play } from "lucide-react";
import Image from "next/image";
import type { Video } from "@/types/video";

type VideoCardProps = {
  video: Video;
  favorite: boolean;
  pending?: boolean;
  onToggleFavorite: (video: Video) => void;
  onPlay: (video: Video) => void;
};

const numberFormatter = new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

function formatViews(viewCount?: string) {
  const count = Number(viewCount);
  return Number.isFinite(count) ? `${numberFormatter.format(count)} vistas` : undefined;
}

function formatDate(publishedAt: string) {
  const date = new Date(publishedAt);
  return Number.isNaN(date.getTime()) ? undefined : dateFormatter.format(date);
}

export function VideoCard({ video, favorite, pending, onToggleFavorite, onPlay }: VideoCardProps) {
  const views = formatViews(video.viewCount);
  const published = formatDate(video.publishedAt);

  return (
    <article className="video-card">
      <button className="video-thumbnail" type="button" onClick={() => onPlay(video)} aria-label={`Reproducir ${video.title}`}>
        <Image src={video.thumbnailUrl} alt="" fill sizes="(max-width: 680px) 100vw, (max-width: 1080px) 50vw, 33vw" />
        <span className="play-badge" aria-hidden="true"><Play size={22} fill="currentColor" /></span>
        {video.duration && <span className={video.isLive ? "duration-badge live" : "duration-badge"}>{video.duration}</span>}
      </button>
      <div className="video-card-body">
        <div className="video-card-heading">
          <button type="button" className="video-title" onClick={() => onPlay(video)}>{video.title}</button>
          <button
            type="button"
            className={favorite ? "favorite-button active" : "favorite-button"}
            onClick={() => onToggleFavorite(video)}
            disabled={pending}
            aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            aria-pressed={favorite}
            title={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <Heart size={20} fill={favorite ? "currentColor" : "none"} aria-hidden="true" />
          </button>
        </div>
        <p className="video-channel">{video.channelTitle}</p>
        <p className="video-metadata">{[views, published].filter(Boolean).join(" · ")}</p>
        <a className="youtube-link" href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noreferrer">
          Abrir en YouTube <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
