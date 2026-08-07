import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VideoCard } from "./video-card";
import type { Video } from "@/types/video";

const video: Video = {
  videoId: "abc123",
  title: "Arquitecturas serverless en AWS",
  description: "Una introducción práctica",
  channelTitle: "InnovaTube",
  thumbnailUrl: "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
  publishedAt: "2026-01-10T00:00:00.000Z",
  duration: "12:04",
  viewCount: "15300",
  isLive: false,
};

describe("VideoCard", () => {
  it("opens the player from its thumbnail", () => {
    const onPlay = vi.fn();
    render(<VideoCard video={video} favorite={false} onPlay={onPlay} onToggleFavorite={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: `Reproducir ${video.title}` }));
    expect(onPlay).toHaveBeenCalledWith(video);
  });

  it("exposes and toggles the favorite state", () => {
    const onToggleFavorite = vi.fn();
    render(<VideoCard video={video} favorite onPlay={vi.fn()} onToggleFavorite={onToggleFavorite} />);

    const button = screen.getByRole("button", { name: "Quitar de favoritos" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);
    expect(onToggleFavorite).toHaveBeenCalledWith(video);
  });
});
