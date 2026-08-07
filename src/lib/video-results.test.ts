import { describe, expect, it } from "vitest";
import type { Video } from "@/types/video";
import { mergeVideos } from "./video-results";

function video(videoId: string, title = videoId): Video {
  return {
    videoId,
    title,
    description: "",
    channelTitle: "Canal",
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    publishedAt: "2026-01-01T00:00:00.000Z",
    isLive: false,
  };
}

describe("mergeVideos", () => {
  it("preserves order and removes overlaps between YouTube pages", () => {
    expect(mergeVideos([video("a"), video("b")], [video("b", "actualizado"), video("c")])).toEqual([
      video("a"),
      video("b", "actualizado"),
      video("c"),
    ]);
  });
});
