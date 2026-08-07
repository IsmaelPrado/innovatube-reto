import { describe, expect, it, vi } from "vitest";
import { verifyRecaptchaToken } from "./recaptcha";

describe("verifyRecaptchaToken", () => {
  it("accepts a successful token only for an allowed hostname", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      hostname: "main.d1gqu7q6u0ec4d.amplifyapp.com",
    })));

    await expect(verifyRecaptchaToken({
      token: "token",
      secret: "secret",
      allowedHostnames: ["main.d1gqu7q6u0ec4d.amplifyapp.com"],
      fetcher,
    })).resolves.toEqual({ valid: true, hostname: "main.d1gqu7q6u0ec4d.amplifyapp.com" });

    expect(fetcher).toHaveBeenCalledWith(
      "https://www.google.com/recaptcha/api/siteverify",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejects tokens issued for another hostname", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, hostname: "malicious.example" })));
    await expect(verifyRecaptchaToken({
      token: "token",
      secret: "secret",
      allowedHostnames: ["localhost"],
      fetcher,
    })).resolves.toEqual({ valid: false, hostname: "malicious.example", reason: "hostname-mismatch" });
  });

  it("fails closed when inputs are missing", async () => {
    await expect(verifyRecaptchaToken({ token: "", secret: "secret", allowedHostnames: ["localhost"] }))
      .resolves.toEqual({ valid: false, reason: "missing-input" });
  });
});
