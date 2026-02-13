# Deployment & Scaling - Stack V1

This document outlines the production deployment strategy and scaling path for Stack V1.

## 🏗 Production Architecture

```text
[ Browser ] 
     | (HTTPS)
     v
[ Next.js App (Vercel/Docker) ] <-----> [ Supabase Postgres ]
     |                                          ^
     | (Job Queue)                              |
     v                                          |
[ Node.js Worker (Docker) ] --------------------+
     |
     +--> [ Git CLI (Blobless Clone) ]
```

## 🚀 Deployment (Docker Compose)

1. Create a `.env` file from the production template:
   ```bash
   cp .env.prod.example .env
   ```
2. Build and start the services:
   ```bash
   docker-compose up --build -d
   ```

## 📈 Scaling Strategy

### 1. Horizontal Worker Scaling
Stack V1 workers use `FOR UPDATE SKIP LOCKED`, which allows multiple worker containers to poll the same database table without race conditions.
- To scale, simply increase the number of worker replicas in your container orchestrator (e.g., Kubernetes, ECS).

### 2. Database Performance
- **Connection Pooling:** In production, use Supabase's built-in connection pooler (Transaction mode) by appending `?pgbouncer=true` to your connection string.
- **Indexes:** The `analysis_jobs` table is indexed on `status` and `created_at` to ensure fast polling even with millions of records.

### 3. Monitoring & Observability
- **Structured Logs:** Workers emit JSON logs. Pipe these to a log aggregator (e.g., Datadog, ELK, or Supabase Logs).
- **Alerts:** Set up alerts for:
  - High `FAILED` job rate (>10% in 1 hour).
  - High worker CPU/Memory usage.
  - Pending jobs older than 15 minutes.

## 🛡 Security Checklist
- [ ] Use HTTPS for the dashboard and API.
- [ ] Enable Supabase Row Level Security (RLS) on all tables.
- [ ] Rotate `GITHUB_TOKEN` regularly.
- [ ] Use secret management (AWS Secrets Manager, Doppler, etc.) instead of plain `.env` files where possible.
