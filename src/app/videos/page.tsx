"use client";

import { AlertCircle, Search } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { VideoCard } from "@/components/video/video-card";
import { VideoPlayerDialog } from "@/components/video/video-player-dialog";
import { useFavorites } from "@/hooks/use-favorites";
import { dataClient } from "@/lib/data-client";
import { getDataErrorMessage } from "@/lib/data-errors";
import type { Video } from "@/types/video";

type SearchOrder = "relevance" | "date" | "viewCount" | "rating";
type VideoDuration = "any" | "short" | "medium" | "long";
type SearchParams = { query: string; order: SearchOrder; duration: VideoDuration };
type SearchPage = {
  items: Video[];
  nextPageToken?: string;
  previousPageToken?: string;
  totalResults: number;
};

export default function VideosPage() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<SearchOrder>("relevance");
  const [duration, setDuration] = useState<VideoDuration>("any");
  const [activeSearch, setActiveSearch] = useState<SearchParams | null>(null);
  const [page, setPage] = useState<SearchPage | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const requestId = useRef(0);
  const favorites = useFavorites();

  async function executeSearch(params: SearchParams, pageToken?: string) {
    const currentRequest = ++requestId.current;
    setSearching(true);
    setSearchError("");
    try {
      const response = await dataClient.queries.searchVideos(
        { ...params, pageToken },
        { authMode: "userPool" },
      );
      if (currentRequest !== requestId.current) return;
      if (response.errors?.length || !response.data) throw new Error(response.errors?.[0]?.message);

      const items = (response.data.items ?? [])
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .map((item) => ({
          ...item,
          duration: item.duration ?? undefined,
          viewCount: item.viewCount ?? undefined,
        }));
      setPage({
        items,
        nextPageToken: response.data.nextPageToken ?? undefined,
        previousPageToken: response.data.previousPageToken ?? undefined,
        totalResults: response.data.totalResults,
      });
      setActiveSearch(params);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (currentRequest === requestId.current) setSearchError(getDataErrorMessage(error));
    } finally {
      if (currentRequest === requestId.current) setSearching(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim().replace(/\s+/g, " ");
    if (normalizedQuery.length < 2) {
      setSearchError("Escribe al menos dos caracteres para buscar.");
      return;
    }
    setQuery(normalizedQuery);
    void executeSearch({ query: normalizedQuery, order, duration });
  }

  function changePage(pageToken?: string) {
    if (activeSearch && pageToken) void executeSearch(activeSearch, pageToken);
  }

  return (
    <AppShell>
      <main className="app-main">
        <section className="page-heading">
          <div>
            <h1>Explorar videos</h1>
            <p>Busca contenido de YouTube y conserva tus hallazgos en una colección privada.</p>
          </div>
        </section>

        <form className="search-toolbar" onSubmit={handleSubmit}>
          <label className="search-field">
            <span className="sr-only">Buscar videos</span>
            <Search size={20} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={120} placeholder="Buscar videos en YouTube" />
          </label>
          <label className="filter-field">
            <span>Orden</span>
            <select value={order} onChange={(event) => setOrder(event.target.value as SearchOrder)}>
              <option value="relevance">Relevancia</option>
              <option value="date">Más recientes</option>
              <option value="viewCount">Más vistos</option>
              <option value="rating">Mejor valorados</option>
            </select>
          </label>
          <label className="filter-field">
            <span>Duración</span>
            <select value={duration} onChange={(event) => setDuration(event.target.value as VideoDuration)}>
              <option value="any">Cualquiera</option>
              <option value="short">Menos de 4 min</option>
              <option value="medium">De 4 a 20 min</option>
              <option value="long">Más de 20 min</option>
            </select>
          </label>
          <button className="primary-button search-submit" type="submit" disabled={searching}>
            {searching ? <span className="spinner" aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
            {searching ? "Buscando" : "Buscar"}
          </button>
        </form>

        {(searchError || favorites.error) && (
          <div className="page-alert" role="alert"><AlertCircle size={19} aria-hidden="true" />{searchError || favorites.error}</div>
        )}

        {searching && !page ? (
          <div className="video-grid" aria-label="Cargando resultados">
            {Array.from({ length: 6 }, (_, index) => <div className="video-skeleton" key={index} />)}
          </div>
        ) : page ? (
          <section className="results-section" aria-live="polite" aria-busy={searching}>
            <div className="results-heading">
              <h2>Resultados para “{activeSearch?.query}”</h2>
              <span>{new Intl.NumberFormat("es-MX").format(page.totalResults)} resultados</span>
            </div>
            {page.items.length ? (
              <div className={searching ? "video-grid loading" : "video-grid"}>
                {page.items.map((video) => (
                  <VideoCard
                    key={video.videoId}
                    video={video}
                    favorite={favorites.favoritesByVideoId.has(video.videoId)}
                    pending={favorites.pendingIds.has(video.videoId)}
                    onToggleFavorite={favorites.toggle}
                    onPlay={setSelectedVideo}
                  />
                ))}
              </div>
            ) : <div className="empty-state"><Search size={30} aria-hidden="true" /><h2>Sin resultados</h2><p>Prueba con otros términos o cambia los filtros.</p></div>}
            {(page.previousPageToken || page.nextPageToken) && (
              <nav className="pagination" aria-label="Páginas de resultados">
                <button className="secondary-button" type="button" disabled={!page.previousPageToken || searching} onClick={() => changePage(page.previousPageToken)}>Anterior</button>
                <button className="secondary-button" type="button" disabled={!page.nextPageToken || searching} onClick={() => changePage(page.nextPageToken)}>Siguiente</button>
              </nav>
            )}
          </section>
        ) : (
          <div className="empty-state initial"><Search size={34} aria-hidden="true" /><h2>Encuentra tu próximo video</h2><p>Escribe un tema y ajusta los filtros para comenzar.</p></div>
        )}
      </main>
      <VideoPlayerDialog video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </AppShell>
  );
}
