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

test("admin confirms a cash payment through the confirmation dialog", async ({
  browser,
}) => {
  const admin = await newLoggedInPage(browser, "admin", "admin123", /\/admin\/dashboard$/);

  // Mahasiswa baru khusus run ini.
  const suffix = Date.now().toString();
  const nim = `9${suffix.slice(-9)}`;
  const userResponse = await admin.request.post("/api/users", {
    data: {
      username: `e2e-cash-${suffix}`,
      password: "e2e-cash-password",
      role: "mahasiswa",
      name: `Mahasiswa E2E ${suffix}`,
      nim,
    },
  });
  expect(userResponse.ok()).toBeTruthy();
  const student = await userResponse.json();

  // Jadwal mengaji dengan instruktur seed.
  const instructors = await (await admin.request.get("/api/users?role=instruktur")).json();
  const instructor = instructors.find(
    (u: { username: string }) => u.username === "ustadz_hamid",
  );
  expect(instructor).toBeTruthy();

  const scheduleResponse = await admin.request.post("/api/schedules", {
    data: {
      studentId: student.id,
      instructorId: instructor.id,
      date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      room: "Ruang E2E Cash",
    },
  });
  expect(scheduleResponse.ok()).toBeTruthy();
  const schedule = await scheduleResponse.json();

  // Instruktur menilai lulus → tagihan sertifikat otomatis dibuat.
  const instructorPage = await newLoggedInPage(
    browser,
    "ustadz_hamid",
    "password123",
    /\/instruktur\/dashboard$/,
  );
  const assessmentResponse = await instructorPage.request.post("/api/assessments", {
    data: {
      scheduleId: schedule.id,
      tajwid: 90,
      kelancaran: 85,
      makhorijulHuruf: 85,
      adab: 90,
    },
  });
  expect(assessmentResponse.ok()).toBeTruthy();
  await instructorPage.context().close();

  const payments = await (await admin.request.get("/api/payments")).json();
  const invoice = payments.find(
    (p: { studentId: string; status: string }) =>
      p.studentId === student.id && p.status === "belum_bayar",
  );
  expect(invoice).toBeTruthy();

  // Admin konfirmasi cash melalui dialog.
  await admin.goto("/admin/pembayaran");
  await admin.getByPlaceholder(/cari/i).fill(nim);

  await admin.getByTestId(`confirm-cash-${invoice.id}`).click();
  await expect(
    admin.getByRole("alertdialog", { name: /konfirmasi pembayaran cash/i }),
  ).toBeVisible();
  await admin.getByTestId("confirm-cash-submit").click();

  const row = admin.locator("tr", { hasText: nim });
  await expect(row).toContainText(/lunas/i, { timeout: 10_000 });
  await admin.context().close();
});
