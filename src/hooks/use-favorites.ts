"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getDataErrorMessage } from "@/lib/data-errors";
import { createFavorite, deleteFavorite, listAllFavorites } from "@/services/favorites";
import type { FavoriteRecord, Video } from "@/types/video";

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const favoritesByVideoId = useMemo(
    () => new Map(favorites.map((favorite) => [favorite.videoId, favorite])),
    [favorites],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setFavorites(await listAllFavorites());
    } catch (loadError) {
      setError(getDataErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(
    async (video: Video) => {
      if (pendingIds.has(video.videoId)) return;
      setError("");
      setPendingIds((current) => new Set(current).add(video.videoId));

      const existing = favoritesByVideoId.get(video.videoId);
      try {
        if (existing) {
          await deleteFavorite(existing.id);
          setFavorites((current) => current.filter((favorite) => favorite.id !== existing.id));
        } else {
          const created = await createFavorite(video);
          setFavorites((current) => [created, ...current]);
        }
      } catch (toggleError) {
        setError(getDataErrorMessage(toggleError));
      } finally {
        setPendingIds((current) => {
          const next = new Set(current);
          next.delete(video.videoId);
          return next;
        });
      }
    },
    [favoritesByVideoId, pendingIds],
  );

  return {
    favorites,
    favoritesByVideoId,
    pendingIds,
    loading,
    error,
    reload: load,
    toggle,
  };
}

