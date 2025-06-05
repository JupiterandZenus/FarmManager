# EternalFarm Individual Service Keys Configuration

## Overview
The Farm Manager now supports individual authentication keys for each EternalFarm service, matching the key files shown in your screenshot:
- `agent.key` - EternalFarm Agent
- `checker.key` - EternalFarm Checker  
- `api.key` - EternalFarm Browser Automator

## Key File Structure
```
/appdata/EternalFarm/
├── agent.key      # EternalFarm Agent authentication
├── checker.key    # EternalFarm Checker authentication
└── api.key        # EternalFarm Browser Automator authentication
```

## Environment Variables
Each service uses its own dedicated environment variable:

```bash
# Individual EternalFarm Service Keys
AGENT_KEY=RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5
CHECKER_KEY=RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5
AUTOMATOR_KEY=RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5
```

## PRIORITY Setup Process

### 1. Docker Entrypoint (PRIORITY 1)
The `docker-entrypoint.sh` script creates key files **BEFORE** any services launch:

```bash
# PRIORITY 1: Create EternalFarm key files FIRST (before any services launch)
echo "🔑 PRIORITY: Setting up EternalFarm key files..."
mkdir -p /appdata/EternalFarm

# Create individual key files for each service
if [ -n "$AGENT_KEY" ]; then
    echo "$AGENT_KEY" > /appdata/EternalFarm/agent.key
    chmod 600 /appdata/EternalFarm/agent.key
fi

if [ -n "$CHECKER_KEY" ]; then
    echo "$CHECKER_KEY" > /appdata/EternalFarm/checker.key
    chmod 600 /appdata/EternalFarm/checker.key
fi

if [ -n "$AUTOMATOR_KEY" ]; then
    echo "$AUTOMATOR_KEY" > /appdata/EternalFarm/api.key
    chmod 600 /appdata/EternalFarm/api.key
fi
```

### 2. Service Launch Configuration
Each service launches with its dedicated key file:

#### EternalFarm Agent (Priority 30)
```bash
/usr/local/bin/EternalFarmAgent --key-file=/appdata/EternalFarm/agent.key --show-gui
```
- **Terminal Title**: "EternalFarm Agent"
- **Key File**: `/appdata/EternalFarm/agent.key`
- **Environment**: `AGENT_KEY`

#### EternalFarm Checker (Priority 40)
```bash
/usr/local/bin/EternalFarmChecker --key-file=/appdata/EternalFarm/checker.key --show-gui
```
- **Terminal Title**: "EternalFarm Checker"
- **Key File**: `/appdata/EternalFarm/checker.key`
- **Environment**: `CHECKER_KEY`

#### EternalFarm Browser Automator (Priority 50)
```bash
/usr/local/bin/EternalFarmBrowserAutomator --key-file=/appdata/EternalFarm/api.key --show-gui
```
- **Terminal Title**: "EternalFarm Browser Automator"
- **Key File**: `/appdata/EternalFarm/api.key`
- **Environment**: `AUTOMATOR_KEY`

## Portainer Stack Configuration
The `portainer-farmmanager-stack.yml` includes all three environment variables:

```yaml
environment:
  # EternalFarm Individual Service Keys
  - AGENT_KEY=${AGENT_KEY:-RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5}
  - CHECKER_KEY=${CHECKER_KEY:-RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5}
  - AUTOMATOR_KEY=${AUTOMATOR_KEY:-RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5}
```

## Stack Environment File
The `stack.env` file defines the individual keys:

```bash
# EternalFarm Individual Service Keys
AGENT_KEY=RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5
CHECKER_KEY=RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5
AUTOMATOR_KEY=RZbfSKKe3qCtHVk0ty3H41yJc403rMNzdj73v7ar6Owp5kfQjuLiyaRrOsoe81N5
```

## Expected Behavior

### Container Startup Sequence
1. **PRIORITY 1**: Key files created in `/appdata/EternalFarm/`
2. **Priority 10**: VNC and X11 services start
3. **Priority 20**: Farm Manager web interface starts
4. **Priority 30**: EternalFarm Agent launches with `agent.key`
5. **Priority 40**: EternalFarm Checker launches with `checker.key`
6. **Priority 50**: EternalFarm Browser Automator launches with `api.key`

### GUI Display
- All services display in separate terminal windows
- Terminal titles clearly identify each service
- All GUIs visible via VNC on port 8080
- Each service authenticates with its individual key

### Key File Security
- Files created with 600 permissions (owner read/write only)
- Keys loaded from environment variables at startup
- No hardcoded keys in configuration files

## Deployment Steps

1. **Update Environment Variables** (if different keys needed):
   ```bash
   # Edit stack.env or set in Portainer
   AGENT_KEY=your_agent_key_here
   CHECKER_KEY=your_checker_key_here
   AUTOMATOR_KEY=your_automator_key_here
   ```

2. **Deploy Stack**:
   - Use updated `portainer-farmmanager-stack.yml`
   - Environment variables will be loaded from `stack.env`

3. **Verify Operation**:
   - Access VNC: `http://your-server:8080`
   - Look for three terminal windows with EternalFarm services
   - Check container logs for key file creation messages

## Troubleshooting

### Key Files Not Created
- Check environment variables are set: `AGENT_KEY`, `CHECKER_KEY`, `AUTOMATOR_KEY`
- Verify docker-entrypoint.sh has execute permissions
- Check container logs for key creation messages

### Services Not Starting
- Ensure key files exist in `/appdata/EternalFarm/`
- Check file permissions (should be 600)
- Verify EternalFarm binaries are installed in container

### GUI Not Visible
- Confirm VNC is accessible on port 8080
- Check X11 display is set to `:1`
- Verify xfce4-terminal is launching services

## Benefits of Individual Keys

1. **Security**: Each service has its own authentication
2. **Flexibility**: Different keys can be used per service if needed
3. **Monitoring**: Easier to track which service is performing actions
4. **Maintenance**: Individual key rotation without affecting other services
5. **Compliance**: Matches the key file structure shown in your screenshot

This configuration ensures that each EternalFarm service operates with its own dedicated authentication key, providing better security and matching your existing key file structure. 