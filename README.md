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

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **npm** atau **pnpm**

### 1. Clone & Install

```bash
git clone https://github.com/devnolife/tajwid.git
cd tajwid
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mengaji
NEXTAUTH_SECRET=generate-random-secret-here
NEXTAUTH_URL=http://localhost:3000
```

> 💡 Generate secret: `openssl rand -base64 32`

### 3. Setup Database

```bash
# Push schema ke database
npm run db:push

# Seed data demo (opsional)
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) 🎉

## 🔐 Demo Accounts

Setelah menjalankan `npm run db:seed`, gunakan akun berikut:

| Role | Username | Password |
|---|---|---|
| 👨‍🎓 Mahasiswa | `mahasiswa1` | `password123` |
| 👨‍🏫 Instruktur | `instruktur1` | `password123` |
| 🛡️ Admin | `admin1` | `password123` |

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

Total Score = Tajwid + Kelancaran + Makhorijul Huruf + Adab
Passing Score = 70 (configurable via Admin Settings)
```

## 🛠️ Scripts

| Command | Deskripsi |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build untuk production |
| `npm run start` | Start production server |
| `npm run lint` | Jalankan ESLint |
| `npm run db:push` | Push schema ke database |
| `npm run db:seed` | Populate data demo |

## 🔒 Role-Based Access

Middleware melindungi setiap route berdasarkan role user:

```
/mahasiswa/*   → Hanya role "mahasiswa"
/instruktur/*  → Hanya role "instruktur"
/admin/*       → Hanya role "admin"
/login         → Public (redirect jika sudah login)
/api/*         → Protected (kecuali /api/auth)
```

## 📝 API Routes

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET/POST` | `/api/users` | List & create users |
| `GET/PUT/DELETE` | `/api/users/[id]` | User detail, update, delete |
| `GET/POST` | `/api/payments` | List & create pembayaran |
| `PUT` | `/api/payments/[id]` | Update status pembayaran |
| `GET/POST` | `/api/schedules` | List & create jadwal |
| `GET/POST` | `/api/assessments` | List & create penilaian |
| `GET/PUT` | `/api/settings` | Get & update pengaturan |
| `POST` | `/api/seed` | Seed database dengan data demo |

---

<div align="center">

**Dibuat dengan ❤️ oleh [@devnolife](https://github.com/devnolife)**

<br />

<sub>Built with Next.js · Styled with Tailwind CSS · Powered by PostgreSQL</sub>

</div>
