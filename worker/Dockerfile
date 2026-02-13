FROM node:20-slim

# Install git for the worker to perform clones
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

# Install all dependencies (including tsx for running TS directly)
RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Create directory for git clones
RUN mkdir -p /tmp/stack-v1-jobs && chmod 777 /tmp/stack-v1-jobs

CMD ["npm", "run", "worker:start"]
