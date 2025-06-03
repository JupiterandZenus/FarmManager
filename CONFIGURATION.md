# 🔧 Farm Manager Configuration Guide

This guide explains how to configure your Farm Manager deployment with Discord notifications and DreamBot settings.

## 🔔 Discord Webhook Setup

### 1. Create Discord Webhook
1. Go to your Discord server settings
2. Navigate to **Integrations** → **Webhooks**
3. Click **Create Webhook**
4. Name it "Farm Manager Notifications"
5. Select the channel for notifications
6. Copy the **Webhook URL**

### 2. Configure in Portainer
In your stack environment variables, set:
```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

## 🤖 DreamBot Configuration

### Required Environment Variables
Set these in your stack.env or Portainer environment:

```bash
# DreamBot Credentials
DREAMBOT_USERNAME=your_runescape_username
DREAMBOT_PASSWORD=your_runescape_password

# Optional Settings
DREAMBOT_SCRIPT=YourScriptName
DREAMBOT_WORLD=301
DREAMBOT_ARGS=--no-splash --developer-mode
```

### Settings.json Auto-Generation
The container automatically generates `/root/DreamBot/BotData/settings.json` with:
- ✅ Your credentials from environment variables
- ✅ Optimized performance settings
- ✅ Anti-detection features enabled
- ✅ Auto-restart configuration

## 📁 File Locations

### Inside Container:
- **DreamBot Settings**: `/root/DreamBot/BotData/settings.json`
- **DreamBot Client**: `/root/DreamBot/BotData/client.jar`
- **Scripts**: `/root/DreamBot/BotData/scripts/`
- **Logs**: `/var/log/`

### Docker Volumes:
- **dreambot_data**: Persistent DreamBot data
- **farm_data**: Farm Manager application data

## 🎯 Access Points

After deployment, access via:
- **Farm Manager**: `http://your-ip:3333`
- **VNC Desktop**: `your-ip:5900` (TightVNC)
- **Web VNC**: `http://your-ip:8080` (Browser)
- **SSH Access**: `your-ip:2222`

## 🚀 Quick Start

1. **Set environment variables** in `stack.env`
2. **Deploy the stack** in Portainer
3. **Wait for database** to initialize
4. **Access VNC** to see desktop environment
5. **Launch DreamBot** from desktop or Farm Manager

## 🔧 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_WEBHOOK_URL` | Discord webhook for notifications | `https://discord.com/api/webhooks/...` |
| `DREAMBOT_USERNAME` | RuneScape account username | `your_username` |
| `DREAMBOT_PASSWORD` | RuneScape account password | `your_password` |
| `DREAMBOT_SCRIPT` | Default script to run | `YourScript` |
| `DREAMBOT_WORLD` | Preferred world number | `301` |
| `DREAMBOT_ARGS` | DreamBot launch arguments | `--no-splash --developer-mode` |
| `ETERNALFARM_AGENT_KEY` | EternalFarm API key | `ef_1234567890abcdef...` |
| `ETERNAL_API_URL` | EternalFarm API endpoint | `https://api.eternalfarm.net` |
| `AUTH_AGENT_KEY` | Authentication key for EternalFarm tools | `ef_1234567890abcdef...` |

## 🛡️ Security Notes

- ✅ All credentials stored as environment variables
- ✅ Database passwords properly secured
- ✅ No hardcoded credentials in files
- ✅ Settings.json generated at runtime
- ⚠️ Use strong passwords for all accounts 

## 🔥 EternalFarm Integration

### Required Environment Variables
Set these in your stack.env or Portainer environment:

```bash
# EternalFarm API Configuration
ETERNALFARM_AGENT_KEY=your_actual_eternalfarm_api_key
ETERNAL_API_URL=https://api.eternalfarm.net
AUTH_AGENT_KEY=your_actual_eternalfarm_api_key
```

### How to Get Your EternalFarm API Key
1. **Visit EternalFarm.net** and log into your account
2. **Go to Settings** → **API Keys** or **Developer Section**
3. **Create a new API key** or copy your existing one
4. **Copy the key** (format: `ef_1234567890abcdef...`)

### EternalFarm Tools
The container includes these EternalFarm tools:
- **EternalFarmAgent** - Main agent for farm management
- **EternalFarmChecker** - Account status checker
- **EternalFarmBrowserAutomator** - Browser automation

### Troubleshooting EternalFarm Issues

#### Apps Not Opening
If EternalFarm apps don't open when clicked:
1. **Check API Key**: Ensure `ETERNALFARM_AGENT_KEY` is set correctly
2. **Check Logs**: View container logs for error messages
3. **VNC Connection**: Make sure you're connected via VNC (port 5900)
4. **X11 Display**: The tools require DISPLAY=:1 to be set

#### Dashboard Not Showing Agent
If the dashboard doesn't show agent connection:
1. **API Key Required**: Set your actual EternalFarm API key
2. **Network Connectivity**: Ensure container can reach `api.eternalfarm.net`
3. **Agent Registration**: Check if agent is registered in your EternalFarm account 