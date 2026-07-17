import { z } from "zod";

interface MahasiswaData {
  nim: string;
  nama: string;
  hp: string | null;
  email: string | null;
  prodi: string | null;
  passwd: string;
}

const CAMPUS_GRAPHQL_URL =
  process.env.CAMPUS_GRAPHQL_URL || "https://sicekcok.if.unismuh.ac.id/graphql";

const mahasiswaSchema = z.object({
  nim: z.string().min(1),
  nama: z.string().min(1),
  hp: z.string().nullable(),
  email: z.string().nullable(),
  prodi: z.string().nullable(),
  passwd: z.string().min(1),
});

const MAHASISWA_QUERY = `
  query MahasiswaUser($nim: String!) {
    mahasiswaUser(nim: $nim) {
      nim
      nama
      hp
      email
      prodi
      passwd
    }
  }
`;

export async function fetchMahasiswaByNim(
  nim: string
): Promise<MahasiswaData | null> {
  if (!/^\d{6,20}$/.test(nim)) {
    return null;
  }

  try {
    const response = await fetch(CAMPUS_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: MAHASISWA_QUERY,
        variables: { nim },
      }),
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      console.error("GraphQL campus request failed:", response.statusText);
      return null;
    }

    const json: unknown = await response.json();

    if (
      !json ||
      typeof json !== "object" ||
      "errors" in json ||
      !("data" in json) ||
      !json.data ||
      typeof json.data !== "object" ||
      !("mahasiswaUser" in json.data)
    ) {
      return null;
    }

    const parsed = mahasiswaSchema.safeParse(json.data.mahasiswaUser);

    return parsed.success ? parsed.data : null;
  } catch {
    console.error("Failed to fetch mahasiswa from campus GraphQL");
    return null;
  }
}
