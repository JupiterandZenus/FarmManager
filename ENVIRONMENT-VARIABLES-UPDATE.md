# 🔧 Environment Variables Update for Bot Launching

## ✅ Updated Files

### 1. `portainer-farmmanager-stack.yml`
**Added DreamBot Configuration:**
```yaml
# DreamBot Configuration for Bot Launching
- DREAMBOT_USERNAME=${DREAMBOT_USERNAME:-}
- DREAMBOT_PASSWORD=${DREAMBOT_PASSWORD:-}
- DREAMBOT_SCRIPT=${DREAMBOT_SCRIPT:-}
- DREAMBOT_WORLD=${DREAMBOT_WORLD:-301}
- DREAMBOT_ARGS=${DREAMBOT_ARGS:---no-splash --developer-mode}
- DREAMBOT_DIR=/root/DreamBot/BotData
- DREAMBOT_CLIENT_URL=https://dreambot.org/DBLauncher.jar
- JAVA_HOME=/usr/lib/jvm/temurin-8-jdk-amd64
```

**Added Descriptive Labels:**
```yaml
# Farm Manager Labels
- "farm.manager.version=v0.1"
- "farm.manager.features=bot-launching,vnc,discord,eternalfarm"
- "farm.manager.description=Farm Manager with DreamBot Launching"
- "farm.manager.ports.web=3333"
- "farm.manager.ports.vnc=5900"
- "farm.manager.ports.novnc=8080"
- "farm.manager.ports.ssh=2222"
```

### 2. `stack.env`
**Updated Configuration:**
```env
# Corrected port and database settings
PORT=3333
DATABASE_URL=mysql://farmboy:Sntioi004!@mariadb:3306/farmboy_db

# Added DreamBot bot launching variables
DREAMBOT_DIR=/root/DreamBot/BotData
DREAMBOT_CLIENT_URL=https://dreambot.org/DBLauncher.jar

# Updated EternalFarm API keys (working keys)
API_KEY=RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5
ETERNALFARM_AGENT_KEY=RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5

# Added proxy configuration options
PROXY_HOST=
PROXY_PORT=
PROXY_USER=
PROXY_PASS=
```

## 🎯 Key Environment Variables for Bot Launching

### Required for DreamBot Launching:
- `DREAMBOT_USERNAME` - Account username (set per task)
- `DREAMBOT_PASSWORD` - Account password (set per task)
- `DREAMBOT_WORLD=301` - Default world to connect to
- `DREAMBOT_DIR=/root/DreamBot/BotData` - DreamBot data directory
- `JAVA_HOME=/usr/lib/jvm/temurin-8-jdk-amd64` - Java installation path
- `DISPLAY=:1` - X11 display for GUI

### Optional DreamBot Configuration:
- `DREAMBOT_SCRIPT` - Default script to run
- `DREAMBOT_ARGS=--no-splash --developer-mode` - Launch arguments
- `DREAMBOT_CLIENT_URL=https://dreambot.org/DBLauncher.jar` - Download URL

### Required for Farm Manager:
- `API_KEY` - Farm Manager API authentication
- `DATABASE_URL` - Database connection string
- `PORT=3333` - Web interface port

### Required for EternalFarm Integration:
- `ETERNALFARM_AGENT_KEY` - EternalFarm API key
- `ETERNAL_API_URL=https://api.eternalfarm.net` - API endpoint
- `AUTH_AGENT_KEY` - Agent authentication key

## 🚀 Deployment Notes

### For Portainer Stack:
1. Update your stack with the new `portainer-farmmanager-stack.yml`
2. Set environment variables in Portainer stack editor
3. Restart the stack

### For Docker Compose:
1. Use the updated `docker-compose.yml` (already has correct variables)
2. Set variables in `.env` file or export them
3. Run `docker-compose up -d`

### Environment Variable Priority:
1. **Portainer Stack Variables** (highest priority)
2. **Container Environment Variables**
3. **Default Values** (lowest priority)

## 🔍 Verification

After deployment, verify these variables are set correctly:
```bash
# Check inside container
docker exec -it <container_name> env | grep DREAMBOT
docker exec -it <container_name> env | grep JAVA_HOME
docker exec -it <container_name> env | grep API_KEY
```

## ⚠️ Important Notes

1. **Account Credentials**: `DREAMBOT_USERNAME` and `DREAMBOT_PASSWORD` are typically set per task, not globally
2. **Java Path**: Must match the Java installation in your Docker image
3. **Display**: Required for GUI applications (VNC)
4. **API Keys**: Use the working EternalFarm API key for all operations
5. **Database**: Ensure connection string matches your MariaDB configuration

## 🎮 Bot Launching Flow

With these variables set:
1. User starts task in web interface
2. Enhanced task handler reads account credentials from database
3. DreamBot launcher uses `JAVA_HOME` and `DISPLAY` to launch bot
4. Bot connects to `DREAMBOT_WORLD` with account credentials
5. Process ID tracked in database for management

---

**✅ Environment variables are now configured for full bot launching functionality!** 