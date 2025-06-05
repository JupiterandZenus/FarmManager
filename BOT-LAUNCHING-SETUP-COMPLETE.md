# 🚀 Bot Launching Functionality - Setup Complete!

## ✅ What Has Been Added

Your Farm Manager now has **full DreamBot launching functionality**! Here's what was implemented:

### 🔧 Core Components Added

1. **`dreambot-launcher.js`** - DreamBot process management
   - Launches DreamBot instances with account credentials
   - Handles process termination
   - Checks for DreamBot installation
   - Manages Java environment and display settings

2. **`enhanced-task-handler.js`** - Enhanced task management
   - Integrates DreamBot launching into task start/stop
   - Tracks process IDs in database
   - Handles launch errors gracefully
   - Sends Discord notifications for bot events

3. **Updated `server.js`** - Integrated bot launching
   - Added enhanced task handlers
   - Process ID tracking
   - Real-time WebSocket updates
   - Error handling and logging

4. **Updated Prisma Schema** - Database tracking
   - Added `process_id` field to Task model
   - Tracks running DreamBot processes
   - Links tasks to actual bot instances

## 🎯 New Features Available

### When You Start a Task:
- ✅ **Actual DreamBot launches** with the selected account
- ✅ **Process ID tracked** in database
- ✅ **Real-time notifications** via WebSocket
- ✅ **Discord alerts** when bots start/stop
- ✅ **Error handling** if launch fails
- ✅ **VNC visibility** - see the bot GUI

### When You Stop a Task:
- ✅ **DreamBot process terminated** cleanly
- ✅ **Database updated** with completion time
- ✅ **Process ID cleared** from database
- ✅ **Discord notification** sent

## 🚀 Next Steps to Deploy

### 1. Update Your Database Schema
When you restart your Docker container, the database will automatically update with the new `process_id` field.

### 2. Restart Your Farm Manager
```bash
# If using Portainer stack:
# Just restart the stack from Portainer interface

# If using docker-compose:
docker-compose restart

# Or full rebuild:
docker-compose down && docker-compose up -d
```

### 3. Test Bot Launching
1. Access your Farm Manager web interface (port 3333)
2. Go to the Tasks section
3. Click "Start" on any task
4. **You should see**:
   - Task status changes to "running"
   - Process ID appears in the task details
   - Discord notification (if configured)
   - DreamBot GUI visible in VNC (port 8080)

## 🔍 How It Works

### Task Start Process:
1. User clicks "Start Task" in web interface
2. Enhanced task handler gets account details
3. DreamBot launcher executes: `java -jar DBLauncher.jar --username [account] --password [password] --world 301`
4. Process ID stored in database
5. Real-time updates sent to all connected clients
6. Discord notification sent

### DreamBot Command Example:
```bash
java -Xmx1024m -Djava.awt.headless=false -jar /root/DreamBot/DBLauncher.jar \
  --username YourAccount --password YourPassword --world 301 \
  --no-splash --developer-mode
```

## 📊 Database Schema Update

The Task model now includes:
```prisma
model Task {
  // ... existing fields ...
  process_id      Int?      // DreamBot process ID
  // ... rest of model ...
}
```

## 🎮 VNC Access

- **Web VNC**: http://your-server:8080
- **Direct VNC**: your-server:5900
- **No password required** (configured for easy access)

You'll be able to see all DreamBot instances running in the desktop environment.

## 🔧 Configuration

### DreamBot Settings
The system uses these environment variables:
- `DREAMBOT_WORLD=301` (default world)
- `DREAMBOT_SCRIPT` (optional script to run)
- `DREAMBOT_USERNAME` (can be overridden per task)
- `DREAMBOT_PASSWORD` (can be overridden per task)

### Java Environment
- **Java Home**: `/usr/lib/jvm/temurin-8-jdk-amd64`
- **Display**: `:1` (X11 forwarding)
- **Memory**: `-Xmx1024m` per bot instance

## 🚨 Troubleshooting

### If Bots Don't Launch:
1. **Check DreamBot Installation**:
   - Should be at `/root/DreamBot/DBLauncher.jar`
   - Alternative paths checked automatically

2. **Check Java Installation**:
   - Java 8 required for DreamBot
   - Should be at `/usr/lib/jvm/temurin-8-jdk-amd64`

3. **Check VNC Connection**:
   - Access http://your-server:8080
   - Should see desktop with any running bots

4. **Check Logs**:
   - Farm Manager logs show launch attempts
   - DreamBot stdout/stderr captured
   - Process errors logged

### Common Issues:
- **"DreamBot launcher not found"**: DreamBot not installed in container
- **"Java not found"**: Java not properly installed
- **"Display not available"**: X11/VNC not running
- **"Account not found"**: Database issue with account data

## 📈 Performance Notes

- **Memory**: Each DreamBot instance uses ~1GB RAM
- **CPU**: Moderate CPU usage per bot
- **Display**: All bots share the same X11 display
- **Processes**: Each bot runs as separate Java process

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **In Farm Manager Web UI**:
   - Tasks show "running" status
   - Process IDs displayed
   - Real-time status updates

2. **In VNC (port 8080)**:
   - DreamBot client windows visible
   - Bots logging into RuneScape
   - Multiple bots can run simultaneously

3. **In Discord** (if configured):
   - "🚀 Bot Task Started" notifications
   - Process ID and account details
   - "🛑 Bot Task Stopped" when stopped

4. **In Logs**:
   - "✅ DreamBot launched with PID: [number]"
   - "🎮 Account: [username] | Task: [id]"
   - No error messages

## 🔄 Backup Information

Your original `server.js` was backed up as:
- `server.js.backup.1748992700278`

If you need to revert changes, you can restore from this backup.

---

**🎊 Congratulations!** Your Farm Manager now has full bot launching capabilities. When you restart your Docker container and start tasks, you'll see actual DreamBot instances launching and running your accounts! 