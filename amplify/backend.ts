import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";

const backend = defineBackend({ auth });

const { cfnUserPool } = backend.auth.resources.cfnResources;

// Cognito username aliases let the same sign-in field accept username or email.
cfnUserPool.usernameAttributes = [];
cfnUserPool.aliasAttributes = ["email"];
cfnUserPool.userPoolName = "innovatube-users";
cfnUserPool.usernameConfiguration = { caseSensitive: false };

