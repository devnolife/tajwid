import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMahasiswaByNim } from "@/lib/graphql-campus";

describe("campus GraphQL client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects a non-numeric NIM before making a network request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchMahasiswaByNim('1058\") { __typename } #')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the NIM as a GraphQL variable instead of interpolating it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            mahasiswaUser: {
              nim: "105841108421",
              nama: "Mahasiswa Test",
              hp: null,
              email: null,
              prodi: "Informatika",
              passwd: "0123456789abcdef0123456789abcdef",
            },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchMahasiswaByNim("105841108421")).resolves.toMatchObject({
      nim: "105841108421",
      nama: "Mahasiswa Test",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const request = JSON.parse(String(init.body)) as {
      query: string;
      variables?: { nim?: string };
    };
    expect(request.query).toContain("$nim: String!");
    expect(request.query).toContain("mahasiswaUser(nim: $nim)");
    expect(request.query).not.toContain("105841108421");
    expect(request.variables).toEqual({ nim: "105841108421" });
  });

  it("rejects an invalid upstream response shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { mahasiswaUser: { nim: 123 } } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(fetchMahasiswaByNim("105841108421")).resolves.toBeNull();
  });
});
