import { describe, expect, it, vi } from "vitest";
import { formatIsoDuration, normalizeSearchInput, searchYouTubeVideos } from "./youtube";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("YouTube search adapter", () => {
  it("normalizes safe search inputs", () => {
    expect(normalizeSearchInput({ query: "  aws   lambda ", apiKey: "key" })).toEqual({
      query: "aws lambda",
      pageToken: undefined,
      order: "relevance",
      duration: "any",
    });
  });

  it("rejects malformed pagination tokens", () => {
    expect(() => normalizeSearchInput({ query: "aws", apiKey: "key", pageToken: "bad token!" })).toThrow(
      "El token de paginación no es válido.",
    );
  });

  it.each([
    ["PT8S", "0:08"],
    ["PT12M5S", "12:05"],
    ["PT1H2M9S", "1:02:09"],
  ])("formats ISO duration %s", (input, expected) => {
    expect(formatIsoDuration(input)).toBe(expected);
  });

  it("combines search and details responses into a normalized page", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({
          nextPageToken: "NEXT_1",
          pageInfo: { totalResults: 42 },
          items: [
            {
              id: { videoId: "video-1" },
              snippet: {
                title: "AWS &amp; Lambda",
                description: "Serverless &lt;3",
                channelTitle: "Cloud Channel",
                publishedAt: "2026-08-01T10:00:00Z",
                liveBroadcastContent: "none",
                thumbnails: { high: { url: "https://i.ytimg.com/vi/video-1/hqdefault.jpg" } },
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            {
              id: "video-1",
              contentDetails: { duration: "PT4M8S" },
              statistics: { viewCount: "12500" },
            },
          ],
        }),
      );

    const page = await searchYouTubeVideos({ query: "AWS", apiKey: "secret", fetcher });

    expect(page).toEqual({
      items: [
        {
          videoId: "video-1",
          title: "AWS & Lambda",
          description: "Serverless <3",
          channelTitle: "Cloud Channel",
          thumbnailUrl: "https://i.ytimg.com/vi/video-1/hqdefault.jpg",
          publishedAt: "2026-08-01T10:00:00Z",
          duration: "4:08",
          viewCount: "12500",
          isLive: false,
        },
      ],
      nextPageToken: "NEXT_1",
      previousPageToken: undefined,
      totalResults: 42,
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0]?.[0]).toContain("type=video");
    expect(fetcher.mock.calls[0]?.[0]).toContain("safeSearch=moderate");
  });

  it("maps upstream failures without leaking the response body", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ error: { message: "sensitive", errors: [{ reason: "quotaExceeded" }] } }, 403),
    );

    await expect(searchYouTubeVideos({ query: "AWS", apiKey: "secret", fetcher })).rejects.toMatchObject({
      name: "YouTubeApiError",
      status: 403,
      reason: "quotaExceeded",
    });
  });
});
