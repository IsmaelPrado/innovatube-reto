"use client";

import { AlertCircle, Heart, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { VideoCard } from "@/components/video/video-card";
import { VideoGridSkeleton } from "@/components/video/video-grid-skeleton";
import { VideoPlayerDialog } from "@/components/video/video-player-dialog";
import { useFavorites } from "@/hooks/use-favorites";
import { favoriteToVideo, type Video } from "@/types/video";

export default function FavoritesPage() {
  const [filter, setFilter] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const favorites = useFavorites();
  const videos = useMemo(() => {
    const term = filter.trim().toLocaleLowerCase("es-MX");
    return favorites.favorites
      .map(favoriteToVideo)
      .filter((video) => !term || `${video.title} ${video.channelTitle}`.toLocaleLowerCase("es-MX").includes(term));
  }, [favorites.favorites, filter]);

  return (
    <AppShell
      search={{
        value: filter,
        placeholder: "Buscar en tus favoritos...",
        onChange: setFilter,
        onSubmit: () => undefined,
      }}
    >
      <main className="app-main">
        <section className="page-heading favorites-heading">
          <div>
            <h1>Mis favoritos</h1>
            <p>Tu colección es privada y está vinculada a tu cuenta.</p>
          </div>
          <span className="collection-count"><Heart size={17} fill="currentColor" aria-hidden="true" />{favorites.favorites.length}</span>
        </section>

        {favorites.error && <div className="page-alert" role="alert"><AlertCircle size={19} aria-hidden="true" />{favorites.error}</div>}

        {favorites.loading ? (
          <VideoGridSkeleton label="Cargando favoritos" />
        ) : videos.length ? (
          <div className="video-grid">
            {videos.map((video) => (
              <VideoCard
                key={video.videoId}
                video={video}
                favorite
                pending={favorites.pendingIds.has(video.videoId)}
                onToggleFavorite={favorites.toggle}
                onPlay={setSelectedVideo}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state initial">
            {favorites.favorites.length ? <Search size={34} aria-hidden="true" /> : <Heart size={34} aria-hidden="true" />}
            <h2>{favorites.favorites.length ? "Sin coincidencias" : "Aún no tienes favoritos"}</h2>
            <p>{favorites.favorites.length ? "Prueba con otro título o canal." : "Marca videos desde el buscador para encontrarlos aquí."}</p>
          </div>
        )}
      </main>
      <VideoPlayerDialog video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </AppShell>
  );
}
