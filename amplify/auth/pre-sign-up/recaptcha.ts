type RecaptchaResponse = {
  success?: boolean;
  hostname?: string;
  "error-codes"?: string[];
};

type VerifyRecaptchaInput = {
  token: string;
  secret: string;
  allowedHostnames: string[];
  fetcher?: typeof fetch;
};

export type RecaptchaVerification = {
  valid: boolean;
  hostname?: string;
  reason?: string;
};

export async function verifyRecaptchaToken({
  token,
  secret,
  allowedHostnames,
  fetcher = fetch,
}: VerifyRecaptchaInput): Promise<RecaptchaVerification> {
  if (!token || !secret) return { valid: false, reason: "missing-input" };

  const body = new URLSearchParams({ secret, response: token });
  const response = await fetcher("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) return { valid: false, reason: "verification-service" };
  const result = await response.json() as RecaptchaResponse;
  if (!result.success) return { valid: false, hostname: result.hostname, reason: result["error-codes"]?.[0] ?? "rejected" };
  if (!result.hostname || !allowedHostnames.includes(result.hostname)) {
    return { valid: false, hostname: result.hostname, reason: "hostname-mismatch" };
  }

  return { valid: true, hostname: result.hostname };
}
