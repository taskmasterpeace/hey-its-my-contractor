FROM node:20-slim

# sharp/onnxruntime (used by @xenova/transformers) need a few system libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first for layer caching (standalone npm install — not part of the yarn workspace)
COPY package.json ./
RUN npm install --omit=dev

# App source
COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Run TypeScript directly via tsx (no build step needed)
CMD ["npx", "tsx", "src/index.ts"]
