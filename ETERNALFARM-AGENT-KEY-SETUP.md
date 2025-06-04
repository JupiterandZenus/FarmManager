# EternalFarm Individual Service Keys Setup Guide

## Overview
This guide explains how individual EternalFarm service keys are configured and loaded in the Farm Manager container. Each service (Agent, Checker, Automator) uses its own dedicated key file.

## Key File Locations
The EternalFarm services load their authentication keys from:
```
/appdata/EternalFarm/agent.key     # EternalFarm Agent
/appdata/EternalFarm/checker.key   # EternalFarm Checker  
/appdata/EternalFarm/api.key       # EternalFarm Browser Automator
```

## Automatic Setup Process

### 1. Docker Entrypoint Script (PRIORITY 1)
The `docker-entrypoint.sh` script automatically creates key files **BEFORE** any services launch:
- Creates the `/appdata/EternalFarm` directory
- Writes individual environment variables to separate key files
- Sets proper file permissions (600) for security

### 2. Directory Structure Created
```
/appdata/
├── EternalFarm/
│   ├── agent.key          # EternalFarm Agent key
│   ├── checker.key        # EternalFarm Checker key
│   └── api.key           # EternalFarm Browser Automator key
└── DreamBot/
    └── BotData/
        └── settings.json   # DreamBot configuration
```

### 3. Environment Variables
Individual keys are sourced from separate environment variables:
```bash
AGENT_KEY=RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5
CHECKER_KEY=RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5
AUTOMATOR_KEY=RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5
```

## EternalFarm Services GUI Configuration

### Individual Service Configuration
Each service launches in its own terminal window with dedicated key file:

#### EternalFarm Agent
- **Window Title**: "EternalFarm Agent"
- **Key File**: `/appdata/EternalFarm/agent.key`
- **Command**: `/usr/local/bin/EternalFarmAgent --key-file=/appdata/EternalFarm/agent.key --show-gui`

#### EternalFarm Checker
- **Window Title**: "EternalFarm Checker"
- **Key File**: `/appdata/EternalFarm/checker.key`
- **Command**: `/usr/local/bin/EternalFarmChecker --key-file=/appdata/EternalFarm/checker.key --show-gui`

#### EternalFarm Browser Automator
- **Window Title**: "EternalFarm Browser Automator"
- **Key File**: `/appdata/EternalFarm/api.key`
- **Command**: `/usr/local/bin/EternalFarmBrowserAutomator --key-file=/appdata/EternalFarm/api.key --show-gui`

### Supervisord Configuration
```ini
[program:eternalfarm-agent]
command=.../EternalFarmAgent --key-file=/appdata/EternalFarm/agent.key --show-gui

[program:eternalfarm-checker]
command=.../EternalFarmChecker --key-file=/appdata/EternalFarm/checker.key --show-gui

[program:eternalfarm-browser-automator]
command=.../EternalFarmBrowserAutomator --key-file=/appdata/EternalFarm/api.key --show-gui
```

## Viewing the GUI

### 1. Access VNC Interface
- Open your browser to: `http://your-server:8080`
- You'll see the XFCE desktop environment

### 2. Look for Terminal Windows
- **EternalFarm Agent**: Terminal window with title "EternalFarm Agent"
- **EternalFarm Checker**: Terminal window with title "EternalFarm Checker"  
- **EternalFarm Browser Automator**: Terminal window with title "EternalFarm Browser Automator"

### 3. GUI Applications
Each terminal window will contain the respective EternalFarm application with its GUI interface.

## Testing the Setup

### Run the Test Script
```bash
./test-eternalfarm-gui.sh
```

### Expected Test Results
✅ **PASS**: All tests should pass including:
- Settings.json files copied correctly
- EternalFarm agent.key file created
- X11 display setup working
- Terminal availability confirmed
- EternalFarm binaries found
- Supervisord configuration correct

## Troubleshooting

### Agent Key Issues
If the agent doesn't start:
1. Check if `/appdata/EternalFarm/agent.key` exists
2. Verify the key file has content: `cat /appdata/EternalFarm/agent.key`
3. Check file permissions: `ls -la /appdata/EternalFarm/agent.key`

### GUI Not Visible
If you can't see the GUI:
1. Ensure VNC is accessible on port 8080
2. Check if XFCE desktop is running
3. Look for terminal windows in the desktop
4. Check supervisord logs: `/var/log/eternalfarm-agent.log`

### Key File Commands
```bash
# Check if key file exists
ls -la /appdata/EternalFarm/agent.key

# View key content (first 20 characters)
head -c 20 /appdata/EternalFarm/agent.key

# Check file permissions
stat /appdata/EternalFarm/agent.key
```

## Security Notes

### File Permissions
- Agent key file has 600 permissions (owner read/write only)
- EternalFarm directory has 700 permissions (owner access only)

### Environment Variables
- `AUTH_AGENT_KEY` is passed securely through Docker environment
- Key is written to file during container startup
- No key exposure in process lists or logs

## Integration with Farm Manager

### DreamBot Settings
The `settings.json` file is automatically copied to:
- `/root/DreamBot/BotData/settings.json`
- `/appdata/DreamBot/BotData/settings.json`

### Bot Launching
When Farm Manager launches DreamBot instances:
1. Uses settings from `/root/DreamBot/BotData/settings.json`
2. EternalFarm Agent monitors and manages the bots
3. All communication uses the key from `/appdata/EternalFarm/agent.key`

## Deployment Checklist

- [ ] `AUTH_AGENT_KEY` environment variable set in Portainer
- [ ] Container deployed with updated configuration
- [ ] VNC accessible on port 8080
- [ ] EternalFarm Agent terminal window visible
- [ ] Agent key file created at `/appdata/EternalFarm/agent.key`
- [ ] DreamBot settings copied to correct locations
- [ ] All EternalFarm services running in terminal windows

## Success Indicators

When everything is working correctly:
1. **VNC Interface**: Shows XFCE desktop with terminal windows
2. **EternalFarm Agent**: Running in titled terminal window
3. **Agent Key**: File exists with correct permissions and content
4. **DreamBot Integration**: Settings available for bot launching
5. **GUI Visibility**: All EternalFarm applications visible and interactive

---

**Note**: This setup ensures the EternalFarm Agent can properly authenticate and display its GUI interface while maintaining security through proper file permissions and key management. 