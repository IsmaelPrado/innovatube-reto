import { defineFunction, secret } from "@aws-amplify/backend";

export const validateSignUpCaptcha = defineFunction({
  name: "validate-sign-up-captcha",
  resourceGroupName: "auth",
  timeoutSeconds: 10,
  memoryMB: 256,
  environment: {
    GOOGLE_RECAPTCHA_SECRET_KEY: secret("GOOGLE_RECAPTCHA_SECRET_KEY"),
    RECAPTCHA_ALLOWED_HOSTNAMES: "localhost,main.d1gqu7q6u0ec4d.amplifyapp.com",
    RECAPTCHA_MINIMUM_SCORE: "0.5",
  },
});
