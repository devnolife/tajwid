<div align="center">

# 📖 Mengaji — Platform Penilaian Tajwid

**Sistem manajemen dan penilaian kemampuan mengaji mahasiswa berbasis web modern.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5-7C3AED?style=for-the-badge&logo=auth0&logoColor=white)](https://authjs.dev/)

<br />

<img src="https://img.shields.io/badge/status-active-success?style=flat-square" alt="Status" />
<img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />

---

*Dibangun untuk mempermudah proses penilaian kemampuan membaca Al-Qur'an di lingkungan kampus.*

</div>

<br />

## ✨ Fitur Utama

<table>
<tr>
<td width="50%">

### 🎓 Portal Mahasiswa
- Dashboard ringkasan progres mengaji
- Riwayat & status pembayaran
- Jadwal ujian mengaji
- Hasil penilaian & skor detail
- Unduh sertifikat kelulusan

</td>
<td width="50%">

### 👨‍🏫 Portal Instruktur
- Dashboard overview kelas
- Daftar mahasiswa yang diampu
- Form penilaian 4 aspek (Tajwid, Kelancaran, Makhorijul Huruf, Adab)
- Manajemen jadwal mengajar

</td>
</tr>
<tr>
<td colspan="2">

### 🛡️ Portal Admin
- Dashboard statistik & analytics dengan grafik interaktif
- CRUD manajemen mahasiswa & instruktur
- Verifikasi & pengelolaan pembayaran
- Penjadwalan ujian mengaji
- Monitoring hasil penilaian seluruh mahasiswa
- Penerbitan sertifikat
- Pengaturan sistem (tahun akademik, passing score, nominal pembayaran)

</td>
</tr>
</table>

## 🏗️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) — App Router, React Server Components |
| **Language** | [TypeScript 5.6](https://www.typescriptlang.org/) — End-to-end type safety |
| **Authentication** | [Auth.js v5](https://authjs.dev/) — JWT strategy, role-based access |
| **Database** | [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Data Fetching** | [TanStack Query v5](https://tanstack.com/query) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Validation** | [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) + [React Icons](https://react-icons.github.io/react-icons/) |

## 📁 Struktur Project

```
tajwid/
├── shared/
│   └── schema.ts              # Database schema & Zod validations
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Route group — sidebar layout
│   │   │   ├── admin/         # 8 halaman admin
│   │   │   ├── instruktur/    # 4 halaman instruktur
│   │   │   └── mahasiswa/     # 5 halaman mahasiswa
│   │   ├── api/               # Next.js Route Handlers
│   │   │   ├── auth/          # Auth.js endpoints
│   │   │   ├── users/         # User CRUD
│   │   │   ├── payments/      # Pembayaran
│   │   │   ├── schedules/     # Jadwal
│   │   │   ├── assessments/   # Penilaian
│   │   │   ├── settings/      # Pengaturan
│   │   │   └── seed/          # Seed data
│   │   └── login/             # Halaman login
│   ├── components/
│   │   └── ui/                # 47 shadcn/ui components
│   └── lib/
│       ├── auth.ts            # Auth.js config
│       ├── auth-client.ts     # Client-side auth hook
│       └── db/                # Database connection & storage
├── middleware.ts               # Route protection & role-based access
├── drizzle.config.ts          # Drizzle Kit config
└── tailwind.config.ts         # Tailwind config dengan tema kustom
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 24 LTS**
- **PostgreSQL 16**
- **npm**

### 1. Clone & Install

```bash
git clone https://github.com/devnolife/tajwid.git
cd tajwid
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Ganti seluruh placeholder secret di `.env`. Minimum konfigurasi lokal:

```env
DATABASE_URL=postgresql://tajwid:strong-password@localhost:5434/mengaji
DATABASE_SSL=false
AUTH_SECRET=hasil-openssl-rand-base64-48
NEXTAUTH_SECRET=nilai-yang-sama-dengan-AUTH_SECRET
NEXTAUTH_URL=http://localhost:3014
CERTIFICATE_API_KEY=secret-integrasi-yang-berbeda
ADMIN_PASSWORD=password-admin-minimal-12-karakter
```

Generate secret dengan `openssl rand -base64 48`. Jangan memakai nilai contoh pada production.

### 3. Setup Database

```bash
# Terapkan migration ter-versioning
npm run db:migrate

# Seed data demo (opsional)
npm run db:seed
```

`npm run db:push` hanya disediakan untuk prototyping lokal. Gunakan migration dan backup database untuk deployment.

### 4. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3014](http://localhost:3014) 🎉

## 🐳 Menjalankan dengan Docker

Project sudah dilengkapi `Dockerfile` (Next.js standalone) dan `docker-compose.yml` (Next.js + PostgreSQL 16).

### 1. Siapkan environment

```bash
cp .env.example .env
# Isi POSTGRES_PASSWORD, AUTH_SECRET, CERTIFICATE_API_KEY, dan ADMIN_PASSWORD.
```

### 2. Jalankan stack

```bash
docker compose up -d --build
```

Service yang berjalan:

| Service          | Default Port | Keterangan                                    |
|------------------|--------------|-----------------------------------------------|
| `postgres`       | `5434` host → `5432` container | PostgreSQL 16, volume persisten |
| `app` (Next.js)  | `3015` (atau `APP_PORT`)       | Next.js production (standalone) |

### 3. Migrate schema & seed admin

```bash
docker compose exec app npm run db:migrate

# idempotent; memakai ADMIN_* dari environment container
docker compose exec app npm run db:seed:admin
```

Akses aplikasi di `http://localhost:${APP_PORT:-3015}`.

Bukti pembayaran disimpan privat pada volume `tajwid_payment_proofs` dan hanya dapat diunduh oleh mahasiswa pemilik atau admin. Jangan menyajikan volume tersebut sebagai static files.

### Stop / reset

```bash
docker compose down              # stop, data tetap
docker compose down -v           # stop + hapus data postgres
```

## 🔐 Demo Accounts

Setelah menjalankan `npm run db:seed`, gunakan akun berikut:

| Role | Username | Password |
|---|---|---|
| 👨‍🎓 Mahasiswa | `2024101001` | `password123` |
| 👨‍🏫 Instruktur | `ustadz_hamid` | `password123` |
| 🛡️ Admin | `admin` | `admin123` |

Data ini hanya untuk development/test. Production harus memakai `npm run db:seed:admin` dengan password kuat dan tidak menjalankan demo seed.

## 📊 Sistem Penilaian

Setiap mahasiswa dinilai berdasarkan **4 aspek** kemampuan mengaji:

```
┌─────────────────────────────────────────────┐
│           KOMPONEN PENILAIAN                │
├──────────────────────┬──────────────────────┤
│  📖 Tajwid           │  🎯 Kelancaran       │
│  Ketepatan hukum     │  Kelancaran membaca   │
│  bacaan tajwid       │  Al-Qur'an           │
├──────────────────────┼──────────────────────┤
│  🔤 Makhorijul Huruf │  🤲 Adab             │
│  Ketepatan pengucapan│  Adab & sikap saat   │
│  huruf hijaiyah      │  membaca Al-Qur'an   │
└──────────────────────┴──────────────────────┘

Total Score = round((Tajwid + Kelancaran + Makhorijul Huruf + Adab) / 4)
Passing Score = nilai pada Admin Settings (default 70)
```

Server menghitung total dan status kelulusan. Override instruktur yang bertentangan dengan ambang wajib disertai alasan audit. Setelah lulus, invoice sertifikat dibuat idempotent; setelah admin menyetujui pembayaran, sertifikat diterbitkan otomatis.

## 🛠️ Scripts

| Command | Deskripsi |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build untuk production |
| `npm run start` | Start production server |
| `npm run lint` | Jalankan ESLint |
| `npm run typecheck` | Periksa tipe tanpa emit |
| `npm test` | Jalankan unit dan route tests |
| `npm run test:integration` | Jalankan workflow test pada database `*_test` |
| `npm run test:e2e` | Jalankan Playwright untuk tiga role |
| `npm run test:ci` | Lint, typecheck, unit test, dan build |
| `npm run db:generate` | Generate migration Drizzle |
| `npm run db:migrate` | Terapkan migration ter-versioning |
| `npm run db:push` | Sinkronisasi schema untuk prototyping lokal saja |
| `npm run db:seed` | Populate data demo |
| `npm run db:seed:admin` | Buat / update akun admin (idempotent, baca `ADMIN_*` env) |

## 🔒 Role-Based Access

Middleware melindungi setiap route berdasarkan role user:

```
/mahasiswa/*   → Hanya role "mahasiswa"
/instruktur/*  → Hanya role "instruktur"
/admin/*       → Hanya role "admin"
/login         → Public (redirect jika sudah login)
/api/*         → Protected kecuali auth, health, dan endpoint verifikasi sertifikat
```

Policy data:

- Mahasiswa hanya dapat membaca jadwal, assessment, payment, certificate, dan notifikasi miliknya.
- Instruktur mendapat direktori mahasiswa minimal, dapat membuat jadwal untuk dirinya, serta hanya mengubah/menilai jadwal miliknya.
- Admin memiliki operasi global, memverifikasi pembayaran, dan menjalankan certificate backfill.
- Lookup sertifikat berbasis NIM membutuhkan `X-API-Key`; verifikasi berdasarkan nomor sertifikat bersifat publik.

## 📝 API Routes

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET/POST` | `/api/users` | List & create users |
| `PATCH/DELETE` | `/api/users/[id]` | Update / delete user (admin) |
| `GET/POST` | `/api/payments` | List & create pembayaran |
| `PATCH` | `/api/payments/[id]` | Action payment (`submit_proof`, `approve`, `reject`) |
| `POST/GET` | `/api/payments/[id]/proof` | Upload / download bukti privat |
| `GET/POST` | `/api/schedules` | List & create jadwal |
| `PATCH` | `/api/schedules/[id]` | Update jadwal sesuai ownership |
| `GET/POST` | `/api/assessments` | List & buat assessment berbasis jadwal |
| `PATCH` | `/api/assessments/[id]` | Koreksi assessment dengan hitung ulang server |
| `GET/PATCH` | `/api/settings` | Pengaturan admin |
| `GET` | `/api/settings/public` | Passing score dan metadata publik |
| `GET/POST` | `/api/certificates` | Certificate sendiri / backfill admin |
| `GET` | `/api/health` | Database readiness check |
| `POST` | `/api/seed` | Demo seed; admin dan development saja |

## ✅ Verifikasi dan Operasional

CI menjalankan lint, typecheck, 100+ unit/route tests, migration pada PostgreSQL 16, integration test transaksional, production build, serta E2E login/RBAC untuk tiga role.

Sebelum deploy:

1. Backup dan uji restore database.
2. Jalankan `npm run db:migrate` pada staging lebih dahulu.
3. Pastikan `/api/health` mengembalikan `200`.
4. Pastikan volume bukti pembayaran ter-mount dan writable oleh UID 1001.
5. Rotasi `AUTH_SECRET`, `CERTIFICATE_API_KEY`, password database, dan password admin secara terpisah.

Log server berbentuk JSON dan meredaksi field credential umum. Audit event mencatat perubahan user, jadwal, assessment, payment, settings, notifikasi, serta penerbitan certificate.

---

<div align="center">

**Dibuat dengan ❤️ oleh [@devnolife](https://github.com/devnolife)**

<br />

<sub>Built with Next.js · Styled with Tailwind CSS · Powered by PostgreSQL</sub>

</div>
