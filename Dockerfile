# Use Node.js 18 with a more compatible base image
FROM node:18-bullseye-slim

# Install system dependencies including OpenSSL, locales, and MySQL client
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    curl \
    locales \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/* \
    && localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8

# Set locale environment
ENV LANG en_US.utf8
ENV LC_ALL en_US.UTF-8

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN groupadd -r farmboy && useradd -r -g farmboy farmboy

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for Prisma)
RUN npm install

# Copy prisma directory first
COPY prisma ./prisma/

# Copy rest of application code
COPY . .

# Copy DreamBot settings.json
COPY settings.json /app/settings.json

# Generate Prisma client
RUN npx prisma generate

# Create necessary directories with correct permissions
RUN mkdir -p /root/DreamBot /root/Desktop /root/.vnc /root/.eternalfarm /app/data /appdata/EternalFarm /appdata/DreamBot/BotData \
    && chmod -R 755 /root/DreamBot /root/Desktop /root/.vnc /app/data /appdata \
    && chmod 700 /root/.eternalfarm /appdata/EternalFarm

# Create EternalFarm config
RUN echo '{\n\
    "agent_key": "P52FE7-I2G19W-C2S4R8-BQZZFP-1FADWV-V3",\n\
    "api_url": "https://api.eternalfarm.net",\n\
    "auto_start": true,\n\
    "check_interval": 60,\n\
    "notification_enabled": true\n\
}' > /root/.eternalfarm/config.json \
    && chmod 600 /root/.eternalfarm/config.json

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

# Set default command (can be overridden by docker-compose)
CMD ["node", "server.js"] 