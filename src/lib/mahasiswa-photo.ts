const SIMAK_BASE_URL = "https://simak.unismuh.ac.id/upload/mahasiswa";

export function getMahasiswaPhotoUrl(nim: string): string {
  return `${SIMAK_BASE_URL}/${nim}.jpg`;
}
