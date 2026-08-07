import { describe, expect, it, vi } from "vitest";
import { verifyRecaptchaToken } from "./recaptcha";

describe("verifyRecaptchaToken", () => {
  it("accepts a successful token only for an allowed hostname", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      hostname: "main.d1gqu7q6u0ec4d.amplifyapp.com",
      action: "signup",
      score: 0.9,
    })));

    await expect(verifyRecaptchaToken({
      token: "token",
      secret: "secret",
      allowedHostnames: ["main.d1gqu7q6u0ec4d.amplifyapp.com"],
      fetcher,
    })).resolves.toEqual({
      valid: true,
      hostname: "main.d1gqu7q6u0ec4d.amplifyapp.com",
      action: "signup",
      score: 0.9,
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://www.google.com/recaptcha/api/siteverify",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejects tokens issued for another hostname", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      hostname: "malicious.example",
      action: "signup",
      score: 0.9,
    })));
    await expect(verifyRecaptchaToken({
      token: "token",
      secret: "secret",
      allowedHostnames: ["localhost"],
      fetcher,
    })).resolves.toEqual({ valid: false, hostname: "malicious.example", reason: "hostname-mismatch" });
  });

  it("rejects a token generated for a different action", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      hostname: "localhost",
      action: "login",
      score: 0.9,
    })));
    await expect(verifyRecaptchaToken({
      token: "token",
      secret: "secret",
      allowedHostnames: ["localhost"],
      fetcher,
    })).resolves.toEqual({
      valid: false,
      hostname: "localhost",
      action: "login",
      score: 0.9,
      reason: "action-mismatch",
    });
  });

  it("rejects a valid action below the risk threshold", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      hostname: "localhost",
      action: "signup",
      score: 0.3,
    })));
    await expect(verifyRecaptchaToken({
      token: "token",
      secret: "secret",
      allowedHostnames: ["localhost"],
      minimumScore: 0.5,
      fetcher,
    })).resolves.toEqual({
      valid: false,
      hostname: "localhost",
      action: "signup",
      score: 0.3,
      reason: "low-score",
    });
  });

  it("fails closed when inputs are missing", async () => {
    await expect(verifyRecaptchaToken({ token: "", secret: "secret", allowedHostnames: ["localhost"] }))
      .resolves.toEqual({ valid: false, reason: "missing-input" });
  });
});
