import type { PreSignUpTriggerHandler } from "aws-lambda";
import { verifyRecaptchaToken } from "./recaptcha";

export const handler: PreSignUpTriggerHandler = async (event) => {
  if (event.triggerSource !== "PreSignUp_SignUp") return event;

  const startedAt = performance.now();
  try {
    const attributes = event.request.userAttributes;
    if (!attributes.email || !attributes.given_name || !attributes.family_name) {
      throw new Error("Faltan atributos requeridos para el registro.");
    }

    const result = await verifyRecaptchaToken({
      token: event.request.clientMetadata?.recaptchaToken ?? "",
      secret: process.env.GOOGLE_RECAPTCHA_SECRET_KEY ?? "",
      allowedHostnames: (process.env.RECAPTCHA_ALLOWED_HOSTNAMES ?? "").split(",").map((hostname) => hostname.trim()),
      expectedAction: "signup",
      minimumScore: Number(process.env.RECAPTCHA_MINIMUM_SCORE ?? "0.5"),
    });

    console.info(JSON.stringify({
      event: "auth.signup.captcha",
      valid: result.valid,
      hostname: result.hostname,
      action: result.action,
      score: result.score,
      reason: result.reason,
      durationMs: Math.round(performance.now() - startedAt),
    }));

    if (!result.valid) throw new Error("La verificación reCAPTCHA no fue válida.");
    return event;
  } catch (error) {
    console.error(JSON.stringify({
      event: "auth.signup.captcha.failed",
      errorType: error instanceof Error ? error.name : "UnknownError",
      durationMs: Math.round(performance.now() - startedAt),
    }));
    throw new Error("Completa nuevamente la verificación reCAPTCHA.");
  }
};
