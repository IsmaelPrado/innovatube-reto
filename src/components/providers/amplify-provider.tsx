"use client";

import { Amplify, type ResourcesConfig } from "aws-amplify";
import outputs from "../../../amplify_outputs.json";

export const isAmplifyConfigured = !outputs.auth.user_pool_id.includes("REPLACE_ME");

if (isAmplifyConfigured) {
  Amplify.configure(outputs as ResourcesConfig, { ssr: true });
}

export function AmplifyProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

