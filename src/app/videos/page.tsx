"use client";

import { AlertCircle, ChevronDown, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

const categories = [
  { label: "Todo", query: "tendencias" },
  { label: "Música", query: "música" },
  { label: "Podcasts", query: "podcasts" },
  { label: "Tecnología", query: "tecnología" },
  { label: "Educación", query: "educación" },
  { label: "Entretenimiento", query: "entretenimiento" },
  { label: "Deportes", query: "deportes" },
  { label: "Noticias", query: "noticias" },
] as const;

export default function VideosPage() {
  const [query, setQuery] = useState("tendencias");
  const [order, setOrder] = useState<SearchOrder>("relevance");
  const [duration, setDuration] = useState<VideoDuration>("any");
  const [activeCategory, setActiveCategory] = useState("Todo");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeSearch, setActiveSearch] = useState<SearchParams | null>(null);
  const [page, setPage] = useState<SearchPage | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const requestId = useRef(0);
  const initialSearchStarted = useRef(false);
  const favorites = useFavorites();

  const executeSearch = useCallback(async (params: SearchParams, pageToken?: string) => {
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
    } catch (error) {
      if (currentRequest === requestId.current) setSearchError(getDataErrorMessage(error));
    } finally {
      if (currentRequest === requestId.current) setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (initialSearchStarted.current) return;
    initialSearchStarted.current = true;
    void executeSearch({ query: "tendencias", order: "relevance", duration: "any" });
  }, [executeSearch]);

  function submitSearch() {
    const normalizedQuery = query.trim().replace(/\s+/g, " ");
    if (normalizedQuery.length < 2) {
      setSearchError("Escribe al menos dos caracteres para buscar.");
      return;
    }
    setQuery(normalizedQuery);
    setActiveCategory("");
    void executeSearch({ query: normalizedQuery, order, duration });
  }

  function selectCategory(label: string, categoryQuery: string) {
    setActiveCategory(label);
    setQuery(categoryQuery);
    void executeSearch({ query: categoryQuery, order, duration });
  }

  function changePage(pageToken?: string) {
    if (!activeSearch || !pageToken) return;
    void executeSearch(activeSearch, pageToken).then(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  return (
    <AppShell
      search={{
        value: query,
        placeholder: "Buscar videos en YouTube...",
        loading: searching,
        onChange: setQuery,
        onSubmit: submitSearch,
      }}
    >
      <main className="app-main">
        <section className="page-heading discovery-heading">
          <div>
            <h1>Explorar videos</h1>
            <p>Descubre contenido increíble en YouTube y guarda tus favoritos.</p>
          </div>
        </section>

        <div className="discovery-status" role="status">
          <span className="status-primary"><Sparkles size={15} aria-hidden="true" />Exploración automática</span>
          <span>Sugerencias cargadas desde YouTube</span>
        </div>

        <div className="category-toolbar">
          <div className="category-list" aria-label="Categorías de videos">
            {categories.map((category) => (
              <button
                key={category.label}
                type="button"
                className={activeCategory === category.label ? "category-button active" : "category-button"}
                onClick={() => selectCategory(category.label, category.query)}
                disabled={searching && activeCategory === category.label}
                aria-pressed={activeCategory === category.label}
              >
                {category.label}
              </button>
            ))}
            <button
              type="button"
              className={filtersOpen ? "category-button filters active" : "category-button filters"}
              onClick={() => setFiltersOpen((current) => !current)}
              aria-expanded={filtersOpen}
            >
              Más <ChevronDown size={15} aria-hidden="true" />
            </button>
          </div>

          {filtersOpen && (
            <div className="filter-panel">
              <SlidersHorizontal size={19} aria-hidden="true" />
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
              <button type="button" className="apply-filters" onClick={submitSearch} disabled={searching}>Aplicar</button>
            </div>
          )}
        </div>

        {(searchError || favorites.error) && (
          <div className="page-alert" role="alert"><AlertCircle size={19} aria-hidden="true" />{searchError || favorites.error}</div>
        )}

        {searching && !page ? (
          <div className="video-grid" aria-label="Cargando resultados">
            {Array.from({ length: 6 }, (_, index) => <div className="video-skeleton" key={index} />)}
          </div>
        ) : page ? (
          <section className="results-section" aria-live="polite" aria-busy={searching}>
            <div className="results-meta">
              <span>{activeSearch?.query}</span>
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
                <button type="button" disabled={!page.previousPageToken || searching} onClick={() => changePage(page.previousPageToken)}>Anterior</button>
                <button type="button" disabled={!page.nextPageToken || searching} onClick={() => changePage(page.nextPageToken)}>Siguiente</button>
              </nav>
            )}
          </section>
        ) : (
          <div className="empty-state initial"><Search size={34} aria-hidden="true" /><h2>Encuentra tu próximo video</h2><p>Escribe un tema para comenzar.</p></div>
        )}
      </main>
      <VideoPlayerDialog video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </AppShell>
  );
}
