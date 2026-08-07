"use client";

import { AlertCircle, ChevronDown, RefreshCw, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { VideoCard } from "@/components/video/video-card";
import { VideoGridSkeleton } from "@/components/video/video-grid-skeleton";
import { VideoPlayerDialog } from "@/components/video/video-player-dialog";
import { useFavorites } from "@/hooks/use-favorites";
import { dataClient } from "@/lib/data-client";
import { getDataErrorMessage } from "@/lib/data-errors";
import { mergeVideos } from "@/lib/video-results";
import type { Video } from "@/types/video";

type SearchOrder = "relevance" | "date" | "viewCount" | "rating";
type VideoDuration = "any" | "short" | "medium" | "long";
type SearchParams = { query: string; order: SearchOrder; duration: VideoDuration };
type SearchPage = {
  items: Video[];
  nextPageToken?: string;
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
  const [loadingMode, setLoadingMode] = useState<"initial" | "more" | null>(null);
  const [loadMoreBlocked, setLoadMoreBlocked] = useState(false);
  const [searchError, setSearchError] = useState("");
  const requestId = useRef(0);
  const initialSearchStarted = useRef(false);
  const loadMoreSentinel = useRef<HTMLDivElement>(null);
  const favorites = useFavorites();
  const searching = loadingMode !== null;

  const executeSearch = useCallback(async (params: SearchParams, pageToken?: string, append = false) => {
    const currentRequest = ++requestId.current;
    setLoadingMode(append ? "more" : "initial");
    setSearchError("");
    setLoadMoreBlocked(false);
    if (!append) setPage(null);

    try {
      const response = await dataClient.queries.searchVideos(
        { ...params, pageToken },
        { authMode: "userPool" },
      );
      if (currentRequest !== requestId.current) return;
      if (response.errors?.length || !response.data) throw new Error(response.errors?.[0]?.message);
      const data = response.data;

      const items = (data.items ?? [])
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .map((item) => ({
          ...item,
          duration: item.duration ?? undefined,
          viewCount: item.viewCount ?? undefined,
        }));

      setPage((current) => ({
        items: append && current ? mergeVideos(current.items, items) : items,
        nextPageToken: data.nextPageToken === pageToken ? undefined : data.nextPageToken ?? undefined,
        totalResults: data.totalResults,
      }));
      setActiveSearch(params);
    } catch (error) {
      if (currentRequest === requestId.current) {
        setSearchError(getDataErrorMessage(error));
        setLoadMoreBlocked(append);
      }
    } finally {
      if (currentRequest === requestId.current) setLoadingMode(null);
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

  const loadMore = useCallback(() => {
    if (!activeSearch || !page?.nextPageToken || searching || loadMoreBlocked) return;
    void executeSearch(activeSearch, page.nextPageToken, true);
  }, [activeSearch, executeSearch, loadMoreBlocked, page?.nextPageToken, searching]);

  useEffect(() => {
    const target = loadMoreSentinel.current;
    if (!target || !page?.nextPageToken || loadMoreBlocked) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, loadMoreBlocked, page?.nextPageToken]);

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

          {filtersOpen ? (
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
          ) : null}
        </div>

        {(searchError || favorites.error) && !loadMoreBlocked ? (
          <div className="page-alert" role="alert"><AlertCircle size={19} aria-hidden="true" />{searchError || favorites.error}</div>
        ) : null}

        {loadingMode === "initial" ? (
          <VideoGridSkeleton label="Buscando videos en YouTube" />
        ) : page ? (
          <section className="results-section" aria-live="polite" aria-busy={searching}>
            <div className="results-meta">
              <span>{activeSearch?.query}</span>
              <span>{new Intl.NumberFormat("es-MX").format(page.totalResults)} resultados</span>
            </div>
            {page.items.length ? (
              <div className="video-grid">
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
            ) : (
              <div className="empty-state"><Search size={30} aria-hidden="true" /><h2>Sin resultados</h2><p>Prueba con otros términos o cambia los filtros.</p></div>
            )}
            {loadingMode === "more" ? <VideoGridSkeleton count={3} label="Cargando más videos" incremental /> : null}
            {loadMoreBlocked && page.nextPageToken ? (
              <div className="load-more-retry" role="alert">
                <p>{searchError || "No fue posible cargar el siguiente bloque."}</p>
                <button type="button" onClick={() => { setLoadMoreBlocked(false); setSearchError(""); }}>
                  <RefreshCw size={17} aria-hidden="true" />Reintentar
                </button>
              </div>
            ) : null}
            {page.nextPageToken && !loadMoreBlocked ? <div ref={loadMoreSentinel} className="scroll-sentinel" aria-hidden="true" /> : null}
            {!page.nextPageToken && page.items.length ? <p className="results-end">Llegaste al final de los resultados.</p> : null}
          </section>
        ) : (
          <div className="empty-state initial"><Search size={34} aria-hidden="true" /><h2>Encuentra tu próximo video</h2><p>Escribe un tema para comenzar.</p></div>
        )}
      </main>
      <VideoPlayerDialog video={selectedVideo} onClose={() => setSelectedVideo(null)} />
    </AppShell>
  );
}
