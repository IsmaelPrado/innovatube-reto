import { readFile } from "node:fs/promises";
import { Amplify } from "aws-amplify";
import { getCurrentUser, signIn, signOut } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";

const username = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;

if (!username || !password) {
  throw new Error("E2E_USERNAME and E2E_PASSWORD are required.");
}

const outputs = JSON.parse(await readFile(new URL("../amplify_outputs.json", import.meta.url), "utf8"));
Amplify.configure(outputs);

const client = generateClient({ authMode: "userPool" });
let favoriteId;

function assertGraphQL(response, operation) {
  if (response.errors?.length) {
    throw new Error(`${operation} failed: ${response.errors.map((error) => error.message).join("; ")}`);
  }
  return response.data;
}

try {
  const signInResult = await signIn({ username, password });
  if (!signInResult.isSignedIn) {
    throw new Error(`Sign-in requires another step: ${signInResult.nextStep.signInStep}`);
  }

  const user = await getCurrentUser();
  const searchData = assertGraphQL(
    await client.graphql({
      query: `query SmokeSearch($query: String!) {
        searchVideos(query: $query, order: relevance, duration: any) {
          items { videoId title description channelTitle thumbnailUrl publishedAt duration viewCount isLive }
          totalResults
        }
      }`,
      variables: { query: "AWS Lambda" },
    }),
    "searchVideos",
  );

  const video = searchData.searchVideos?.items?.find(Boolean);
  if (!video) throw new Error("YouTube returned no videos for the smoke query.");

  favoriteId = `${user.userId}:${video.videoId}`;
  assertGraphQL(
    await client.graphql({
      query: `mutation SmokeCreateFavorite($input: CreateFavoriteInput!) {
        createFavorite(input: $input) { id videoId }
      }`,
      variables: {
        input: {
          id: favoriteId,
          videoId: video.videoId,
          title: video.title,
          description: video.description,
          channelTitle: video.channelTitle,
          thumbnailUrl: video.thumbnailUrl,
          publishedAt: video.publishedAt,
          duration: video.duration,
          viewCount: video.viewCount,
          isLive: video.isLive,
        },
      },
    }),
    "createFavorite",
  );

  const listData = assertGraphQL(
    await client.graphql({
      query: `query SmokeListFavorites { listFavorites(limit: 10) { items { id videoId } } }`,
    }),
    "listFavorites",
  );
  if (!listData.listFavorites?.items?.some((favorite) => favorite?.id === favoriteId)) {
    throw new Error("The created favorite was not visible to its owner.");
  }

  assertGraphQL(
    await client.graphql({
      query: `mutation SmokeDeleteFavorite($input: DeleteFavoriteInput!) {
        deleteFavorite(input: $input) { id }
      }`,
      variables: { input: { id: favoriteId } },
    }),
    "deleteFavorite",
  );
  favoriteId = undefined;

  console.log(JSON.stringify({
    status: "passed",
    searchResultCount: searchData.searchVideos.items.filter(Boolean).length,
    favoriteLifecycle: "create-list-delete",
  }));
} finally {
  if (favoriteId) {
    await client.graphql({
      query: `mutation SmokeCleanupFavorite($input: DeleteFavoriteInput!) {
        deleteFavorite(input: $input) { id }
      }`,
      variables: { input: { id: favoriteId } },
    }).catch(() => undefined);
  }
  await signOut().catch(() => undefined);
}
