# Use Ubuntu 22.04 as base image for better compatibility
FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    python3 \
    python3-pip \
    supervisor \
    xvfb \
    x11vnc \
    xfce4 \
    xfce4-terminal \
    novnc \
    websockify \
    openjdk-8-jdk \
    default-mysql-client \
    openssh-server \
    wmctrl \
    locales \
    && rm -rf /var/lib/apt/lists/* \
    && localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8

# Install Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Set locale environment
ENV LANG=en_US.utf8
ENV LC_ALL=en_US.UTF-8

# Create app directory and set as working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy application files
COPY . .

# Create necessary directories with correct permissions
RUN mkdir -p /root/DreamBot/BotData \
    /root/Desktop \
    /root/.vnc \
    /root/.config/autostart \
    /appdata/EternalFarm \
    /appdata/DreamBot/BotData \
    /var/log \
    /var/run/sshd \
    /root/EternalFarm/Logs

# Set proper permissions
RUN chmod -R 755 /root/DreamBot \
    /root/Desktop \
    /root/.vnc \
    /appdata \
    /app \
    && chmod +x /app/Entry.sh \
    && chmod +x /app/cpu_manager.sh \
    && chmod 755 /root/EternalFarm \
    && chmod 755 /root/EternalFarm/Logs \
    && chmod 755 /root/DreamBot \
    && chmod 755 /root/DreamBot/BotData \
    && chmod 755 /appdata/DreamBot \
    && chmod 755 /appdata/DreamBot/BotData \
    && chmod 755 /appdata/EternalFarm

# Copy configuration files to their locations
COPY supervisord.conf /etc/supervisord.conf
COPY Entry.sh /root/Entry.sh
COPY cpu_manager.sh /root/cpu_manager.sh

# Copy fix scripts
COPY fix-supervisord-config.sh /app/fix-supervisord-config.sh
RUN chmod +x /app/fix-supervisord-config.sh

# Set up VNC password
RUN mkdir -p /root/.vnc && x11vnc -storepasswd farmboy /root/.vnc/passwd

# Copy modern dashboard files
COPY dashboard-production.html /app/dashboard-production.html
COPY modern-dashboard.css /app/modern-dashboard.css
COPY modern-dashboard.js /app/modern-dashboard.js
COPY style.css /app/style.css

# Set up SSH
RUN mkdir -p /var/run/sshd && \
    echo 'root:farmboy' | chpasswd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

# Create empty log files
RUN touch /root/EternalFarm/Logs/agent.log && \
    touch /root/EternalFarm/Logs/checker.log && \
    touch /root/EternalFarm/Logs/automator.log && \
    chmod 644 /root/EternalFarm/Logs/agent.log && \
    chmod 644 /root/EternalFarm/Logs/checker.log && \
    chmod 644 /root/EternalFarm/Logs/automator.log

# Copy scripts
COPY fix-vnc-issue.sh /app/fix-vnc-issue.sh
COPY fix-auto-login.sh /app/fix-auto-login.sh
RUN chmod +x /app/fix-vnc-issue.sh /app/fix-auto-login.sh

# Expose ports
EXPOSE 3333 5900 8080 22

# Set environment variables
ENV DISPLAY=:1 \
    HOME=/root \
    SHELL=/bin/bash \
    USER=root \
    LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8

# Add metadata labels
LABEL maintainer="Farm Admin Team" \
      version="0.2" \
      description="Farm Manager with DreamBot Launching and Individual EternalFarm Service Keys"

# Set the default command to run supervisord
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisord.conf"] 