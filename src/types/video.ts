import type { Schema } from "../../amplify/data/resource";

export type Video = {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration?: string;
  viewCount?: string;
  isLive: boolean;
};

export type FavoriteRecord = Schema["Favorite"]["type"];

export function favoriteToVideo(favorite: FavoriteRecord): Video {
  return {
    videoId: favorite.videoId,
    title: favorite.title,
    description: favorite.description,
    channelTitle: favorite.channelTitle,
    thumbnailUrl: favorite.thumbnailUrl,
    publishedAt: favorite.publishedAt,
    duration: favorite.duration ?? undefined,
    viewCount: favorite.viewCount ?? undefined,
    isLive: favorite.isLive,
  };
}

export function createFavoriteId(userId: string, videoId: string) {
  return `${userId}:${videoId}`;
}

