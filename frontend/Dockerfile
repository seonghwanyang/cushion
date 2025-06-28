FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]