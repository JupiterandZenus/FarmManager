# DreamBot Settings Environment Variables Guide

## Overview
The DreamBot `settings.json` file is now **dynamically generated** from environment variables during container startup. This allows for complete customization of DreamBot behavior without modifying files, making it perfect for Docker deployments and different environments.

## 🔧 Implementation Summary

### What Changed
- **Before**: Static `settings.json` file with hardcoded values
- **After**: Dynamic generation from environment variables with intelligent defaults

### Files Involved
- **`generate-dreambot-settings.js`** - Main generator script
- **`docker-entrypoint.sh`** - Calls the generator during startup
- **`local.env`** - Local environment variables
- **`stack.env`** - Production environment variables
- **Docker Compose files** - Include all DREAMBOT_* variables

## 📋 Available Environment Variables

### Performance Settings
```bash
DREAMBOT_CPU_SAVER=true                    # Enable CPU saving mode
DREAMBOT_FPS=20                           # Frames per second (10-60)
DREAMBOT_RENDER_DISTANCE=25               # Render distance (10-50)
DREAMBOT_LOW_MEMORY=false                 # Low memory mode
DREAMBOT_LOW_DETAIL=false                 # Low detail graphics
DREAMBOT_MOUSE_SPEED=100                  # Mouse movement speed (50-200)
```

### World Configuration
```bash
DREAMBOT_USE_RANDOM_WORLD=true            # Use random world selection
DREAMBOT_USE_CUSTOM_WORLD=false           # Use specific world
DREAMBOT_WORLD=-8                         # Custom world number (if enabled)
```

### Security and Development
```bash
DREAMBOT_DEVELOPER_MODE=false             # Enable developer mode
DREAMBOT_FRESH_START=false                # Force fresh start
DREAMBOT_DISABLE_SECURITY_MANAGER=false   # Disable security manager
DREAMBOT_COVERT_MODE=true                 # Enable covert mode
```

### Integration Settings
```bash
DREAMBOT_SDN_INTEGRATION=true             # Enable SDN integration
DREAMBOT_AUTO_ADD_ACCOUNTS=true           # Auto-add accounts feature
```

### Visual and Audio Settings
```bash
DREAMBOT_DRAW_SCRIPT_PAINT=true           # Show script paint
DREAMBOT_CLIENT_RENDERING=false           # Client-side rendering
DREAMBOT_DISABLE_SOUNDS=true              # Disable game sounds
DREAMBOT_DISABLE_ANIMATION=false          # Disable animations
```

### Solver Settings
```bash
DREAMBOT_ROOF_SOLVER_ACTIVE=true          # Enable roof solver
DREAMBOT_DISMISS_SOLVERS_ACTIVE=true      # Enable dismiss solvers
```

### Discord Notifications
**Note**: These integrate with the existing `DISCORD_WEBHOOK_URL` variable
```bash
DREAMBOT_NOTIFY_ON_BAN=true               # Notify on account ban
DREAMBOT_NOTIFY_ON_DEATH=true             # Notify on character death
DREAMBOT_NOTIFY_ON_LEVEL_UP=true          # Notify on level up
DREAMBOT_NOTIFY_ON_LEVEL_UP_AMOUNT=5      # Minimum levels to notify
DREAMBOT_NOTIFY_ON_PET=true               # Notify on pet drops
DREAMBOT_NOTIFY_ON_VALUABLE_DROP=true     # Notify on valuable drops
DREAMBOT_NOTIFY_ON_VALUABLE_DROP_AMOUNT=250000  # Minimum value to notify
DREAMBOT_NOTIFY_ON_UNTRADEABLE_DROP=true  # Notify on untradeable drops
DREAMBOT_SCRIPT_WEBHOOK_ACCESS_ALLOWED=true     # Allow scripts to use webhook
DREAMBOT_MENTION_ON_BAN=true              # Mention users on ban
```

### Script Configuration
```bash
DREAMBOT_LAST_RAN_SCRIPT="Premium:1.312:P2P Master AI"  # Last script used
DREAMBOT_FAVORITE_SCRIPTS="P2P Master AI,# NMZ,Dreamy AIO Skiller Elite Lifetime,Guester - Lifetime"  # Comma-separated list
```

### UI Settings
```bash
DREAMBOT_LAST_CANVAS_SIZE="765:503"       # Canvas size (width:height)
DREAMBOT_GAME_LAYOUT="Force resizable (modern)"  # Game layout mode
```

### Update Settings
```bash
DREAMBOT_STOPS_AFTER_UPDATES=true         # Stop bot after updates
DREAMBOT_SETTINGS_VERSION=3               # Settings file version
```

## 🚀 How It Works

### 1. Container Startup Process
```bash
# During container startup (docker-entrypoint.sh):
1. Load environment variables
2. Run: node /app/generate-dreambot-settings.js
3. Generate settings.json with current env vars
4. Copy to all required DreamBot locations:
   - /app/settings.json
   - /root/DreamBot/BotData/settings.json
   - /appdata/DreamBot/BotData/settings.json
```

### 2. Dynamic Generation Process
```javascript
// generate-dreambot-settings.js process:
1. Read all DREAMBOT_* environment variables
2. Apply intelligent defaults for missing variables
3. Parse special formats (comma-separated lists, etc.)
4. Integrate with DISCORD_WEBHOOK_URL
5. Generate complete settings.json object
6. Write to multiple file locations
```

