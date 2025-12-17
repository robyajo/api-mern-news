# News API (Express + TypeScript + Prisma)

- Backend API untuk aplikasi berita dengan autentikasi JWT, CRUD posts, komentar, kategori, dan dokumentasi Swagger.
- Menggunakan Prisma v7 dengan dukungan PostgreSQL (default) dan MySQL opsional.

## Fitur

- Autentikasi JWT: register, login.
- CRUD Posts: list publik, list milik user, create/update/delete.
- Komentar dan kategori (terintegrasi dengan skema DB yang ada).
- Swagger UI untuk mencoba API via web di `/api-docs`.

## Stack

- Node.js + Express + TypeScript
- Prisma ORM v7
- PostgreSQL (default) atau MySQL (opsional)
- Swagger UI + swagger-jsdoc

## Paket yang Digunakan

- Runtime
  - `express`: HTTP server.
  - `cors`: Middleware CORS.
  - `dotenv`: Memuat variabel lingkungan dari `.env`.
  - `jsonwebtoken`: JWT untuk autentikasi.
  - `bcryptjs`: Hashing password.
  - `zod`: Validasi input.
  - `swagger-ui-express` + `swagger-jsdoc`: Dokumentasi API interaktif.
  - `@prisma/client`: Prisma Client yang dihasilkan.
  - `pg`, `mysql2`: Driver database untuk PostgreSQL/MySQL.
  - `@prisma/adapter-pg`, `@prisma/adapter-mariadb`, `@prisma/adapter-better-sqlite3`: Adapter Prisma v7 sesuai provider.
  - `better-sqlite3`: Driver SQLite untuk adapter terkait.
  - `uuid`: Pembuatan UUID.
  - `slugify`: Pembuatan slug ramah URL.
- Pengembangan
  - `typescript`: Bahasa/kompiler TypeScript.
  - `ts-node`, `ts-node-dev`: Menjalankan TypeScript tanpa build dan hot-reload dev.
  - `prisma`: CLI untuk generate/migrate/db pull/seed.
  - `@types/*`: Definisi tipe untuk Node/Express/CORS/JWT/PG/Swagger/UUID/SQLite/Bcrypt.

## Tahapan Instalasi Paket & TypeScript

- Install semua paket:

```bash
npm install
```

- Pastikan TypeScript mengetahui path output Prisma Client:

  - `tsconfig.json` sudah menyertakan `generated` di bagian `include`, sehingga import seperti `import { PrismaClient } from '../generated/prisma/client'` dapat dikenali.
  - Jika mengubah lokasi output client di `schema.prisma`, sesuaikan `tsconfig.json` dan import tersebut.

- Generate Prisma Client agar TypeScript dapat menggunakan tipe-tipe yang tepat:

```bash
npm run prisma:generate
```

- Bila mengubah skema database (migrate) atau menarik skema dari database (db pull), selalu jalankan ulang generate:

```bash
npx prisma db pull           # jika DB sudah ada
npx prisma migrate dev --name init   # jika membuat skema via Prisma
npm run prisma:generate
```

- Jalankan pengecekan tipe dan build:

```bash
npm run typecheck
npm run build
npm start
```

## Struktur Proyek

- `src/index.ts`: Entrypoint server.
- `src/server.ts`: Inisialisasi Express dan routing.
- `src/routes/*`: Routing API.
- `src/controllers/*`: Logic endpoint.
- `src/middleware/*`: Middleware auth dan error.
- `src/prisma.ts`: Inisialisasi Prisma Client dengan adapter dinamis.
- `prisma/schema.prisma`: Skema Prisma (sinkron dengan DB Anda).
- `prisma.config.ts`: Konfigurasi Prisma v7 (datasource & seed).
- `prisma/seed.ts`: Seeder data awal.
- `.env`: Konfigurasi environment.

## Prasyarat

- Node.js 18+ dan npm.
- Database berjalan:
  - PostgreSQL: buat database, misal `db_magazine`.
  - MySQL (opsional): jika ingin pakai MySQL, siapkan kredensial.

## Instalasi

- Clone repo dan masuk ke folder `api-news`.
- Install dependencies:

```bash
npm install
```

- Salin `.env.example` menjadi `.env` dan ubah sesuai lingkungan Anda:

```env
PORT=4000
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://<USER>:<PASSWORD>@127.0.0.1:5432/db_magazine?schema=public"
JWT_SECRET="dev_secret_change_me"
```

## Konfigurasi Prisma v7

- Konfigurasi membaca URL dari `prisma.config.ts` dan `.env`.
- File `schema.prisma` tidak menyimpan `url` datasource; gunakan `prisma.config.ts`.

### Alur 1: Menggunakan Database yang Sudah Ada (db pull)

- Jika tabel sudah ada di DB (users, posts, comments, dsb):

```bash
npx prisma db pull
npm run prisma:generate
```

### Alur 2: Membuat Skema Baru (migrate)

- Jika mulai dari nol dan ingin membuat tabel via Prisma:

```bash
npx prisma migrate dev --name init
npm run prisma:generate
```

## Seeder Data

- Mengisi data admin/user, kategori, posts, comments:

```bash
npx prisma db seed
```

- Default akun:
  - Admin: `admin@example.com` / `password123`
  - User: `user@example.com` / `password123`

## Menjalankan Server

- Mode pengembangan:

```bash
npm run dev
```

- Server berjalan di: `http://localhost:4000`
- Swagger UI: `http://localhost:4000/api-docs`

## Dokumentasi Swagger

- Buka `http://localhost:4000/api-docs`.
- Klik “Authorize” dan masukkan token JWT dari endpoint login:
  - Format: `Bearer <token>`

## Endpoint Utama

- Auth
  - `POST /auth/register`: daftar user baru.
  - `POST /auth/login`: login, mengembalikan token JWT.
- News
  - `GET /news`: list publik.
  - `GET /news/mine`: list milik user (butuh Bearer token).
  - `POST /news`: buat post (butuh Bearer token).
  - `PUT /news/{id}`: update post (butuh Bearer token).
  - `DELETE /news/{id}`: hapus post (butuh Bearer token).

## Skrip NPM Penting

- `npm run dev`: Jalankan server dev.
- `npm run build`: Build TypeScript ke `dist`.
- `npm run start`: Jalankan hasil build.
- `npm run typecheck`: Cek tipe TypeScript.
- `npm run prisma:generate`: Generate Prisma Client.
- `npm run prisma:migrate`: Migrasi skema (dev).
- `npx prisma db seed`: Jalankan seeder.
- `npm run prisma:studio`: Buka Prisma Studio.

## Catatan DB dan Tipe Data

- Skema DB Anda menggunakan `BigInt` untuk primary key; API sudah menangani serialisasi JSON agar aman.
- Field status di `posts` memiliki check constraint (`draft` atau `published`); seeder & controller menyesuaikan.

## MySQL (Opsional)

- Ubah `.env`:

```env
DATABASE_PROVIDER="mysql"
DATABASE_URL="mysql://<USER>:<PASSWORD>@127.0.0.1:3306/<DB>"
```

- Pastikan driver `mysql2` terinstal (`npm install mysql2` — sudah ada).
- Jalankan `npm run prisma:generate`.

## Troubleshooting

- Error adapter tidak cocok:
  - Pastikan `DATABASE_PROVIDER` sesuai dengan DB yang dipakai.
- Error unik/sequence:
  - Jalankan seeder; script akan mencoba merapikan sequence ID di PostgreSQL.
- Token JWT invalid:
  - Pastikan gunakan token dari `POST /auth/login` dan isi di Swagger “Authorize”.
