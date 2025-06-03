# EternalFarm Integration Setup Guide

This guide will help you configure the Farm Manager to automatically sync agents from your EternalFarm account.

## Prerequisites

1. **EternalFarm Account**: You need an active EternalFarm account
2. **API Access**: Ensure your account has API access enabled
3. **Agent Key**: You need your EternalFarm Agent API key

## Step 1: Get Your EternalFarm API Key

1. Log into your EternalFarm account
2. Navigate to your account settings or API section
3. Look for "Agent API Key" or "API Keys"
4. Copy your agent API key (it typically starts with a prefix like `ef_`)

## Step 2: Configure the API Key

1. Open the `config.env` file in your Farm Manager directory
2. Find the line: `ETERNALFARM_AGENT_KEY=YOUR_ACTUAL_ETERNALFARM_API_KEY_HERE`
3. Replace `YOUR_ACTUAL_ETERNALFARM_API_KEY_HERE` with your actual API key

Example:
```env
# Before
ETERNALFARM_AGENT_KEY=YOUR_ACTUAL_ETERNALFARM_API_KEY_HERE

# After (example key)
ETERNALFARM_AGENT_KEY=ef_1234567890abcdef1234567890abcdef
```

## Step 3: Verify API URL

Ensure the API URL is correct in your `config.env`:
```env
ETERNALFARM_API_URL=https://api.eternalfarm.com
```

## Step 4: Restart the Server

1. Stop your Farm Manager server (Ctrl+C)
2. Start it again: `node server.js`
3. Look for these success messages:
   ```
   🔑 EternalFarm Agent Key: ef_1234567...
   🌐 EternalFarm API URL: https://api.eternalfarm.com
   🔄 Performing initial agent sync...
   ✅ Fetched X agents from EternalFarm API
   ✅ Synced X agents with database
   ```

## Step 5: Verify Agent Data

1. Open your web interface: http://localhost:3000
2. Navigate to the "Agents" section
3. You should see your agents loaded from EternalFarm
4. Each agent should show:
   - Agent ID
   - Agent Name
   - Status (online/offline)
   - Last seen timestamp
   - IP address (if available)

## Troubleshooting

### No Agents Showing
- **Check API Key**: Ensure your API key is correct and has proper permissions
- **Check Network**: Ensure your server can reach https://api.eternalfarm.com
- **Check Logs**: Look for error messages in the server console

### API Key Issues
- **Invalid Key**: You'll see "EternalFarm API error: 401 Unauthorized"
- **No Permissions**: You'll see "EternalFarm API error: 403 Forbidden"
- **Rate Limited**: You'll see "EternalFarm API error: 429 Too Many Requests"

### Manual Sync
You can manually trigger an agent sync by making a POST request to:
```
POST http://localhost:3000/api/v1/agents/sync
Authorization: Bearer YOUR_FARM_MANAGER_API_KEY
```

## Automatic Sync Schedule

Once configured, the Farm Manager will:
- Sync agents on startup
- Sync agents every 5 minutes automatically
- Update agent status and information in real-time

## API Integration Details

The Farm Manager uses the EternalFarm API to:
- Fetch agent list: `GET /agents`
- Get agent details including status, IP, and last seen
- Sync this data with the local database
- Provide real-time updates via WebSocket

## Security Notes

- Keep your EternalFarm API key secure
- Don't commit the `config.env` file to version control
- Use environment variables in production deployments
- Regularly rotate your API keys for security

## Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify your EternalFarm account has API access
3. Test your API key with a simple curl command:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" https://api.eternalfarm.com/agents
   ```

For more information about the EternalFarm API, refer to the [EFClient documentation](https://github.com/LostVirt/EFClient). 