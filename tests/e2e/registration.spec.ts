import { expect, test } from "@playwright/test";

const username = process.env.E2E_REGISTRATION_USERNAME;
const email = process.env.E2E_REGISTRATION_EMAIL;
const password = process.env.E2E_REGISTRATION_PASSWORD;

test("registers only after completing reCAPTCHA", async ({ page }) => {
  test.skip(!username || !email || !password, "Registration credentials are required for the sandbox-only test.");

  await page.goto("/registro");
  await page.locator('input[name="givenName"]').fill("Registro");
  await page.locator('input[name="familyName"]').fill("Protegido");
  await page.locator('input[name="username"]').fill(username!);
  await page.locator('input[name="email"]').fill(email!);
  await page.locator('input[name="password"]').fill(password!);
  await page.locator('input[name="confirmPassword"]').fill(password!);

  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.locator(".form-alert")).toContainText("Confirma que no eres un robot");

  const captcha = page.frameLocator('iframe[title="reCAPTCHA"]');
  await captcha.locator("#recaptcha-anchor").click();
  await expect(captcha.locator("#recaptcha-anchor")).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL(/\/confirmar\?/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Confirma tu cuenta" })).toBeVisible();
});
