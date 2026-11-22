# ==============================================================================
# AWS Emulator UI - Dockerfile
# ==============================================================================

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Install runtime utilities, ca-certificates, and the Docker client binary
# This enables the UI to communicate with the host Docker daemon via /var/run/docker.sock
# for EC2 Instance Connect container simulation.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    bash \
    && curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-27.3.1.tgz | tar -xz -C /usr/local/bin --strip-components=1 docker/docker \
    && chmod +x /usr/local/bin/docker \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY .next ./.next
COPY public ./public
COPY next.config.ts ./
COPY scripts ./scripts

RUN chmod +x /app/scripts/docker/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/scripts/docker/entrypoint.sh"]
