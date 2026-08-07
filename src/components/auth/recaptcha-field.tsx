"use client";

import Script from "next/script";
import { useState } from "react";

const RECAPTCHA_ACTION = "signup";
const API_TIMEOUT_MS = 10_000;

type RecaptchaApi = {
  ready?: (callback: () => void) => void;
  execute?: (siteKey: string, options: { action: string }) => Promise<string>;
};

declare global {
  interface Window {
    grecaptcha?: RecaptchaApi;
  }
}

function waitForRecaptchaApi(): Promise<Required<RecaptchaApi>> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    function check() {
      const api = window.grecaptcha;
      if (typeof api?.ready === "function" && typeof api.execute === "function") {
        resolve(api as Required<RecaptchaApi>);
        return;
      }
      if (Date.now() - startedAt >= API_TIMEOUT_MS) {
        reject(new Error("reCAPTCHA no terminó de cargar."));
        return;
      }
      window.setTimeout(check, 100);
    }

    check();
  });
}

export async function executeSignUpCaptcha() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
  if (!siteKey) throw new Error("reCAPTCHA no está configurado para este entorno.");

  const api = await waitForRecaptchaApi();
  await new Promise<void>((resolve) => api.ready(resolve));
  const token = await api.execute(siteKey, { action: RECAPTCHA_ACTION });
  if (!token) throw new Error("reCAPTCHA no devolvió una verificación válida.");
  return token;
}

export function RecaptchaField() {
  const [loadError, setLoadError] = useState("");
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

  if (!siteKey) {
    return <p className="captcha-error" role="alert">reCAPTCHA no está configurado para este entorno.</p>;
  }

  return (
    <>
      <Script
        id="google-recaptcha-v3"
        src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}&hl=es-419`}
        strategy="afterInteractive"
        onReady={() => setLoadError("")}
        onError={() => setLoadError("No fue posible cargar la verificación. Revisa tu conexión.")}
      />
      {loadError ? <p className="captcha-error" role="alert">{loadError}</p> : null}
    </>
  );
}
