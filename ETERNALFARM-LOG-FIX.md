# EternalFarm Log Directory and DreamBot Settings Fix

## Issue Description

Two issues have been addressed with this fix:

1. The EternalFarm applications (Agent, Checker, and Browser Automator) were failing to start properly with the following error:

```
[INTERNAL ERROR] 2025/06/04 10:45:26 pretty.go:133: open /root/EternalFarm/Logs/agent.log: no such file or directory

2025/06/04 10:45:26 ??:1: ERROR Fatal error: dialog canceled
```

2. The DreamBot settings.json file was not properly created in the required location:

```
/root/DreamBot/BotData/settings.json
```

## Solution

The following changes have been made to fix these issues:

### EternalFarm Logs Fix
1. Created the `/root/EternalFarm/Logs/` directory structure at container startup
2. Created empty log files for each application:
   - `/root/EternalFarm/Logs/agent.log`
   - `/root/EternalFarm/Logs/checker.log`
   - `/root/EternalFarm/Logs/automator.log`
3. Stored API keys in the log directory:
   - `/root/EternalFarm/Logs/agent.key`
   - `/root/EternalFarm/Logs/checker.key`
   - `/root/EternalFarm/Logs/automator.key`
4. Updated application configurations to point to these new file locations
5. Updated desktop shortcuts to use the new key file locations

### DreamBot Settings Fix
1. Created the `/root/DreamBot/BotData/` directory structure at container startup
2. Generated the settings.json file with the proper configuration
3. Set the correct permissions (600) on the settings.json file
4. Created a backup copy in the `/appdata/DreamBot/BotData/` location

## Files Modified

- `Entry.sh`: Added directory creation and key file setup, added DreamBot settings creation
- `fix-auto-login.sh`: Updated to create log directories and set proper file paths, added DreamBot settings
- `supervisord.conf`: Updated to use the new key file locations
- `portainer-farmmanager-stack.yml`: Updated Portainer stack configuration with all fixes
- Created `fix-vnc-issue.sh` to troubleshoot VNC, log directory issues, and DreamBot settings

## Verifying the Fix

After these changes:

1. The EternalFarm applications should start without prompting for authentication keys
2. DreamBot should load with the proper settings applied

To verify the fix, check that:

1. The `/root/EternalFarm/Logs/` directory exists and contains the proper log files
2. The `/root/DreamBot/BotData/` directory exists and contains settings.json
3. All files have the correct permissions:
   - Log files: 644
   - Key files: 600
   - Settings.json: 600

## Manual Fix

If you need to manually fix these issues in a running container, you can:

1. Connect to the container shell using: `docker exec -it farmmanager /bin/bash`
2. Run the fix script: `/app/fix-vnc-issue.sh`
3. Restart the container or services

## Future Deployment

These changes have been incorporated into all deployment methods:
- Docker Compose files
- Portainer stack configuration
- Entry scripts

All future deployments should have these issues fixed automatically. 