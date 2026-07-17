import { expect, test, type Browser, type Page } from "@playwright/test";

async function newLoggedInPage(
  browser: Browser,
  username: string,
  password: string,
  dest: RegExp,
): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByTestId("input-username").fill(username);
  await page.getByTestId("input-password").fill(password);
  await page.getByTestId("button-login").click();
  await expect(page).toHaveURL(dest, { timeout: 15_000 });
  return page;
}

test("admin edits a schedule room and status from the jadwal page", async ({
  browser,
}) => {
  const admin = await newLoggedInPage(browser, "admin", "admin123", /\/admin\/dashboard$/);

  // Mahasiswa + jadwal khusus run ini via API.
  const suffix = Date.now().toString();
  const student = await (
    await admin.request.post("/api/users", {
      data: {
        username: `e2e-jadwal-${suffix}`,
        password: "e2e-jadwal-password",
        role: "mahasiswa",
        name: `Mahasiswa Jadwal ${suffix}`,
        nim: `8${suffix.slice(-9)}`,
      },
    })
  ).json();

  const instructors = await (await admin.request.get("/api/users?role=instruktur")).json();
  const instructor = instructors.find(
    (u: { username: string }) => u.username === "ustadz_hamid",
  );
  expect(instructor).toBeTruthy();

  const schedule = await (
    await admin.request.post("/api/schedules", {
      data: {
        studentId: student.id,
        instructorId: instructor.id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        room: "Ruang Awal",
      },
    })
  ).json();

  await admin.goto("/admin/jadwal");

  // Buka dialog edit dari kartu jadwal.
  await admin.getByTestId(`edit-schedule-${schedule.id}`).click();
  await expect(admin.getByRole("dialog", { name: /edit jadwal/i })).toBeVisible();

  // Ubah ruangan dan status.
  await admin.getByTestId("input-schedule-room").fill("Ruang Revisi");
  await admin.getByTestId("input-schedule-status").click();
  await admin.getByRole("option", { name: /dibatalkan/i }).click();
  await admin.getByTestId("button-save-jadwal").click();
  await expect(admin.getByRole("dialog", { name: /edit jadwal/i })).toBeHidden({
    timeout: 10_000,
  });

  // Kartu ter-update: ruangan baru + badge status.
  const card = admin
    .locator("div.rounded-2xl.border")
    .filter({ hasText: `Mahasiswa Jadwal ${suffix}` });
  await expect(card).toContainText("Ruang Revisi", { timeout: 10_000 });
  await expect(card.getByTestId("badge-status-cancelled")).toBeVisible();

  // Hapus lewat dialog konfirmasi.
  await admin.getByTestId(`delete-schedule-${schedule.id}`).click();
  await expect(
    admin.getByRole("alertdialog", { name: /hapus jadwal/i }),
  ).toBeVisible();
  await admin.getByTestId("confirm-delete-schedule").click();
  await expect(card).toHaveCount(0, { timeout: 10_000 });

  await admin.context().close();
});
