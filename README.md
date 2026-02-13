# Stack V1 - Engineering Reliability Intelligence

Stack provides engineering leaders with a high-fidelity hiring signal based on the durability of code contributions. It measures the **Code Survival Rate (CSR)**: the percentage of an engineer's code that remains in the codebase 90 days after it was written.

## 🚀 Quick Start

### 1. Environment Setup
Clone the repository and install dependencies:
```bash
npm install
```

Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/stack_v1?schema=public"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
GITHUB_TOKEN="your-personal-access-token"
```

Initialize the database:
```bash
npx tsx scripts/setup.ts
```

### 2. Run the Application
Start the Next.js development server:
```bash
npm run dev
```

In a separate terminal, start the background worker:
```bash
npx tsx scripts/start-worker.ts
```

### 3. Analyze a Candidate
You can submit a job via the **Dashboard** at `http://localhost:3000/dashboard` or use the CLI script:
```bash
npx tsx scripts/submit-job.ts <github_handle> <repository_url>
```

## 🛠 Architecture

- **Next.js (App Router):** Modern frontend and API orchestration.
- **Supabase Postgres:** Central state machine and real-time updates.
- **Node.js Worker:** Persistent background process for heavy Git operations.
- **Git CLI:** Utilizes "blobless" clones and incremental blame for performance.
- **Prisma:** Type-safe database client and schema management.

## 🚢 Deployment
For production deployment instructions using Docker and Scaling strategies, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🧪 Testing
Run the test suite:
```bash
npm test
```

## 🛡 Security
- **Identity Resolution:** Maps commits across multiple emails using immutable GitHub `databaseId`.
- **Noise Filtering:** Automatically excludes documentation, dotfiles, lockfiles, and bot activity.
- **Job Claiming:** Uses atomic `SELECT FOR UPDATE SKIP LOCKED` to prevent race conditions.
- **Cleanup:** Ephemeral Git clones are purged immediately after analysis.
