import { describe, expect, it } from "vitest";
import { createFavoriteId, favoriteToVideo, type FavoriteRecord } from "./video";

describe("video helpers", () => {
  it("builds a stable favorite id scoped to the user", () => {
    expect(createFavoriteId("user-123", "video-456")).toBe("user-123:video-456");
  });

  it("removes GraphQL nulls when converting a favorite", () => {
    const favorite = {
      id: "favorite-1",
      videoId: "video-1",
      title: "AWS desde cero",
      description: "Descripción",
      channelTitle: "InnovaTube",
      thumbnailUrl: "https://i.ytimg.com/vi/video-1/hqdefault.jpg",
      publishedAt: "2026-01-01T00:00:00.000Z",
      duration: null,
      viewCount: null,
      isLive: false,
    } as FavoriteRecord;

    expect(favoriteToVideo(favorite)).toEqual({
      videoId: "video-1",
      title: "AWS desde cero",
      description: "Descripción",
      channelTitle: "InnovaTube",
      thumbnailUrl: "https://i.ytimg.com/vi/video-1/hqdefault.jpg",
      publishedAt: "2026-01-01T00:00:00.000Z",
      duration: undefined,
      viewCount: undefined,
      isLive: false,
    });
  });
});
