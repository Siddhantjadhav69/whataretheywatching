# WhatAreTheyWatching (Media Tracker)

A modern, responsive, and dynamic full-stack Next.js web application designed to track the movies and TV shows you and your friends are watching. Built with heavily optimized aesthetics natively rendering a NextAuth Prisma database mapping directly onto TMDB (The Movie Database).

## Features

- **Media Discovery & Tracking:** Effortlessly explore and search for Movies and TV shows across the TMDB universe, sorting organically by popularity, release date, or global average ratings.
- **Dynamic User Tracking Lists:** Track your media journey seamlessly by assigning statuses natively on any card. Build robust list databases natively synced on your backend Postgres engine.
- **Social & Identity Layer:** Create and customize a unique Profile Dashboard (including Avatars and Bios). Use the Global search hook to discover friends and actively Follow / Unfollow user arrays!
- **Friend Activity Feeds:** Instantly view live timeline feeds reporting exactly what Media your friends just tracked, all synced perfectly natively via the database mapping UI dropdowns.
- **Optimized Fallbacks:** Armored with systematic TCP fallback pipelines perfectly shielding structural layouts from offline ISP network crashes ensuring dynamic routing functions continue processing offline.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS + Shadcn/UI
- **Data Hook:** TMDB API (The Movie Database)

## Setup Instructions

1. Clone the repository.
   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/whataretheywatching.git
   cd whataretheywatching
   ```
2. Install all module dependencies.
   ```bash
   npm install
   ```
3. Generate your `.env` environmental variables securely scaling your exact keys.
   ```env
   # PostgreSQL URI
   DATABASE_URL="postgres://..."
   
   # NextAuth Local Encryption
   NEXTAUTH_SECRET="your-random-strong-secret"
   NEXTAUTH_URL="http://localhost:3001"
   
   # TMDB Key Mapping
   TMDB_API_KEY="your-tmdb-v3-api-key"
   TMDB_BASE_URL="https://api.themoviedb.org/3"
   TMDB_IMAGE_BASE_URL="https://image.tmdb.org/t/p"
   ```
4. Push Prisma schema configurations into your core PostgreSQL instance natively.
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. Deploy over localhost!
   ```bash
   npm run dev
   ```

## Protecting Core API Secrets explicitly
During standard deployment over GitHub, your `.env` folder is heavily guarded inside your `.gitignore` array. Meaning Next.js implicitly prevents any of your local keys from ever leaking into your GitHub public repos. When transferring this code architecture natively over production hosting like `Vercel` or `Railway`:
1. Use the Host Provider's absolute native Dashboard (Like Vercel Project Settings -> Environment Variables)
2. Manually copy and paste each key value locally from your `.env` right into their isolated Cloud Variable pipelines natively.
3. Once completed, your live deployed servers inherently map those external secrets without ever exposing them physically via URL!
