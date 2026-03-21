/**
 * API Integration Test — TajwidKu
 *
 * Menguji seluruh API endpoint terhadap database PostgreSQL.
 * Jalankan: npm run test:api  (dev server harus running di port 3000)
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

// ─── Helpers ──────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function log(icon: string, msg: string) {
  console.log(`  ${icon} ${msg}`);
}

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    passed++;
    log("✅", name);
  } else {
    failed++;
    const info = detail ? `${name} — ${detail}` : name;
    log("❌", info);
    failures.push(info);
  }
}

/**
 * Login via NextAuth credentials dan return cookie string.
 * NextAuth v5 menggunakan POST /api/auth/callback/credentials.
 */
async function login(username: string, password: string): Promise<string> {
  // 1. GET CSRF token
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`, { redirect: "manual" });
  const csrfBody = await csrfRes.json();
  const csrfToken = csrfBody.csrfToken;
  const csrfCookies = csrfRes.headers.getSetCookie?.() ?? [];

  // 2. POST credentials
  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookies.join("; "),
    },
    body: new URLSearchParams({
      csrfToken,
      username,
      password,
      redirect: "false",
    }),
    redirect: "manual",
  });

  // Gabung semua set-cookie headers
  const allCookies = [
    ...csrfCookies,
    ...(loginRes.headers.getSetCookie?.() ?? []),
  ];

  const cookieString = allCookies
    .map((c) => c.split(";")[0])
    .join("; ");

  return cookieString;
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

async function api(
  method: Method,
  path: string,
  cookies: string,
  body?: Record<string, unknown>
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = { Cookie: cookies };
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

// ─── State yang disimpan antar test ──────────────────────

const state: Record<string, any> = {};

// ─── Tests ───────────────────────────────────────────────

async function testAuth() {
  console.log("\n🔐 AUTH TESTS");
  console.log("─".repeat(50));

  // Unauthenticated access
  const noAuth = await api("GET", "/api/users", "");
  assert(noAuth.status === 401, "GET /api/users tanpa auth → 401");

  // Login admin
  const adminCookies = await login("admin", "admin123");
  const adminCheck = await api("GET", "/api/users", adminCookies);
  assert(adminCheck.status === 200, "Login admin berhasil, GET /api/users → 200");
  state.adminCookies = adminCookies;

  // Login instruktur
  const instrukturCookies = await login("ustadz_hamid", "password123");
  const instrCheck = await api("GET", "/api/users", instrukturCookies);
  assert(instrCheck.status === 200, "Login instruktur berhasil, GET /api/users → 200");
  state.instrukturCookies = instrukturCookies;

  // Login mahasiswa (NIM + MD5 password)
  const mahasiswaCookies = await login("105841108421", "tajwid123");
  const mahCheck = await api("GET", "/api/users", mahasiswaCookies);
  assert(mahCheck.status === 200, "Login mahasiswa berhasil, GET /api/users → 200");
  state.mahasiswaCookies = mahasiswaCookies;

  // Invalid credentials
  const badLogin = await login("admin", "wrongpassword");
  const badCheck = await api("GET", "/api/users", badLogin);
  assert(badCheck.status === 401, "Login dengan password salah → 401");
}

async function testSeed() {
  console.log("\n🌱 SEED TESTS");
  console.log("─".repeat(50));

  const res = await api("POST", "/api/seed", state.adminCookies);
  assert(
    res.status === 200 || res.status === 403,
    `POST /api/seed → ${res.status}`,
    res.status === 403 ? "Hanya jalan di NODE_ENV=development" : undefined
  );
}

async function testUsers() {
  console.log("\n👤 USERS API TESTS");
  console.log("─".repeat(50));

  // GET all users
  const all = await api("GET", "/api/users", state.adminCookies);
  assert(all.status === 200, "GET /api/users → 200");
  assert(Array.isArray(all.data), "Response adalah array");
  assert(all.data.length > 0, `Ditemukan ${all.data.length} user(s)`);

  // Pastikan password tidak ikut di response
  const hasPassword = all.data.some((u: any) => u.password !== undefined);
  assert(!hasPassword, "Password TIDAK ada di response");

  // Filter by role
  const mhs = await api("GET", "/api/users?role=mahasiswa", state.adminCookies);
  assert(mhs.status === 200, "GET /api/users?role=mahasiswa → 200");
  assert(
    mhs.data.every((u: any) => u.role === "mahasiswa"),
    `Semua ${mhs.data.length} user ber-role mahasiswa`
  );

  const instr = await api("GET", "/api/users?role=instruktur", state.adminCookies);
  assert(instr.status === 200, "GET /api/users?role=instruktur → 200");
  assert(
    instr.data.every((u: any) => u.role === "instruktur"),
    `Semua ${instr.data.length} user ber-role instruktur`
  );

  // Simpan ID mahasiswa & instruktur untuk test lain
  if (mhs.data.length > 0) state.studentId = mhs.data[0].id;
  if (instr.data.length > 0) state.instructorId = instr.data[0].id;

  // POST create user (admin only)
  const newUser = await api("POST", "/api/users", state.adminCookies, {
    username: `test_user_${Date.now()}`,
    password: "test123",
    role: "mahasiswa",
    name: "Test User API",
    nim: `TEST${Date.now()}`,
    email: "test@example.com",
  });
  assert(newUser.status === 200, "POST /api/users (admin) → 200");
  assert(newUser.data?.id, `User dibuat dengan id: ${newUser.data?.id}`);
  state.createdUserId = newUser.data?.id;

  // PATCH update user (admin only)
  if (state.createdUserId) {
    const updated = await api("PATCH", `/api/users/${state.createdUserId}`, state.adminCookies, {
      name: "Test User Updated",
    });
    assert(updated.status === 200, "PATCH /api/users/[id] (admin) → 200");
    assert(updated.data?.name === "Test User Updated", "Nama berhasil diupdate");
  }

  // Auth check: instruktur tidak bisa create user
  const forbidden = await api("POST", "/api/users", state.instrukturCookies, {
    username: "should_fail",
    password: "fail",
    role: "mahasiswa",
    name: "Should Fail",
  });
  assert(forbidden.status === 403, "POST /api/users (instruktur) → 403 Forbidden");

  // Auth check: mahasiswa tidak bisa create user
  const forbiddenMhs = await api("POST", "/api/users", state.mahasiswaCookies, {
    username: "should_fail2",
    password: "fail",
    role: "mahasiswa",
    name: "Should Fail 2",
  });
  assert(forbiddenMhs.status === 403, "POST /api/users (mahasiswa) → 403 Forbidden");

  // DELETE user (admin only) — cleanup test user
  if (state.createdUserId) {
    const deleted = await api("DELETE", `/api/users/${state.createdUserId}`, state.adminCookies);
    assert(deleted.status === 200, "DELETE /api/users/[id] (admin) → 200");
    assert(deleted.data?.message === "User deleted", "Response: User deleted");
  }
}

async function testSettings() {
  console.log("\n⚙️  SETTINGS API TESTS");
  console.log("─".repeat(50));

  // GET settings (admin only)
  const get = await api("GET", "/api/settings", state.adminCookies);
  assert(get.status === 200, "GET /api/settings (admin) → 200");
  log("ℹ️", `Settings: appName=${get.data?.appName}, passingScore=${get.data?.passingScore}`);

  // PATCH settings
  const patch = await api("PATCH", "/api/settings", state.adminCookies, {
    passingScore: 75,
  });
  assert(patch.status === 200, "PATCH /api/settings → 200");
  assert(patch.data?.passingScore === 75, "passingScore berhasil diupdate ke 75");

  // Kembalikan ke 70
  await api("PATCH", "/api/settings", state.adminCookies, { passingScore: 70 });

  // Auth check: instruktur → 403
  const forbid = await api("GET", "/api/settings", state.instrukturCookies);
  assert(forbid.status === 403, "GET /api/settings (instruktur) → 403 Forbidden");

  // Auth check: mahasiswa → 403
  const forbidMhs = await api("GET", "/api/settings", state.mahasiswaCookies);
  assert(forbidMhs.status === 403, "GET /api/settings (mahasiswa) → 403 Forbidden");
}

async function testSchedules() {
  console.log("\n📅 SCHEDULES API TESTS");
  console.log("─".repeat(50));

  // GET all schedules
  const all = await api("GET", "/api/schedules", state.adminCookies);
  assert(all.status === 200, "GET /api/schedules → 200");
  assert(Array.isArray(all.data), `Ditemukan ${all.data.length} jadwal`);

  // Filter by studentId
  if (state.studentId) {
    const byStudent = await api("GET", `/api/schedules?studentId=${state.studentId}`, state.adminCookies);
    assert(byStudent.status === 200, "GET /api/schedules?studentId → 200");
    assert(Array.isArray(byStudent.data), `Jadwal mahasiswa: ${byStudent.data.length}`);
  }

  // Filter by instructorId
  if (state.instructorId) {
    const byInstr = await api("GET", `/api/schedules?instructorId=${state.instructorId}`, state.adminCookies);
    assert(byInstr.status === 200, "GET /api/schedules?instructorId → 200");
    assert(Array.isArray(byInstr.data), `Jadwal instruktur: ${byInstr.data.length}`);
  }

  // POST create schedule (admin only)
  if (state.studentId && state.instructorId) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);

    const created = await api("POST", "/api/schedules", state.adminCookies, {
      studentId: state.studentId,
      instructorId: state.instructorId,
      date: futureDate.toISOString(),
      room: "Ruang Test 999",
      location: "Gedung Test",
    });
    assert(created.status === 200, "POST /api/schedules (admin) → 200");
    assert(created.data?.id, `Jadwal dibuat: ${created.data?.id}`);
    state.createdScheduleId = created.data?.id;

    // PATCH update schedule
    if (state.createdScheduleId) {
      const updated = await api("PATCH", `/api/schedules/${state.createdScheduleId}`, state.adminCookies, {
        room: "Ruang Updated 888",
      });
      assert(updated.status === 200, "PATCH /api/schedules/[id] → 200");
      assert(updated.data?.room === "Ruang Updated 888", "Room berhasil diupdate");
    }

    // Auth check: instruktur tidak bisa create schedule
    const forbid = await api("POST", "/api/schedules", state.instrukturCookies, {
      studentId: state.studentId,
      instructorId: state.instructorId,
      date: futureDate.toISOString(),
      room: "Should Fail",
    });
    assert(forbid.status === 403, "POST /api/schedules (instruktur) → 403 Forbidden");

    // DELETE schedule (admin only)
    if (state.createdScheduleId) {
      const deleted = await api("DELETE", `/api/schedules/${state.createdScheduleId}`, state.adminCookies);
      assert(deleted.status === 200, "DELETE /api/schedules/[id] → 200");
      assert(deleted.data?.message === "Schedule deleted", "Response: Schedule deleted");
    }
  }

  // Instruktur & mahasiswa bisa GET schedules
  const instrGet = await api("GET", "/api/schedules", state.instrukturCookies);
  assert(instrGet.status === 200, "GET /api/schedules (instruktur) → 200 (read allowed)");

  const mhsGet = await api("GET", "/api/schedules", state.mahasiswaCookies);
  assert(mhsGet.status === 200, "GET /api/schedules (mahasiswa) → 200 (read allowed)");
}

async function testAssessments() {
  console.log("\n📝 ASSESSMENTS API TESTS");
  console.log("─".repeat(50));

  // GET all assessments
  const all = await api("GET", "/api/assessments", state.adminCookies);
  assert(all.status === 200, "GET /api/assessments → 200");
  assert(Array.isArray(all.data), `Ditemukan ${all.data.length} penilaian`);

  // Filter by studentId
  if (state.studentId) {
    const byStudent = await api("GET", `/api/assessments?studentId=${state.studentId}`, state.adminCookies);
    assert(byStudent.status === 200, "GET /api/assessments?studentId → 200");
    assert(Array.isArray(byStudent.data), `Penilaian mahasiswa: ${byStudent.data.length}`);
  }

  // Filter by instructorId
  if (state.instructorId) {
    const byInstr = await api("GET", `/api/assessments?instructorId=${state.instructorId}`, state.adminCookies);
    assert(byInstr.status === 200, "GET /api/assessments?instructorId → 200");
    assert(Array.isArray(byInstr.data), `Penilaian instruktur: ${byInstr.data.length}`);
  }

  // POST create assessment (instruktur — should succeed)
  if (state.studentId && state.instructorId) {
    // Gunakan student kedua kalau ada, supaya tidak conflict unique
    const mhs = await api("GET", "/api/users?role=mahasiswa", state.adminCookies);
    const targetStudentId = mhs.data.length > 1 ? mhs.data[1].id : state.studentId;

    const created = await api("POST", "/api/assessments", state.instrukturCookies, {
      studentId: targetStudentId,
      instructorId: state.instructorId,
      tajwid: 80,
      kelancaran: 75,
      makhorijulHuruf: 70,
      adab: 85,
      totalScore: 78,
      passed: true,
      notes: "Test assessment dari API test",
    });
    assert(created.status === 200, "POST /api/assessments (instruktur) → 200");
    assert(created.data?.id, `Penilaian dibuat: ${created.data?.id}`);
    state.createdAssessmentId = created.data?.id;

    // PATCH update assessment
    if (state.createdAssessmentId) {
      const updated = await api("PATCH", `/api/assessments/${state.createdAssessmentId}`, state.instrukturCookies, {
        notes: "Updated notes dari API test",
        totalScore: 80,
      });
      assert(updated.status === 200, "PATCH /api/assessments/[id] → 200");
      assert(updated.data?.notes === "Updated notes dari API test", "Notes berhasil diupdate");
      assert(updated.data?.totalScore === 80, "totalScore berhasil diupdate ke 80");
    }

    // Admin juga bisa create assessment
    const mhs2 = mhs.data.length > 2 ? mhs.data[2].id : null;
    if (mhs2) {
      const adminCreate = await api("POST", "/api/assessments", state.adminCookies, {
        studentId: mhs2,
        instructorId: state.instructorId,
        tajwid: 90,
        kelancaran: 88,
        makhorijulHuruf: 85,
        adab: 92,
        totalScore: 89,
        passed: true,
        notes: "Admin-created assessment",
      });
      assert(adminCreate.status === 200, "POST /api/assessments (admin) → 200");
      state.adminCreatedAssessmentId = adminCreate.data?.id;
    }
  }

  // Auth check: mahasiswa tidak bisa create assessment
  const forbid = await api("POST", "/api/assessments", state.mahasiswaCookies, {
    studentId: state.studentId || "fake",
    instructorId: state.instructorId || "fake",
    tajwid: 50,
    kelancaran: 50,
    makhorijulHuruf: 50,
    adab: 50,
    totalScore: 50,
    passed: false,
  });
  assert(forbid.status === 403, "POST /api/assessments (mahasiswa) → 403 Forbidden");

  // Semua role bisa GET assessments
  const instrGet = await api("GET", "/api/assessments", state.instrukturCookies);
  assert(instrGet.status === 200, "GET /api/assessments (instruktur) → 200 (read allowed)");

  const mhsGet = await api("GET", "/api/assessments", state.mahasiswaCookies);
  assert(mhsGet.status === 200, "GET /api/assessments (mahasiswa) → 200 (read allowed)");
}

async function testPayments() {
  console.log("\n💰 PAYMENTS API TESTS");
  console.log("─".repeat(50));

  // GET all payments
  const all = await api("GET", "/api/payments", state.adminCookies);
  assert(all.status === 200, "GET /api/payments → 200");
  assert(Array.isArray(all.data), `Ditemukan ${all.data.length} pembayaran`);

  // Filter by studentId
  if (state.studentId) {
    const byStudent = await api("GET", `/api/payments?studentId=${state.studentId}`, state.adminCookies);
    assert(byStudent.status === 200, "GET /api/payments?studentId → 200");
    assert(Array.isArray(byStudent.data), `Pembayaran mahasiswa: ${byStudent.data.length}`);
  }

  // POST create payment (admin only)
  if (state.studentId) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const created = await api("POST", "/api/payments", state.adminCookies, {
      studentId: state.studentId,
      amount: "200000",
      dueDate: dueDate.toISOString(),
      description: "Test payment dari API test",
      status: "belum_bayar",
    });
    assert(created.status === 200, "POST /api/payments (admin) → 200");
    assert(created.data?.id, `Payment dibuat: ${created.data?.id}`);
    state.createdPaymentId = created.data?.id;

    // PATCH update payment (any authenticated user)
    if (state.createdPaymentId) {
      const updated = await api("PATCH", `/api/payments/${state.createdPaymentId}`, state.adminCookies, {
        status: "menunggu_verifikasi",
        proofUrl: "https://example.com/proof.jpg",
      });
      assert(updated.status === 200, "PATCH /api/payments/[id] → 200");
      assert(updated.data?.status === "menunggu_verifikasi", "Status berhasil diupdate");
      assert(updated.data?.proofUrl === "https://example.com/proof.jpg", "proofUrl berhasil diupdate");

      // Mahasiswa juga bisa update payment (misal upload bukti)
      const mhsUpdate = await api("PATCH", `/api/payments/${state.createdPaymentId}`, state.mahasiswaCookies, {
        status: "menunggu_verifikasi",
      });
      assert(mhsUpdate.status === 200, "PATCH /api/payments/[id] (mahasiswa) → 200 (allowed)");
    }
  }

  // Auth check: instruktur tidak bisa create payment
  const forbid = await api("POST", "/api/payments", state.instrukturCookies, {
    studentId: state.studentId || "fake",
    amount: "100000",
    dueDate: new Date().toISOString(),
  });
  assert(forbid.status === 403, "POST /api/payments (instruktur) → 403 Forbidden");

  // Semua role bisa GET payments
  const instrGet = await api("GET", "/api/payments", state.instrukturCookies);
  assert(instrGet.status === 200, "GET /api/payments (instruktur) → 200 (read allowed)");

  const mhsGet = await api("GET", "/api/payments", state.mahasiswaCookies);
  assert(mhsGet.status === 200, "GET /api/payments (mahasiswa) → 200 (read allowed)");
}

// ─── Cleanup ─────────────────────────────────────────────

async function cleanup() {
  console.log("\n🧹 CLEANUP");
  console.log("─".repeat(50));

  // Hapus assessment yang dibuat saat test (tidak ada DELETE endpoint, update saja notes)
  if (state.createdAssessmentId) {
    log("ℹ️", `Assessment test ${state.createdAssessmentId} (tidak ada DELETE endpoint)`);
  }
  if (state.adminCreatedAssessmentId) {
    log("ℹ️", `Assessment admin test ${state.adminCreatedAssessmentId} (tidak ada DELETE endpoint)`);
  }

  // Payment juga tidak punya DELETE
  if (state.createdPaymentId) {
    log("ℹ️", `Payment test ${state.createdPaymentId} (tidak ada DELETE endpoint)`);
  }

  log("✨", "Cleanup selesai");
}

// ─── Runner ──────────────────────────────────────────────

async function run() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║     🧪 TajwidKu API Integration Test            ║");
  console.log("║     Target: " + BASE_URL.padEnd(37) + "║");
  console.log("╚══════════════════════════════════════════════════╝");

  const start = Date.now();

  try {
    await testAuth();
    await testSeed();
    await testUsers();
    await testSettings();
    await testSchedules();
    await testAssessments();
    await testPayments();
    await cleanup();
  } catch (err: any) {
    console.error("\n💥 FATAL ERROR:", err.message);
    if (err.cause) console.error("   Cause:", err.cause);
    process.exit(1);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log("\n" + "═".repeat(50));
  console.log(`📊 HASIL: ${passed} passed, ${failed} failed (${elapsed}s)`);

  if (failures.length > 0) {
    console.log("\n❌ GAGAL:");
    failures.forEach((f) => console.log(`   • ${f}`));
  }

  console.log("═".repeat(50));
  process.exit(failed > 0 ? 1 : 0);
}

run();
