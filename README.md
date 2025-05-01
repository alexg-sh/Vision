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
git clone <repo-url>
cd Project_Vision

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env.local
# Update .env.local with DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET

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


## References

- Next.js App Router
- Prisma Documentation
- NextAuth.js Documentation
- Tailwind CSS
- Shadcn UI

