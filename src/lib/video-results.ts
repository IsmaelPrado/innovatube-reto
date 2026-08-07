import type { Video } from "@/types/video";

export function mergeVideos(current: Video[], incoming: Video[]) {
  const videos = new Map(current.map((video) => [video.videoId, video]));
  incoming.forEach((video) => videos.set(video.videoId, video));
  return [...videos.values()];
}
