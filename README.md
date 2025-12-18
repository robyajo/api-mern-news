# News API (Express + TypeScript + Prisma)

Backend API untuk aplikasi berita modern dengan autentikasi JWT, CRUD lengkap, caching performa tinggi, dan notifikasi real-time.

## 🚀 Fitur Utama

- **Autentikasi & Otorisasi**:
  - Register & Login dengan JWT (7 hari expiry).
  - Role-based Access Control (USER vs ADMIN).
  - Password hashing dengan `bcryptjs`.
- **Manajemen Konten (CRUD)**:
  - Berita/Posts (Judul, Konten, Thumbnail, Slug).
  - Kategori & Komentar.
  - Pagination & Search.
- **Performa Tinggi**:
  - **Caching**: Menggunakan Redis (opsional fallback ke In-Memory) untuk endpoint publik.
  - **Database Optimization**: Prisma v7 dengan adapter dinamis (PostgreSQL, MySQL/MariaDB, SQLite).
- **Real-time**:
  - Notifikasi via **Socket.IO** saat ada berita baru atau update.
- **Developer Experience**:
  - **Swagger UI**: Dokumentasi API interaktif di `/api-docs`.
  - **TypeScript**: Type-safety di seluruh kode.
  - **MVC Architecture**: Struktur kode yang rapi dan modular.
  - **Docker Ready**: Setup database dan Redis instan dengan Docker Compose.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma v7 (Dynamic Adapters)
- **Database**: PostgreSQL (Default), MySQL/MariaDB (Supported)
- **Caching**: Redis / In-Memory
- **Real-time**: Socket.IO
- **Validation**: Zod
- **Documentation**: Swagger / OpenAPI 3.0

## 📦 Persiapan & Instalasi

### 1. Prasyarat

- Node.js (v18+)
- Docker & Docker Compose (Disarankan untuk Database & Redis)

### 2. Instalasi Dependensi

```bash
npm install
```

### 3. Setup Environment

Salin file `.env.example` ke `.env` dan sesuaikan konfigurasi:

```env
# Server
PORT=4000
JWT_SECRET=rahasia_negara_api_news

# Database (PostgreSQL via Docker pada port 5433)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/db_magazine?schema=public"
SHADOW_DATABASE_URL="postgresql://postgres:postgres@localhost:5433/db_magazine_shadow?schema=public"

# Database Provider (postgresql / mysql / sqlite)
DATABASE_PROVIDER="postgresql"

# Redis (Opsional, untuk Caching)
REDIS_HOST="localhost"
REDIS_PORT=6379
```

### 4. Menjalankan Database (Docker)

Jalankan PostgreSQL dan Redis menggunakan Docker Compose:

```bash
docker-compose up -d
```

_Catatan: PostgreSQL dikonfigurasi pada port **5433** untuk menghindari konflik dengan instalasi lokal._

### 5. Setup Database

Jalankan migrasi untuk membuat tabel:

```bash
npm run prisma:migrate
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

(Opsional) Seed data awal:

```bash
npx prisma db seed
```

### 6. Menjalankan Server

Mode Development (dengan Hot-Reload `nodemon`):

```bash
npm run dev
```

Mode Production:

```bash
npm run build
npm start
```

Server akan berjalan di `http://localhost:4000`.

### 7. Deployment ke Server (Production)

Contoh tahapan deploy ke VPS/server Linux (Ubuntu):

1. **Persiapan Server**

   - Install Node.js (disarankan versi 18+).
   - Pastikan database (PostgreSQL/MySQL) dan Redis sudah tersedia dan bisa diakses dari server.
   - (Opsional) Pasang Nginx untuk reverse proxy.

2. **Clone Project**

   ```bash
   git clone https://github.com/username/api-news.git
   cd api-news/api-mern-news
   npm install
   ```

3. **Konfigurasi Environment**

   - Salin `.env.example` menjadi `.env`.
   - Isi `PORT`, `JWT_SECRET`, `DATABASE_URL`, `SHADOW_DATABASE_URL`, `DATABASE_PROVIDER`, dan konfigurasi Redis sesuai environment production.

4. **Migrasi Database & Generate Client**

   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

5. **Build & Jalankan Aplikasi**

   ```bash
   npm run build
   npm start
   ```

   Secara default server akan berjalan di `http://0.0.0.0:4000`.

6. **Menjalankan dengan PM2 (Disarankan untuk Production)**

   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name api-news
   pm2 save
   pm2 startup
   ```

   Untuk setup yang lebih rapi (terutama jika satu server menjalankan beberapa app), gunakan file `ecosystem.config.js` di root project:

   ```js
   module.exports = {
     apps: [
       {
         name: "api-news",
         script: "dist/index.js",
         env: {
           NODE_ENV: "production",
           PORT: 4000,
         },
       },
     ],
   };
   ```

   Jalankan dengan:

   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

7. **Konfigurasi Reverse Proxy (Opsional, dengan Nginx)**

   - Contoh konfigurasi `server block` Nginx (misal domain `api.example.com`):

   ```nginx
   server {
       listen 80;
       server_name api.example.com;

       # Redirect HTTP ke HTTPS (jika menggunakan SSL)
       # return 301 https://$host$request_uri;

       location / {
           proxy_pass         http://127.0.0.1:4000;
           proxy_http_version 1.1;
           proxy_set_header   Upgrade $http_upgrade;
           proxy_set_header   Connection "upgrade";
           proxy_set_header   Host $host;
           proxy_set_header   X-Real-IP $remote_addr;
           proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header   X-Forwarded-Proto $scheme;
       }
   }
   ```

   - Simpan file konfigurasi di `/etc/nginx/sites-available/api-news` lalu symlink ke `sites-enabled`.
   - Jalankan `nginx -t` untuk memastikan konfigurasi valid dan `sudo systemctl reload nginx` untuk menerapkan.

## 📚 Dokumentasi API

Akses dokumentasi lengkap dan coba API langsung melalui Swagger UI:
👉 **http://localhost:4000/api-docs**

## 📂 Struktur Proyek

```
api-news/
├── prisma/                 # Konfigurasi Database & Schema
│   ├── schema.prisma       # Definisi Tabel
│   ├── migrations/         # History Migrasi
│   └── seed.ts             # Data Awal
├── src/
│   ├── controllers/        # Logika Bisnis (Handler)
│   ├── middleware/         # Auth, Error Handling, Validation
│   ├── routes/             # Definisi Endpoint API
│   ├── index.ts            # Entry Point
│   ├── server.ts           # Setup Express App
│   ├── prisma.ts           # Instance Database Client
│   ├── redis.ts            # Konfigurasi Caching
│   └── realtime.ts         # Konfigurasi Socket.IO
├── docker-compose.yml      # Setup Docker (Postgres + Redis)
└── nodemon.json            # Konfigurasi Hot-Reload
```

## 🧪 Testing & Tools

- **Type Check**: `npm run typecheck`
- **Database Studio**: `npm run prisma:studio` (GUI untuk melihat data database)
- **Database Seed**: `npm run db:seed` (menjalankan script `prisma/seed.ts` untuk mengisi data awal)
- **Reset Database + Seed Ulang**: `npm run db:reset` (drop + migrate ulang database kemudian menjalankan seed)

---

Dibuat dengan ❤️ menggunakan Express & Prisma.
