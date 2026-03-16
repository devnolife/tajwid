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

export async function fetchMahasiswaByNim(
  nim: string
): Promise<MahasiswaData | null> {
  const query = `
    query MahasiswaUser {
      mahasiswaUser(nim: "${nim}") {
        nim
        nama
        hp
        email
        prodi
        passwd
      }
    }
  `;

  try {
    const response = await fetch(CAMPUS_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.error("GraphQL campus request failed:", response.statusText);
      return null;
    }

    const json = await response.json();

    if (json.errors || !json.data?.mahasiswaUser) {
      return null;
    }

    return json.data.mahasiswaUser as MahasiswaData;
  } catch (error) {
    console.error("Failed to fetch mahasiswa from campus GraphQL:", error);
    return null;
  }
}
