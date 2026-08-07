import type { Schema } from "../resource";
import { searchYouTubeVideos, YouTubeApiError } from "./youtube";

export const handler: Schema["searchVideos"]["functionHandler"] = async (event) => {
  const startedAt = performance.now();

  try {
    const result = await searchYouTubeVideos({
      query: event.arguments.query,
      pageToken: event.arguments.pageToken,
      order: event.arguments.order,
      duration: event.arguments.duration,
      apiKey: process.env.YOUTUBE_API_KEY ?? "",
    });

    console.info(
      JSON.stringify({
        event: "youtube.search.completed",
        resultCount: result.items.length,
        durationMs: Math.round(performance.now() - startedAt),
      }),
    );
    return result;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "youtube.search.failed",
        errorType: error instanceof Error ? error.name : "UnknownError",
        upstreamStatus: error instanceof YouTubeApiError ? error.status : undefined,
        upstreamReason: error instanceof YouTubeApiError ? error.reason : undefined,
        durationMs: Math.round(performance.now() - startedAt),
      }),
    );

    if (error instanceof YouTubeApiError && error.reason === "quotaExceeded") {
      throw new Error("La cuota de búsqueda de YouTube se agotó temporalmente.");
    }
    if (error instanceof YouTubeApiError) {
      throw new Error("YouTube no está disponible en este momento.");
    }
    if (error instanceof Error) throw error;
    throw new Error("No fue posible completar la búsqueda.");
  }
};

