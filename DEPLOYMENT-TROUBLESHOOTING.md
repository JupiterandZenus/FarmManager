# Farm Manager Deployment Troubleshooting Guide

## 🚨 Common Deployment Issues

### Issue: "Failed to fetch" / "Error loading agents"

This typically occurs when the frontend cannot connect to the backend API. Here are the solutions:

## ✅ Solutions Applied

### 1. Dynamic URL Configuration
The application now automatically detects the server URL instead of using hardcoded `localhost:3000`:

- **API Base URL**: Now uses `${window.location.protocol}//${window.location.host}`
- **WebSocket URL**: Automatically switches between `ws://` and `wss://` based on protocol

### 2. Connection Debugging Tools
Added comprehensive debugging tools to help identify connection issues:

- **Connection Info Panel**: Shows current API and WebSocket URLs (top-right corner)
- **Health Check Button**: Test server connectivity with one click
- **Real-time Status**: Live connection status with detailed error messages
- **Enhanced Logging**: Detailed console logs for troubleshooting

## 🔧 How to Test the Fix

### 1. Access the Web Interface
Navigate to your Farm Manager URL (e.g., `http://your-unraid-ip:3000`)

### 2. Check Connection Info Panel
Look for the connection info panel in the top-right corner:
```
🌐 API: http://your-unraid-ip:3000
🔌 WebSocket: ws://your-unraid-ip:3000
⏳ Connecting...
[Test Connection] button
```

### 3. Test Server Health
Click the "Test Connection" button to verify:
- ✅ Server is reachable
- ✅ Database is connected
- ✅ API is responding

### 4. Check WebSocket Connection
Look for the "LIVE" indicator in the navigation:
- 🟢 **LIVE** = Connected and receiving real-time updates
- 🔴 **OFFLINE** = Disconnected
- 🟡 **CONNECTING** = Attempting to reconnect

## 🐛 Troubleshooting Steps

### If you still see "Failed to fetch":

1. **Check the Connection Info Panel**
   - Verify the API URL matches your server address
   - Click "Test Connection" to see detailed error

2. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for detailed error messages in Console tab
   - Check Network tab for failed requests

3. **Verify Server is Running**
   ```bash
   # Check if server is listening on port 3000
   netstat -an | grep :3000
   
   # Or check Docker container status
   docker ps | grep farm-manager
   ```

4. **Check Docker Port Mapping**
   Ensure your docker-compose.yml has correct port mapping:
   ```yaml
   ports:
     - "3000:3000"  # Host:Container
   ```

5. **Firewall/Network Issues**
   - Ensure port 3000 is open on your Unraid server
   - Check if any firewall is blocking the connection

### If WebSocket shows "OFFLINE":

1. **Check WebSocket URL**
   - Should show `ws://your-server-ip:3000` (not localhost)
   - For HTTPS, should show `wss://your-server-ip:3000`

2. **Verify WebSocket Support**
   - Some reverse proxies need special WebSocket configuration
   - Check if your setup supports WebSocket connections

## 📊 Connection Status Indicators

### API Connection Status:
- ✅ **Server Healthy** - API is working correctly
- ❌ **Health Check Failed** - Server responded but with error
- ❌ **Network Error** - Cannot reach server (CORS/connection issue)
- ❌ **Server Unreachable** - Server is down or wrong URL

### WebSocket Status:
- 🟢 **LIVE** - Real-time updates working
- 🔴 **OFFLINE** - WebSocket disconnected
- 🟡 **CONNECTING** - Attempting to reconnect
- 🔴 **ERROR** - WebSocket connection failed

## 🔄 Auto-Recovery Features

The application includes several auto-recovery mechanisms:

1. **WebSocket Auto-Reconnect**: Automatically attempts to reconnect up to 5 times
2. **Health Check**: Performs initial health check on page load
3. **Connection Monitoring**: Continuous monitoring of connection status
4. **User Notifications**: Toast notifications for all connection events

## 📝 Deployment Checklist

Before deploying, ensure:

- [ ] Server is accessible on the target IP/port
- [ ] Database is connected and healthy
- [ ] Port 3000 is properly mapped in Docker
- [ ] No firewall blocking the connection
- [ ] WebSocket support is enabled (if using reverse proxy)

## 🆘 Getting Help

If you're still experiencing issues:

1. **Check the connection info panel** for specific error details
2. **Open browser console** and look for error messages
3. **Test the health check** to verify server connectivity
4. **Check Docker logs** for server-side errors:
   ```bash
   docker logs farm-manager-container-name
   ```

The enhanced debugging tools should help identify the exact cause of any connection issues! 