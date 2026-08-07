import { describe, expect, it } from "vitest";
import { getDataErrorMessage } from "./data-errors";

describe("getDataErrorMessage", () => {
  it("prioritizes GraphQL errors", () => {
    expect(getDataErrorMessage(new Error("network"), [{ message: "Unauthorized" }])).toContain("permiso");
  });

  it("does not expose unknown backend details", () => {
    expect(getDataErrorMessage(new Error("internal implementation detail"))).toBe(
      "No pudimos completar la operación. Intenta nuevamente.",
    );
  });
});
