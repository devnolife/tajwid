import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getNotificationsByUser: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  createNotification: vi.fn(),
  getUser: vi.fn(),
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/storage", () => ({ storage: mocks }));

import { GET, POST } from "@/app/api/notifications/route";

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("notifications API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      user: { id: "student-1", role: "mahasiswa" },
    });
    mocks.getNotificationsByUser.mockResolvedValue([]);
    mocks.getUnreadNotificationCount.mockResolvedValue(0);
    mocks.getUser.mockResolvedValue({ id: "student-1" });
    mocks.createNotification.mockImplementation(async (input) => ({
      id: "notification-1",
      ...input,
    }));
  });

  it("always reads the current user's notifications with a bounded limit", async () => {
    const response = await GET(
      new Request("http://localhost/api/notifications?limit=999999"),
    );

    expect(response.status).toBe(200);
    expect(mocks.getNotificationsByUser).toHaveBeenCalledWith("student-1", 100);
  });

  it("reserves direct notification creation for administrators", async () => {
    const body = {
      userId: "b3919af3-f943-4cfa-856d-d53fdfdf7a8e",
      type: "info",
      title: "Informasi",
      message: "Pesan sistem",
    };

    expect((await post(body)).status).toBe(403);

    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    const response = await post(body);
    expect(response.status).toBe(201);
    expect(mocks.createNotification).toHaveBeenCalledWith({
      ...body,
      link: undefined,
      read: false,
    });

    const injected = await post({ ...body, read: true });
    expect(injected.status).toBe(400);
});
});