### 3. Environment Variable Priority
```
1. Explicit environment variable (highest priority)
2. Default value defined in generator
3. Fallback hardcoded default (lowest priority)
```

## 📝 Usage Examples

### Example 1: Local Development with Custom Settings
```bash
# In local.env or terminal:
export DREAMBOT_DEVELOPER_MODE=true
export DREAMBOT_FPS=30
export DREAMBOT_MOUSE_SPEED=150
export DREAMBOT_DISABLE_SOUNDS=true
export DREAMBOT_NOTIFY_ON_BAN=false

# Start container - settings automatically applied
docker-compose -f docker-compose.local.yml up
```

### Example 2: Production High-Performance Settings
```bash
# In stack.env:
DREAMBOT_CPU_SAVER=false
DREAMBOT_FPS=60
DREAMBOT_LOW_MEMORY=false
DREAMBOT_RENDER_DISTANCE=50
DREAMBOT_MOUSE_SPEED=200
```

### Example 3: Silent Mode (No Notifications)
```bash
DREAMBOT_NOTIFY_ON_BAN=false
DREAMBOT_NOTIFY_ON_DEATH=false
DREAMBOT_NOTIFY_ON_LEVEL_UP=false
DREAMBOT_NOTIFY_ON_PET=false
DREAMBOT_NOTIFY_ON_VALUABLE_DROP=false
```

### Example 4: Custom Script Configuration
```bash
DREAMBOT_LAST_RAN_SCRIPT="Premium:2.0:Custom Skiller"
DREAMBOT_FAVORITE_SCRIPTS="Custom Skiller,Mining Bot,Fishing Pro,Combat Trainer"
```

## 🔍 Testing and Validation

### Test the Dynamic Generation
```bash
# Run the test script:
node test-dreambot-dynamic-settings.js

# Or test generation directly:
node generate-dreambot-settings.js
```

### Verify Settings in Container
```bash
# Check generated settings:
docker exec farm-admin-local cat /app/settings.json

# Check DreamBot directory:
docker exec farm-admin-local cat /root/DreamBot/BotData/settings.json

# View environment variables:
docker exec farm-admin-local printenv | grep DREAMBOT_
```

## 🎯 Benefits

### 1. **Environment-Specific Configuration**
- **Development**: Debug mode, higher FPS, verbose notifications
- **Production**: Optimized performance, minimal notifications
- **Testing**: Fresh start mode, developer tools enabled

### 2. **Zero-Downtime Configuration Changes**
- Update environment variables in Portainer
- Restart container
- New settings automatically applied

### 3. **Discord Integration**
- All DreamBot notifications automatically use configured webhook
- Granular control over notification types
- Automatic user mentions on critical events

### 4. **Version Control Friendly**
- No hardcoded values in repository
- Environment-specific configurations
- Easy to maintain across deployments

## 🛠️ Advanced Configuration

### Custom Settings Template
You can modify `generate-dreambot-settings.js` to add new environment variables:

```javascript
// Add new setting:
"myCustomSetting": process.env.DREAMBOT_MY_CUSTOM_SETTING === 'true' || false,
```

### Override Generation
For special cases, you can still manually place a `settings.json` file, and it will be used as fallback if the generator fails.

### Multiple Environment Layers
```bash
# Base settings in docker-compose.yml
DREAMBOT_CPU_SAVER=true

# Override in environment file
DREAMBOT_CPU_SAVER=false

# Override in container environment
docker run -e DREAMBOT_CPU_SAVER=true ...
```

## 📊 Full Settings Mapping

| Environment Variable | Settings.json Field | Type | Default | Description |
|---------------------|---------------------|------|---------|-------------|
| `DREAMBOT_CPU_SAVER` | `cpuSaver` | boolean | `true` | Enable CPU saving mode |
| `DREAMBOT_FPS` | `fps` | number | `20` | Frames per second |
| `DREAMBOT_DEVELOPER_MODE` | `developerMode` | boolean | `false` | Developer mode |
| `DREAMBOT_COVERT_MODE` | `covertMode` | boolean | `true` | Covert operation mode |
| `DISCORD_WEBHOOK_URL` | `discordWebhook` | string | `""` | Discord webhook URL |
| *...and 60+ more settings* | | | | |

## 🔧 Troubleshooting

### Settings Not Applied
1. Check environment variables: `printenv | grep DREAMBOT_`
2. Verify generator runs: Check container logs for "DreamBot settings.json"
3. Check file permissions: `ls -la /root/DreamBot/BotData/settings.json`

### Generator Fails
1. Falls back to static `settings.json`
2. Check logs for error messages
3. Verify `generate-dreambot-settings.js` exists in container

### Environment Variables Not Read
1. Ensure proper format: `DREAMBOT_SETTING_NAME=value`
2. Check docker-compose environment section
3. Verify .env file is loaded

## 🎉 Success Criteria

✅ **DreamBot settings.json is now fully hooked to environment labels**  
✅ **Dynamic generation from environment variables**  
✅ **Discord webhook integration**  
✅ **Production and development environment support**  
✅ **Zero hardcoded values in settings**  
✅ **Comprehensive testing and validation**  

The DreamBot settings are now completely environment-driven, allowing for flexible, maintainable, and deployment-specific configurations without touching any files! 