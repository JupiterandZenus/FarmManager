# 🔔 Discord Webhook Setup for Farm Manager

## Overview
Farm Manager can send real-time notifications to Discord when the server goes online, offline, or encounters issues. This guide will help you set up Discord webhooks to receive these notifications.

## 📋 What Notifications You'll Receive

### 🟢 **Online Notifications**
- Server startup confirmation
- Database connection status
- EternalFarm API connection status
- Server URL and features summary

### 🔴 **Offline Notifications**
- Manual shutdown (Ctrl+C)
- Server errors (port conflicts, etc.)
- Database connection lost
- Uncaught exceptions
- Server termination

### 🔄 **Status Updates**
- Database connection restored
- Real-time error monitoring

## 🚀 Setup Instructions

### Step 1: Create a Discord Webhook

1. **Open your Discord server** where you want to receive notifications
2. **Right-click on the channel** where you want notifications (e.g., #farm-manager-alerts)
3. **Select "Edit Channel"**
4. **Go to "Integrations" tab**
5. **Click "Create Webhook"**
6. **Configure your webhook:**
   - **Name:** Farm Manager Bot
   - **Avatar:** Upload a farm/bot icon (optional)
   - **Channel:** Select your notification channel
7. **Copy the Webhook URL** (it looks like: `https://discord.com/api/webhooks/123456789/abcdef...`)

### Step 2: Configure Farm Manager

1. **Copy the configuration template:**
   ```bash
   copy config.env .env
   ```

2. **Edit the `.env` file** and add your Discord webhook URL:
   ```env
   # Discord Notifications
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
   ```

3. **Replace the placeholder** with your actual webhook URL:
   ```env
   # Example:
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1234567890123456789/abcdefghijklmnopqrstuvwxyz1234567890
   ```

### Step 3: Test the Configuration

1. **Run the test script:**
   ```bash
   node test-offline-notification.js
   ```

2. **You should see:** "✅ Discord notification sent successfully" instead of "⚠️ Discord webhook URL not configured"

3. **Check your Discord channel** for test notifications

### Step 4: Start Farm Manager

1. **Start the server:**
   ```bash
   node server.js
   ```

2. **You should receive a startup notification** in Discord like:
   ```
   🚀 Farm Manager 0.1
   Farm Manager has been successfully launched and is now online!
   
   🌐 Server URL: http://localhost:3000/
   📊 Database: Connected to MariaDB
   🔧 Features: Client Launcher, P2P Master AI Timer, Account Management, Real-time Updates
   ⏰ Started: 6/1/2025, 5:15:30 AM
   ```

## 🧪 Testing Offline Notifications

To test that offline notifications work:

1. **Start Farm Manager** (you'll get an online notification)
2. **Press Ctrl+C** to stop the server (you'll get an offline notification)
3. **Check Discord** for both notifications

## 🔧 Troubleshooting

### ❌ "Discord webhook URL not configured"
- Make sure you copied the webhook URL correctly
- Ensure there are no extra spaces or characters
- Verify the `.env` file is in the correct directory

### ❌ "Discord notification failed with status: 404"
- The webhook URL is invalid or the webhook was deleted
- Create a new webhook and update your `.env` file

### ❌ "Discord notification failed with status: 429"
- You're being rate limited (too many notifications)
- Discord allows 30 requests per minute per webhook

### ❌ No notifications received
- Check that the webhook is in the correct Discord channel
- Verify the webhook hasn't been disabled
- Make sure your Discord notifications are enabled

## 📱 Example Notifications

### Online Notification
```
🚀 Farm Manager 0.1
Farm Manager has been successfully launched and is now online!

🌐 Server URL: http://localhost:3000/
📊 Database: Connected to MariaDB
🔧 Features: Client Launcher, P2P Master AI Timer, Account Management, Real-time Updates
🔑 EternalFarm: Connected
⏰ Started: 6/1/2025, 5:15:30 AM

Server: http://localhost:3000/
Status: 🟢 Online
```

### Offline Notification
```
🔴 Farm Manager 0.1 - OFFLINE
Farm Manager has gone offline!

⏰ Offline Time: 6/1/2025, 5:20:15 AM
📊 Reason: Manual shutdown (SIGINT)
🔧 Uptime: 285 seconds
🌐 Last URL: http://localhost:3000/

Server: http://localhost:3000/
Status: 🔴 Offline
```

## 🔐 Security Notes

- **Keep your webhook URL private** - anyone with the URL can send messages to your Discord channel
- **Don't commit webhook URLs to git** - they're already excluded in `.gitignore`
- **Regenerate webhooks** if they're accidentally exposed

## 🎯 Next Steps

Once Discord notifications are working:
1. Deploy to your Unraid server with Portainer
2. Update the webhook URL in your production environment
3. Monitor your Farm Manager deployment in real-time through Discord! 