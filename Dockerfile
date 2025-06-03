# Use Node.js 18 with a more compatible base image
FROM node:18-bullseye-slim

# Install system dependencies including OpenSSL
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN groupadd -r farmboy && useradd -r -g farmboy farmboy

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for Prisma CLI)
RUN npm ci && npm cache clean --force

# Copy prisma directory first
COPY prisma ./prisma/

# Generate Prisma client to the custom output directory
RUN npx prisma generate

# Copy rest of application code
COPY . .

# Copy and set permissions for entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Remove dev dependencies to reduce image size (but keep generated Prisma client)
RUN npm prune --production

# Ensure the generated Prisma client directory exists and has correct permissions
RUN mkdir -p /app/generated/prisma && chown -R farmboy:farmboy /app/generated

# Change ownership to non-root user
RUN chown -R farmboy:farmboy /app

# Switch to non-root user
USER farmboy

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Add metadata labels
LABEL maintainer="Farm Admin Team"
LABEL version="0.1"
LABEL description="Farm Manager - Client Management System with P2P Master AI Timer"

# Use entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"] 