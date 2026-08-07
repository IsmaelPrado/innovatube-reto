import { expect, test } from "@playwright/test";

const username = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;

test.describe("InnovaTube production acceptance", () => {
  test.skip(!username || !password, "E2E_USERNAME and E2E_PASSWORD are required.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="username"]').fill(username!);
    await page.locator('input[name="password"]').fill(password!);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(/\/videos$/, { timeout: 20_000 });
    await expect(page.locator(".video-card").first()).toBeVisible({ timeout: 30_000 });
  });

  test("loads more videos, persists theme and completes the favorite lifecycle", async ({ page }) => {
    const cards = page.locator(".video-card");
    const initialCount = await cards.count();
    const firstCard = cards.first();
    const title = (await firstCard.locator(".video-title").textContent())?.trim();
    expect(title).toBeTruthy();

    const sentinel = page.locator(".scroll-sentinel");
    if (await sentinel.count()) {
      await sentinel.scrollIntoViewIfNeeded();
      await expect.poll(() => cards.count(), { timeout: 30_000 }).toBeGreaterThan(initialCount);
    }

    const existingFavorite = firstCard.getByRole("button", { name: "Quitar de favoritos" });
    if (await existingFavorite.count()) {
      await existingFavorite.click();
      await expect(firstCard.getByRole("button", { name: "Agregar a favoritos" })).toBeVisible();
    }
    await firstCard.getByRole("button", { name: "Agregar a favoritos" }).click();
    await expect(firstCard.getByRole("button", { name: "Quitar de favoritos" })).toBeVisible();

    await page.getByRole("link", { name: "Favoritos" }).click();
    const savedTitle = page.getByRole("button", { name: title!, exact: true });
    await expect(savedTitle).toBeVisible();
    const savedCard = page.locator(".video-card").filter({ has: savedTitle });
    await savedCard.getByRole("button", { name: "Quitar de favoritos" }).click();
    await expect(savedTitle).toHaveCount(0);

    await page.getByRole("link", { name: "Videos" }).click();
    await page.getByRole("button", { name: "Activar tema claro" }).click();
    await expect(page.locator(".app-shell")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator(".app-shell")).toHaveAttribute("data-theme", "light");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Abrir navegación" }).click();
    await expect(page.locator(".app-sidebar")).toHaveClass(/open/);
  });
});
