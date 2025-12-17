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

---

Dibuat dengan ❤️ menggunakan Express & Prisma.
