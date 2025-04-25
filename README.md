# Project Vision

Project Vision is a web application designed to help teams collect, organize, and prioritize feedback, ideas, and bug reports. It provides a structured platform for collaboration within organizations or for individual use.

## Features

| Feature                 | Status      | Description                                                                 |
| :---------------------- | :---------- | :-------------------------------------------------------------------------- |
| User Authentication     | ✅ Implemented | Secure sign-up, login, and session management using NextAuth.js.            |
| Organization Management | ✅ Implemented | Create organizations, manage members, roles (Admin, Member), and privacy.   |
| Board Management        | ✅ Implemented | Create public or private boards within organizations or as personal boards. |
| Post Creation           | ✅ Implemented | Create different types of posts (e.g., Feedback, Polls, Announcements).     |
| Voting System           | ✅ Implemented | Upvote/downvote posts.                                                      |
| Commenting              | ✅ Implemented | Discuss posts through comments.                                             |
| User Profiles           | ✅ Implemented | View user profiles.                                                         |
| Discoverability         | ✅ Implemented | Discover public organizations and boards.                                   |
| Notifications           | ✅ Implemented | Receive notifications for relevant activities.                              |
| Audit Logs              | ✅ Implemented | Track important actions within organizations and boards.                    |
| Role-Based Access       | ✅ Implemented | Control permissions based on user roles (Org Admin/Member, Board roles).    |
| Member Management       | ✅ Implemented | Invite, remove, ban/unban members from organizations.                       |
| Dark Mode               | ✅ Implemented | Switch between light and dark themes.                                       |
| Keyboard Shortcuts      | ✅ Implemented | Use keyboard shortcuts for common actions.                                  |
| Custom Fields           | 🏗️ Partial    | Basic structure for custom fields exists.                                   |
| API                     | ✅ Implemented | RESTful API for core functionalities.                                       |
| Image Uploads           | 🚧 Planned    | Functionality for uploading images (e.g., board/org images) is planned.     |
| Search                  | ✅ Implemented | Search organizations and boards.                                            |
| Onboarding Flow         | ✅ Implemented | Guided setup for new users/organizations.                                   |

**Status Legend:**
*   ✅ Implemented: Feature is fully implemented.
*   🏗️ Partial: Feature is partially implemented or in progress.
*   🚧 Planned: Feature is planned but not yet started.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Database:** [PostgreSQL](https://www.postgresql.org/) (or compatible based on `DATABASE_URL`)
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Authentication:** [NextAuth.js](https://next-auth.js.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Shadcn UI](https://ui.shadcn.com/)
*   **State Management:** React Context API, `useState`
*   **Package Manager:** [pnpm](https://pnpm.io/)

## Getting Started

Follow these instructions to set up the project locally for development.

### Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [pnpm](https://pnpm.io/installation)
*   A running [PostgreSQL](https://www.postgresql.org/download/) database instance.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd Project_Vision
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env.local
        ```
    *   Update `.env.local` with your specific configuration:
        *   `DATABASE_URL`: Your PostgreSQL connection string (e.g., `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`)
        *   `NEXTAUTH_URL`: The base URL of your application during development (e.g., `http://localhost:3000`)
        *   `NEXTAUTH_SECRET`: A secret key for NextAuth. Generate one using `openssl rand -base64 32` or visit `https://generate-secret.vercel.app/32`.
        *   Add any other required variables for OAuth providers (GitHub, Google, etc.) if you plan to use them.

4.  **Run database migrations:**
    *   This will synchronize your database schema with the Prisma schema definition.
    ```bash
    pnpm prisma migrate dev
    ```
    *   *(Optional)* If you need to generate the Prisma client explicitly:
        ```bash
        pnpm prisma generate
        ```

5.  **Run the development server:**
    ```bash
    pnpm dev
    ```

6.  **Open the application:**
    Navigate to `http://localhost:3000` (or the port specified) in your web browser.

## Contributing

*(Optional: Add guidelines for contributing to the project if applicable)*

## License

*(Optional: Specify the license for the project, e.g., MIT)*
