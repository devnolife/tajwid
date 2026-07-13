type Fetcher = typeof fetch;

export interface ScheduleFormInput {
  studentId: string;
  instructorId: string;
  date: string;
  room: string;
  location: string | null;
}

export interface ScheduleUpdateInput {
  date: string;
  room: string;
  location: string | null;
}

async function send<T>(
  url: string,
  method: "POST" | "PATCH",
  body: Record<string, unknown>,
  fetcher: Fetcher,
): Promise<T> {
  const response = await fetcher(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data?.message === "string" ? data.message : "Permintaan gagal",
    );
  }
  return data as T;
}

export function createInstructorSchedule<T>(
  input: ScheduleFormInput,
  fetcher: Fetcher = fetch,
): Promise<T> {
  return send<T>(
    "/api/schedules",
    "POST",
    {
      ...input,
      date: new Date(input.date).toISOString(),
    },
    fetcher,
  );
}

export function updateInstructorSchedule<T>(
  scheduleId: string,
  input: ScheduleUpdateInput,
  fetcher: Fetcher = fetch,
): Promise<T> {
  return send<T>(
    `/api/schedules/${scheduleId}`,
    "PATCH",
    {
      ...input,
      date: new Date(input.date).toISOString(),
    },
    fetcher,
  );
}
