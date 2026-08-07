import { defineAuth } from "@aws-amplify/backend";
import { validateSignUpCaptcha } from "./pre-sign-up/resource";

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: "CODE",
      verificationEmailSubject: "Confirma tu cuenta de InnovaTube",
    },
  },
  accountRecovery: "EMAIL_ONLY",
  triggers: {
    preSignUp: validateSignUpCaptcha,
  },
  userAttributes: {
    givenName: {
      mutable: true,
      required: true,
    },
    familyName: {
      mutable: true,
      required: true,
    },
  },
});
