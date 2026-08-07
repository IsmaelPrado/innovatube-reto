import { getCurrentUser } from "aws-amplify/auth";
import { dataClient } from "@/lib/data-client";
import { createFavoriteId, type FavoriteRecord, type Video } from "@/types/video";

export async function listAllFavorites(): Promise<FavoriteRecord[]> {
  const favorites: FavoriteRecord[] = [];
  let nextToken: string | null | undefined;

  do {
    const response = await dataClient.models.Favorite.list({ limit: 100, nextToken });
    if (response.errors?.length) throw new Error(response.errors[0]?.message);
    favorites.push(...response.data);
    nextToken = response.nextToken;
  } while (nextToken);

  return favorites.sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));
}

export async function createFavorite(video: Video): Promise<FavoriteRecord> {
  const user = await getCurrentUser();
  const response = await dataClient.models.Favorite.create(
    {
      id: createFavoriteId(user.userId, video.videoId),
      videoId: video.videoId,
      title: video.title,
      description: video.description,
      channelTitle: video.channelTitle,
      thumbnailUrl: video.thumbnailUrl,
      publishedAt: video.publishedAt,
      duration: video.duration,
      viewCount: video.viewCount,
      isLive: video.isLive,
    },
    { authMode: "userPool" },
  );

  if (response.errors?.length || !response.data) throw new Error(response.errors?.[0]?.message);
  return response.data;
}

export async function deleteFavorite(favoriteId: string) {
  const response = await dataClient.models.Favorite.delete({ id: favoriteId }, { authMode: "userPool" });
  if (response.errors?.length) throw new Error(response.errors[0]?.message);
}
