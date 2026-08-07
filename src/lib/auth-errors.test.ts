import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "./auth-errors";

describe("getAuthErrorMessage", () => {
  it("translates known Cognito errors", () => {
    const error = new Error("raw service message");
    error.name = "NotAuthorizedException";

    expect(getAuthErrorMessage(error)).toBe("El usuario o la contraseña no son correctos.");
  });

  it("does not expose unknown service errors", () => {
    expect(getAuthErrorMessage(new Error("sensitive details"))).toBe(
      "No pudimos completar la operación. Intenta nuevamente.",
    );
  });
});

