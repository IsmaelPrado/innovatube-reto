"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type RecaptchaApi = {
  render?: (container: HTMLElement, options: {
    sitekey: string;
    theme: "light" | "dark";
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }) => number;
  reset?: (widgetId: number) => void;
};

declare global {
  interface Window {
    grecaptcha?: RecaptchaApi;
  }
}

type RecaptchaFieldProps = Readonly<{
  onChange: (token: string) => void;
  resetKey: number;
}>;

export function RecaptchaField({ onChange, resetKey }: RecaptchaFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | undefined>(undefined);
  const [loadError, setLoadError] = useState("");
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

  const renderWidget = useCallback(() => {
    if (
      !siteKey
      || !containerRef.current
      || typeof window.grecaptcha?.render !== "function"
      || widgetId.current !== undefined
    ) return;
    widgetId.current = window.grecaptcha.render(containerRef.current, {
      sitekey: siteKey,
      theme: "light",
      callback: (token) => {
        setLoadError("");
        onChange(token);
      },
      "expired-callback": () => onChange(""),
      "error-callback": () => {
        onChange("");
        setLoadError("No fue posible cargar la verificación. Intenta nuevamente.");
      },
    });
  }, [onChange, siteKey]);

  useEffect(() => {
    if (!siteKey || widgetId.current !== undefined) return;

    let cancelled = false;
    let attempts = 0;
    let retryTimer: number | undefined;

    function renderWhenReady() {
      if (cancelled || widgetId.current !== undefined) return;
      if (typeof window.grecaptcha?.render === "function" && containerRef.current) {
        renderWidget();
        return;
      }

      attempts += 1;
      if (attempts >= 100) {
        setLoadError("No fue posible iniciar la verificación. Recarga la página.");
        return;
      }
      retryTimer = window.setTimeout(renderWhenReady, 100);
    }

    renderWhenReady();
    return () => {
      cancelled = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [renderWidget, siteKey]);

  useEffect(() => {
    if (widgetId.current === undefined || typeof window.grecaptcha?.reset !== "function") return;
    window.grecaptcha.reset(widgetId.current);
    onChange("");
  }, [onChange, resetKey]);

  if (!siteKey) {
    return <p className="captcha-error" role="alert">reCAPTCHA no está configurado para este entorno.</p>;
  }

  return (
    <div className="captcha-field">
      <Script
        id="google-recaptcha"
        src="https://www.google.com/recaptcha/api.js?render=explicit&hl=es-419"
        strategy="afterInteractive"
        onReady={renderWidget}
        onError={() => setLoadError("No fue posible cargar la verificación. Revisa tu conexión.")}
      />
      <div ref={containerRef} className="captcha-widget" />
      {loadError ? <p className="captcha-error" role="alert">{loadError}</p> : null}
    </div>
  );
}
