# Community Water Report

A full-stack web application for anonymous public reporting of water infrastructure issues with admin management capabilities.

## Features

- **Anonymous Public Reporting**: Community members can report water issues without creating an account
- **Image Upload**: Upload photos of water infrastructure problems
- **Admin Dashboard**: Secure admin login with ability to mark issues as solved
- **Real-time Updates**: Live updates when reports are created or modified
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Secure Architecture**: Service role keys never exposed to frontend

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Node.js 24.11.1)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Testing**: Vitest

## Prerequisites

- Node.js 24.11.1 or later
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Note your project URL and keys from Project Settings > API

### 2. Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click **New bucket**
3. Name it `reports-images`
4. Make it **Public**
5. Click **Save**

### 3. Configure Storage Policies

In Supabase Dashboard under Storage > reports-images > Policies:

1. Create a policy for public read access:
   - Name: "Public read access"
   - Policy: `SELECT` operation
   - Definition: `(bucket_id = 'reports-images')`

### 4. Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click **Run**

### 5. Create Admin User

1. In Supabase Dashboard, go to **Authentication** > **Users**
2. Click **Add user** > **Create new user**
3. Enter email and password for your admin account
4. Click **Create user**

### 6. Local Environment Setup

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

4. Replace the values with your Supabase project credentials:
   - Find these in Supabase Dashboard > Project Settings > API
   - **IMPORTANT**: Never commit the service role key to version control

### 7. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 8. Run Tests
```bash
npm test
```

## Deployment to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **New Project**
3. Import your GitHub repository
4. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Click **Deploy**

### 3. Update Supabase Allowed URLs

In Supabase Dashboard > Authentication > URL Configuration:
- Add your Vercel deployment URL to the allowed URLs

## Project Structure
````
community-water-report/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── admin/             # Admin pages
│   │   └── report/            # Report detail pages
│   ├── components/            # React components
│   ├── lib/                   # Utility functions and clients
│   └── types/                 # TypeScript type definitions
├── supabase/
│   └── migrations/            # Database migrations
├── tests/                     # Test files
└── public/                    # Static assets
