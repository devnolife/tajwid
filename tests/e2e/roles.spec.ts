import { expect, test } from "@playwright/test";

const accounts = [
  {
    role: "admin",
    username: "admin",
    password: "admin123",
    destination: "/admin/dashboard",
    forbidden: "/mahasiswa/dashboard",
  },
  {
    role: "instruktur",
    username: "ustadz_hamid",
    password: "password123",
    destination: "/instruktur/dashboard",
    forbidden: "/admin/dashboard",
  },
  {
    role: "mahasiswa",
    username: "2024101001",
    password: "password123",
    destination: "/mahasiswa/dashboard",
    forbidden: "/admin/dashboard",
  },
] as const;

for (const account of accounts) {
  test(`${account.role} signs in and reaches only their dashboard`, async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByTestId("input-username").fill(account.username);
    await page.getByTestId("input-password").fill(account.password);
    await page.getByTestId("button-login").click();

    await expect(page).toHaveURL(new RegExp(`${account.destination}$`), {
      timeout: 15_000,
    });
    await expect(page.getByTestId("button-logout")).toBeVisible();

    await page.goto(account.forbidden);
    await expect(page).toHaveURL(new RegExp(`${account.destination}$`));
  });
}
