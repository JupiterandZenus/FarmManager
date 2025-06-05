# Deploying Farm Manager to Portainer Stacks

This guide will walk you through the process of deploying the Farm Manager application using Portainer Stacks, which provides a convenient web interface for managing Docker containers.

## Prerequisites

- A server or computer with Docker and Portainer installed
- Access to the Portainer web interface (typically at http://your-server:9000)
- Administrator access to Portainer

## Deployment Steps

### 1. Access the Portainer Dashboard

1. Open your web browser and navigate to your Portainer instance (e.g., http://your-server:9000)
2. Log in with your administrator credentials

### 2. Create a New Stack

1. In the left sidebar, click on **Stacks**
2. Click the **+ Add stack** button in the top right corner
3. Give your stack a name, e.g., `farm-manager`

### 3. Configure the Stack

In the "Web editor" tab, you can directly paste the contents of the `portainer-farmmanager-stack.yml` file. 

Alternatively, if you prefer to use the "Repository" method:

1. Select the **Repository** tab
2. Enter your Git repository URL: `https://github.com/JupiterandZenus/FarmManager.git`
3. Set the reference to the appropriate branch: `Farmboy`
4. Set the compose path to: `portainer-farmmanager-stack.yml`

### 4. Configure Environment Variables

You can set or override any environment variables in the "Environment variables" section. The most important ones are:

- `ETERNALFARM_AGENT_KEY`: Your EternalFarm API key
- `AGENT_KEY`, `CHECKER_KEY`, `AUTOMATOR_KEY`: Individual service keys (if using separate keys)
- `DREAMBOT_USERNAME` and `DREAMBOT_PASSWORD`: Your DreamBot credentials (if using DreamBot)
- `DISCORD_WEBHOOK_URL`: Your Discord webhook URL for notifications (optional)

### 5. Deploy the Stack

1. Click the **Deploy the stack** button at the bottom of the page
2. Portainer will pull the necessary images and create the containers

### 6. Access the Application

After deployment is complete, you can access:

- Farm Manager Web Interface: http://your-server:3333
- noVNC Web Client: http://your-server:8080
- VNC Client: your-server:5900
- SSH: your-server:2222 (username: root, password: as configured)

### 7. Verify Auto-Login Functionality

The stack includes automatic setup for EternalFarm and DreamBot:

1. EternalFarm Agent, Checker, and Browser Automator will start automatically with your configured API keys
2. DreamBot will be configured with the settings from `settings.json`
3. All necessary log directories and files will be created automatically

## Troubleshooting

If you encounter issues with the deployment:

1. Check the container logs in Portainer by clicking on the container and then the "Logs" tab
2. If EternalFarm applications are not auto-logging in, SSH into the container and run:
   ```
   docker exec -it farm-manager_farm-admin_1 /bin/bash
   /app/fix-vnc-issue.sh
   ```
3. Restart the container after making changes:
   ```
   docker restart farm-manager_farm-admin_1
   ```

## Updating the Stack

To update your deployment:

1. Navigate to the stack in Portainer
2. Click the **Editor** tab
3. Make any necessary changes to the stack configuration
4. Click **Update the stack**

## Advanced Configuration

The stack supports a wide range of configuration options through environment variables:

- **DreamBot Settings**: All DreamBot settings can be customized through environment variables
- **EternalFarm Keys**: Individual keys can be set for each EternalFarm service
- **Resource Limits**: Memory and CPU limits can be adjusted in the stack file

For a complete list of available environment variables, refer to the `portainer-farmmanager-stack.yml` file. 