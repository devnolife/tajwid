import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@shared/schema";
import { storage } from "@/lib/db/storage";
import { md5Hash } from "@/lib/md5";
import { fetchMahasiswaByNim } from "@/lib/graphql-campus";

// Akun uji coba (development) — aktif ketika DB/API tidak tersedia
const TEST_ACCOUNTS: Record<string, { password: string; name: string; role: string; nim?: string; program?: string }> = {
  admin: {
    password: "admin123",
    name: "Administrator Sistem",
    role: "admin",
  },
  ustadz_hamid: {
    password: "password123",
    name: "Ustadz Abdul Hamid, Lc.",
    role: "instruktur",
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;

        // Auto-detect: jika username berupa angka → mahasiswa (NIM)
        const isMahasiswa = /^\d+$/.test(username);

        if (isMahasiswa) {
          const nim = username;
          const hashedPassword = md5Hash(password);

          // Cek di database lokal dulu (skip jika DB tidak tersedia)
          try {
            const user = await storage.getUserByNim(nim);
            if (user) {
              if (user.password !== hashedPassword || user.role !== "mahasiswa") {
                return null;
              }

              // Sinkronkan nama dari GraphQL kampus agar selalu up-to-date
              try {
                const mahasiswa = await fetchMahasiswaByNim(nim);
                if (mahasiswa && mahasiswa.nama && mahasiswa.nama !== user.name) {
                  await storage.updateUser(user.id, {
                    name: mahasiswa.nama,
                    email: mahasiswa.email || user.email,
                    phone: mahasiswa.hp || user.phone,
                    program: mahasiswa.prodi || user.program,
                  });
                  user.name = mahasiswa.nama;
                  user.email = mahasiswa.email || user.email;
                }
              } catch {
                // GraphQL tidak tersedia — gunakan data lokal
              }

              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                username: user.username,
                nim: user.nim,
                faculty: user.faculty,
                program: user.program,
                phone: user.phone,
                specialization: user.specialization,
              };
            }
          } catch {
            // DB tidak tersedia — lanjut ke GraphQL
          }

          // User belum ada di lokal — query GraphQL kampus
          const mahasiswa = await fetchMahasiswaByNim(nim);

          if (mahasiswa) {
            if (hashedPassword !== mahasiswa.passwd) {
              return null;
            }

            // Coba simpan ke lokal, skip jika DB tidak tersedia
            let userId = nim;
            let userName = mahasiswa.nama;
            let userEmail = mahasiswa.email;
            try {
              const user = await storage.createUser({
                username: mahasiswa.nim,
                password: mahasiswa.passwd,
                role: "mahasiswa",
                name: mahasiswa.nama,
                nim: mahasiswa.nim,
                email: mahasiswa.email,
                phone: mahasiswa.hp,
                program: mahasiswa.prodi,
              });
              userId = user.id;
              userName = user.name;
              userEmail = user.email;
            } catch {
              // DB tidak tersedia — tetap return user dari GraphQL
            }

            return {
              id: userId,
              name: userName,
              email: userEmail,
              role: "mahasiswa",
              username: nim,
              nim: nim,
              faculty: null,
              program: mahasiswa.prodi,
              phone: mahasiswa.hp,
              specialization: null,
            };
          }

          // GraphQL gagal/tidak ditemukan — cek akun uji coba
          const testAccount = TEST_ACCOUNTS[nim];
          if (testAccount && testAccount.role === "mahasiswa" && hashedPassword === testAccount.password) {
            return {
              id: nim,
              name: testAccount.name,
              email: null,
              role: "mahasiswa",
              username: nim,
              nim: testAccount.nim ?? nim,
              faculty: null,
              program: testAccount.program ?? null,
              phone: null,
              specialization: null,
            };
          }

          return null;
        }

        // Instruktur & Admin: login dari database lokal
        try {
          const user = await storage.getUserByUsername(username);

          if (!user || user.password !== password) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            username: user.username,
            nim: user.nim,
            faculty: user.faculty,
            program: user.program,
            phone: user.phone,
            specialization: user.specialization,
          };
        } catch {
          // DB tidak tersedia — cek akun uji coba
          const testAccount = TEST_ACCOUNTS[username];
          if (testAccount && testAccount.password === password) {
            return {
              id: username,
              name: testAccount.name,
              email: null,
              role: testAccount.role,
              username: username,
              nim: testAccount.nim ?? null,
              faculty: null,
              program: testAccount.program ?? null,
              phone: null,
              specialization: null,
            };
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.nim = (user as any).nim;
        token.faculty = (user as any).faculty;
        token.program = (user as any).program;
        token.phone = (user as any).phone;
        token.specialization = (user as any).specialization;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).username = token.username as string;
        (session.user as any).nim = token.nim as string | null;
        (session.user as any).faculty = token.faculty as string | null;
        (session.user as any).program = token.program as string | null;
        (session.user as any).phone = token.phone as string | null;
        (session.user as any).specialization = token.specialization as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "tajwidku-secret-key",
});
