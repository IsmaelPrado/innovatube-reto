import { describe, expect, it } from "vitest";
import { getFieldErrors, registrationSchema } from "./auth-validation";

describe("registrationSchema", () => {
  const validRegistration = {
    givenName: "Ismael",
    familyName: "Prado",
    username: "ismael.prado",
    email: "ismael@example.com",
    password: "Secure#123",
    confirmPassword: "Secure#123",
  };

  it("accepts a valid registration", () => {
    expect(registrationSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registrationSchema.safeParse({ ...validRegistration, confirmPassword: "Different#123" });
    expect(result.success).toBe(false);

    if (!result.success) {
      expect(getFieldErrors(result.error).confirmPassword).toBe("Las contraseñas no coinciden.");
    }
  });

  it("rejects weak passwords", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      password: "password",
      confirmPassword: "password",
    });
    expect(result.success).toBe(false);
  });
});

