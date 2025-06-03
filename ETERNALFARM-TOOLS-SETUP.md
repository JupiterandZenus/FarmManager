# EternalFarm Tools Setup Guide

This guide explains how to configure the additional EternalFarm tools (Checker and Browser Automator) that run inside your Docker containers.

## Overview

Your Farm Manager already has the main EternalFarm API integration working with:
- ✅ **ETERNALFARM_AGENT_KEY**: `RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5`
- ✅ **ETERNAL_API_URL**: `https://api.eternalfarm.net`

The additional tools require separate authentication keys:

## Required Keys

### 1. ETERNAL_FARM_KEY
- **Purpose**: Used by the EternalFarmChecker tool
- **Function**: Account verification and status checking
- **Location in Entry.sh**: Line 825
- **Current Status**: ❌ Not set

### 2. ETERNAL_AUTH_KEY  
- **Purpose**: Used by the EternalFarmBrowserAutomator
- **Function**: Web browser automation for account management
- **Location in Entry.sh**: Lines 817 and 825
- **Current Status**: ❌ Not set

## How to Get These Keys

1. **Log into your EternalFarm account**
2. **Navigate to Settings → API Keys**
3. **Look for**:
   - **Checker Key** or **Farm Key** (for ETERNAL_FARM_KEY)
   - **Browser Automation Key** or **Auth Key** (for ETERNAL_AUTH_KEY)

## Configuration Steps

### Option 1: Environment Variables (Recommended)
```bash
export ETERNAL_FARM_KEY="your_checker_key_here"
export ETERNAL_AUTH_KEY="your_browser_automator_key_here"
```

### Option 2: Update config.env
```env
ETERNAL_FARM_KEY=your_checker_key_here
ETERNAL_AUTH_KEY=your_browser_automator_key_here
```

### Option 3: Docker Compose Override
Create a `docker-compose.override.yml`:
```yaml
version: '3.8'
services:
  farm-admin:
    environment:
      - ETERNAL_FARM_KEY=your_checker_key_here
      - ETERNAL_AUTH_KEY=your_browser_automator_key_here
```

## What These Tools Do

### EternalFarmChecker
- Runs every 4 hours (14400 seconds)
- Verifies account status and health
- Sends Discord notifications about account issues
- Helps prevent account problems

### EternalFarmBrowserAutomator  
- Runs every 6 hours (21600 seconds)
- Automates web browser tasks
- Handles account maintenance
- Manages browser-based operations

## Current Status

Your **main API integration is working perfectly**:
- ✅ Fetching 3 agents from EternalFarm API
- ✅ Bi-directional sync working
- ✅ Discord notifications active
- ✅ WebSocket updates functioning

The missing keys only affect the **additional automation tools** that run inside Docker containers.

## Troubleshooting

### If Keys Are Not Set
You'll see these messages in your Entry.sh logs:
```
[!] EternalFarmChecker not started: missing keys.
[!] EternalFarmBrowserAutomator not started: ETERNAL_AUTH_KEY not set.
```

### After Setting Keys
You should see:
```
Checker ran with auth ****1234 and key ****5678
Automator launched with auth ****1234
```

## Security Notes

- Keep these keys secure and private
- Don't commit them to version control
- Use environment variables in production
- Regularly rotate keys for security

## Support

If you can't find these keys in your EternalFarm account:
1. Contact EternalFarm support
2. Check if your account has access to these tools
3. Verify your subscription level includes these features

Your main Farm Manager will continue working perfectly without these keys - they're only for additional automation features. 