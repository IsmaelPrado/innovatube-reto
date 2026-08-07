import {
  type ClientSchema,
  a,
  defineData,
  defineFunction,
  secret,
} from "@aws-amplify/backend";

export const searchVideosHandler = defineFunction({
  name: "search-videos",
  entry: "./search-videos/handler.ts",
  timeoutSeconds: 15,
  memoryMB: 256,
  environment: {
    YOUTUBE_API_KEY: secret("YOUTUBE_API_KEY"),
  },
});

const schema = a.schema({
  SearchOrder: a.enum(["relevance", "date", "viewCount", "rating"]),
  VideoDuration: a.enum(["any", "short", "medium", "long"]),

  VideoSearchResult: a.customType({
    videoId: a.string().required(),
    title: a.string().required(),
    description: a.string().required(),
    channelTitle: a.string().required(),
    thumbnailUrl: a.string().required(),
    publishedAt: a.datetime().required(),
    duration: a.string(),
    viewCount: a.string(),
    isLive: a.boolean().required(),
  }),

  VideoSearchPage: a.customType({
    items: a.ref("VideoSearchResult").array().required(),
    nextPageToken: a.string(),
    previousPageToken: a.string(),
    totalResults: a.integer().required(),
  }),

  Favorite: a
    .model({
      videoId: a.string().required(),
      title: a.string().required(),
      description: a.string().required(),
      channelTitle: a.string().required(),
      thumbnailUrl: a.string().required(),
      publishedAt: a.datetime().required(),
      duration: a.string(),
      viewCount: a.string(),
      isLive: a.boolean().required(),
      owner: a.string().authorization((allow) => [allow.owner().to(["read", "delete"])]),
    })
    .authorization((allow) => [allow.owner()]),

  searchVideos: a
    .query()
    .arguments({
      query: a.string().required(),
      pageToken: a.string(),
      order: a.ref("SearchOrder"),
      duration: a.ref("VideoDuration"),
    })
    .returns(a.ref("VideoSearchPage"))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(searchVideosHandler)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});

