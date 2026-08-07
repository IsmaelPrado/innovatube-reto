import { decode } from "html-entities";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const MAX_RESULTS = 12;
const REQUEST_TIMEOUT_MS = 8_000;

export const SEARCH_ORDERS = ["relevance", "date", "viewCount", "rating"] as const;
export const VIDEO_DURATIONS = ["any", "short", "medium", "long"] as const;

export type SearchOrder = (typeof SEARCH_ORDERS)[number];
export type VideoDuration = (typeof VIDEO_DURATIONS)[number];

export type VideoSearchItem = {
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

export type VideoSearchPage = {
  items: VideoSearchItem[];
  nextPageToken?: string;
  previousPageToken?: string;
  totalResults: number;
};

export type SearchVideosInput = {
  query: string;
  apiKey: string;
  pageToken?: string | null;
  order?: SearchOrder | null;
  duration?: VideoDuration | null;
  fetcher?: typeof fetch;
};

type Thumbnail = { url?: string };

type SearchListResponse = {
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo?: { totalResults?: number };
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      publishedAt?: string;
      liveBroadcastContent?: "live" | "upcoming" | "none";
      thumbnails?: {
        high?: Thumbnail;
        medium?: Thumbnail;
        default?: Thumbnail;
      };
    };
  }>;
};

type VideoListResponse = {
  items?: Array<{
    id?: string;
    contentDetails?: { duration?: string };
    statistics?: { viewCount?: string };
  }>;
};

type YouTubeErrorResponse = {
  error?: {
    code?: number;
    message?: string;
    errors?: Array<{ reason?: string }>;
  };
};

export class YouTubeApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly reason?: string,
  ) {
    super(message);
    this.name = "YouTubeApiError";
  }
}

export function normalizeSearchInput(input: SearchVideosInput) {
  const query = input.query.trim().replace(/\s+/g, " ");
  if (query.length < 2 || query.length > 120) {
    throw new Error("La búsqueda debe tener entre 2 y 120 caracteres.");
  }

  const pageToken = input.pageToken?.trim() || undefined;
  if (pageToken && !/^[A-Za-z0-9_-]{1,256}$/.test(pageToken)) {
    throw new Error("El token de paginación no es válido.");
  }

  const order = input.order ?? "relevance";
  const duration = input.duration ?? "any";
  if (!SEARCH_ORDERS.includes(order)) {
    throw new Error("El orden seleccionado no es válido.");
  }
  if (!VIDEO_DURATIONS.includes(duration)) {
    throw new Error("La duración seleccionada no es válida.");
  }

  return { query, pageToken, order, duration };
}

export function formatIsoDuration(value?: string): string | undefined {
  if (!value) return undefined;
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return undefined;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const paddedSeconds = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
}

function buildSearchUrl(input: ReturnType<typeof normalizeSearchInput>, apiKey: string) {
  const params = new URLSearchParams({
    key: apiKey,
    part: "snippet",
    q: input.query,
    type: "video",
    maxResults: String(MAX_RESULTS),
    order: input.order,
    safeSearch: "moderate",
    videoEmbeddable: "true",
    regionCode: "MX",
    relevanceLanguage: "es",
  });

  if (input.duration !== "any") params.set("videoDuration", input.duration);
  if (input.pageToken) params.set("pageToken", input.pageToken);
  return `${YOUTUBE_API_BASE_URL}/search?${params.toString()}`;
}

function buildVideoDetailsUrl(ids: string[], apiKey: string) {
  const params = new URLSearchParams({
    key: apiKey,
    part: "contentDetails,statistics",
    id: ids.join(","),
  });
  return `${YOUTUBE_API_BASE_URL}/videos?${params.toString()}`;
}

async function fetchYouTubeJson<T>(url: string, fetcher: typeof fetch): Promise<T> {
  let response: Response;
  try {
    response = await fetcher(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "timeout" : "network";
    throw new YouTubeApiError("No fue posible conectar con YouTube.", 503, reason);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as YouTubeErrorResponse;
    throw new YouTubeApiError(
      "YouTube rechazó la solicitud.",
      response.status,
      body.error?.errors?.[0]?.reason,
    );
  }

  return (await response.json()) as T;
}

export async function searchYouTubeVideos(input: SearchVideosInput): Promise<VideoSearchPage> {
  const normalized = normalizeSearchInput(input);
  if (!input.apiKey) throw new Error("La integración con YouTube no está configurada.");
  const fetcher = input.fetcher ?? fetch;

  const searchResponse = await fetchYouTubeJson<SearchListResponse>(
    buildSearchUrl(normalized, input.apiKey),
    fetcher,
  );
  const searchItems = searchResponse.items ?? [];
  const ids = searchItems.flatMap((item) => (item.id?.videoId ? [item.id.videoId] : []));

  const details = ids.length
    ? await fetchYouTubeJson<VideoListResponse>(buildVideoDetailsUrl(ids, input.apiKey), fetcher)
    : { items: [] };
  const detailsById = new Map((details.items ?? []).map((item) => [item.id, item]));

  const items = searchItems.flatMap<VideoSearchItem>((item) => {
    const videoId = item.id?.videoId;
    const snippet = item.snippet;
    if (!videoId || !snippet?.title || !snippet.channelTitle || !snippet.publishedAt) return [];

    const detail = detailsById.get(videoId);
    const broadcast = snippet.liveBroadcastContent ?? "none";
    const duration = broadcast === "live" ? "En vivo" : formatIsoDuration(detail?.contentDetails?.duration);
    const thumbnailUrl =
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.medium?.url ??
      snippet.thumbnails?.default?.url ??
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return [
      {
        videoId,
        title: decode(snippet.title),
        description: decode(snippet.description ?? ""),
        channelTitle: decode(snippet.channelTitle),
        thumbnailUrl,
        publishedAt: snippet.publishedAt,
        duration,
        viewCount: detail?.statistics?.viewCount,
        isLive: broadcast === "live",
      },
    ];
  });

  return {
    items,
    nextPageToken: searchResponse.nextPageToken,
    previousPageToken: searchResponse.prevPageToken,
    totalResults: Math.min(searchResponse.pageInfo?.totalResults ?? items.length, 2_147_483_647),
  };
}

