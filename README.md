# Project Vision

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/your-repo)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-—%25-lightgrey)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

## Abstract

Project Vision is a web application designed to collect, organize, and prioritize feedback, ideas, and bug reports within collaborative teams. This platform enables users to create and manage organizations, boards, and posts, while providing real-time notifications, audit logs, and role-based access control. Developed as part of a master's thesis, Project Vision demonstrates the integration of modern web technologies (Next.js, TypeScript, Prisma, NextAuth.js, and Tailwind CSS) to deliver a scalable and user-centric feedback management system.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [User Guide](#user-guide)
- [Developer Guide](#developer-guide)
- [Features](#features)
- [Folder Structure](#folder-structure)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)
- [References](#references)

## Project Overview

In collaborative environments, gathering and prioritizing stakeholder feedback is critical. Project Vision centralizes feedback collection into customizable boards and workflows. Organizations can define roles (Admin, Member), invite new users, and configure privacy settings. Team members interact through posts, votes, and comments, ensuring transparent decision-making.

### Objectives

- Provide a unified interface for feedback submission and tracking.
- Enforce access control via role-based permissions.
- Maintain detailed audit logs for compliance and traceability.
- Support extensible data models (custom fields, post types).

## Architecture

The application follows a modular, layered architecture:

1. **Frontend (Next.js App Router)**
   - Server-side rendering (SSR) and static generation for performance.
   - Dynamic client components for real-time features (notifications, shortcuts).
2. **Backend API (Next.js API Routes)**
   - RESTful endpoints under `/app/api` for CRUD operations.
   - Authentication via NextAuth.js with support for OAuth providers.
3. **Database & ORM**
   - Prisma with PostgreSQL manages schema migrations and queries.
   - Connection pooling and environment-based configuration.
4. **Styling & Components**
   - Tailwind CSS for utility-first styling.
   - Shadcn UI for reusable component primitives.

```text
User Browser ↔ Next.js Frontend ↔ Next.js API ↔ Prisma ORM ↔ PostgreSQL
```  

## User Guide

### Authentication & Access

1. **Sign up / Sign in**: Register or log in using email/password or OAuth providers.
2. **Organizations**: Create or join an organization. Admins manage members and roles.
3. **Boards**: Within an organization, create boards (public or private) to categorize feedback.

### Creating & Managing Posts

- **New Post**: Select type (Feedback, Poll, Announcement), add title, description, and attachments.
- **Voting**: Upvote or downvote posts to prioritize high-impact items.
- **Comments**: Discuss posts and tag team members using `@mentions`.
- **Custom Fields**: Extend posts with organization-specific metadata (status, priority).

### Notifications & Audit Logs

- **Notifications**: Receive in-app alerts for new posts, comments, and mentions.
- **Audit Logs**: Admins view change history (member invites, role changes) under the organization dashboard.

## Developer Guide

### Prerequisites

- Node.js (LTS) and pnpm
- PostgreSQL database

### Setup & Installation

```bash
# Clone repository
git clone https://github.com/your-username/project-vision.git
cd Project_Vision

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Update .env with your actual values:
# - DATABASE_URL: Your PostgreSQL connection string
# - NEXTAUTH_SECRET: Generate with `openssl rand -base64 32`
# - NEXTAUTH_URL: Your application URL (http://localhost:3000 for local dev)
# - GITHUB_ID: Your GitHub OAuth App Client ID
# - GITHUB_SECRET: Your GitHub OAuth App Client Secret
# - NEXT_PUBLIC_BASE_URL: Your application's public URL

# Run migrations and generate client
pnpm prisma migrate dev
pnpm prisma generate
```

### Running Locally

```bash
# Start development server
pnpm dev
```

Visit `http://localhost:3000` to access the application.

## Features

- **Authentication**: Secure login/signup with NextAuth.js.
- **Organizations & Boards**: Hierarchical grouping of feedback.
- **Post Types**: Feedback, Polls, Announcements.
- **Voting & Comments**: Prioritize and discuss posts.
- **Role-Based Access**: Admin and Member permissions.
- **Notifications**: Real-time alerts for key events.
- **Audit Logs**: Track critical actions.
- **Dark Mode** and **Keyboard Shortcuts** for improved UX.

## Folder Structure

```
/ ── app/        # Next.js App Router pages and API routes
    ├─ globals.css
    ├─ layout.tsx
    ├─ page.tsx
    └─ api/
/ components/   # Reusable React components
/ lib/          # Utility functions and Prisma client
/ prisma/       # Schema and migrations
/ public/       # Static assets
/ styles/       # Global and component styles
/ tests/        # End-to-end tests (Playwright)
```

## Scripts

```bash
pnpm install         # Install dependencies
pnpm dev             # Development server
pnpm build           # Build for production
pnpm start           # Start production server
pnpm prisma migrate dev  # Database migrations
pnpm prisma generate    # Generate Prisma client
pnpm lint            # Lint codebase
pnpm test            # Run unit tests (Jest)
pnpm test:e2e        # Run E2E tests (Playwright)
```

## Testing

- **Unit Tests**: `pnpm test`
- **E2E Tests**: `pnpm test:e2e` (ensure dev server is running)

## Deployment

The application can be deployed to Vercel or any Node.js hosting with the following steps:

1. Push code to Git repository.
2. Configure environment variables in hosting platform.
3. For Vercel, enable `pnpm prisma migrate deploy` in build hooks.

## Security & Environment Setup

### Environment Variables

This project requires several environment variables to be configured. Copy the example file and update it with your actual values:

```bash
cp .env.example .env
```

#### Required Environment Variables

- **DATABASE_URL**: PostgreSQL connection string
  - Example: `postgresql://username:password@localhost:5432/database_name`
  - For local development: `postgresql://postgres@localhost:5432/postgres`

- **NEXTAUTH_SECRET**: A secret key for NextAuth.js
  - Generate with: `openssl rand -base64 32`
  - Keep this secure and unique for each environment

- **NEXTAUTH_URL**: Your application URL
  - Development: `http://localhost:3000`
  - Production: `https://yourdomain.com`

- **GITHUB_ID**: Your GitHub OAuth App Client ID
  - Create at: https://github.com/settings/developers
  - Required for GitHub authentication

- **GITHUB_SECRET**: Your GitHub OAuth App Client Secret
  - Keep this secure and never commit to version control

- **NEXT_PUBLIC_BASE_URL**: Your application's public URL
  - Same as NEXTAUTH_URL but used on the client side

#### Security Best Practices

1. **Never commit sensitive data**: The `.env` file is gitignored to prevent accidental commits
2. **Use different secrets for different environments**: Production should have different secrets than development
3. **Generate strong secrets**: Use cryptographically secure random generators
4. **Rotate secrets regularly**: Update secrets periodically for better security
5. **Use environment-specific configurations**: Different database URLs for dev, staging, and production

### GitHub OAuth Setup

To enable GitHub authentication:

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App with:
   - Application name: Your app name
   - Homepage URL: `http://localhost:3000` (for development)
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Copy the Client ID and Client Secret to your `.env` file
4. For production, update the URLs to your actual domain

## License

MIT License. See [LICENSE](LICENSE) for details.

## References

- Next.js App Router
- Prisma Documentation
- NextAuth.js Documentation
- Tailwind CSS
- Shadcn UI

