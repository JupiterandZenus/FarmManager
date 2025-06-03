// Enhanced Task Handler with DreamBot Launching
const { launchDreamBot, stopDreamBot } = require('./dreambot-launcher');

// Enhanced task start logic with actual bot launching
function createTaskStartHandler(prisma, broadcastToClients, sendDiscordNotification, DISCORD_WEBHOOK_URL) {
    return async function handleTaskStart(taskId, body, res) {
        try {
            const { agent_id, account_id } = JSON.parse(body);
            
            console.log(`🚀 Starting task ${taskId} with agent ${agent_id} and account ${account_id}`);
            
            // First get the task with all related data
            const taskData = await prisma.task.findUnique({
                where: { id: taskId },
                include: {
                    account: true,
                    agent: true,
                    bot: true
                }
            });
            
            if (!taskData) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: "Task not found" }));
                return;
            }
            
            // Get the account to use for this task
            let account = taskData.account;
            if (account_id && account_id !== taskData.account_id) {
                account = await prisma.account.findUnique({
                    where: { id: account_id }
                });
                
                if (!account) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: "Specified account not found" }));
                    return;
                }
            }
            
            if (!account) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: "No account available for this task" }));
                return;
            }
            
            console.log(`🎮 Launching DreamBot for account: ${account.username}`);
            
            // Launch DreamBot with the account details
            let botProcess = null;
            let processId = null;
            
            try {
                botProcess = await launchDreamBot(account, taskData);
                processId = botProcess.pid;
                console.log(`✅ DreamBot launched successfully with PID: ${processId}`);
            } catch (launchError) {
                console.error(`❌ Failed to launch DreamBot: ${launchError.message}`);
                
                // Still update the task as running but without process ID
                const task = await prisma.task.update({
                    where: { id: taskId },
                    data: {
                        status: 'error',
                        agent_id: agent_id,
                        account_id: account_id || taskData.account_id,
                        started_at: new Date(),
                        error_message: `Failed to launch DreamBot: ${launchError.message}`
                    },
                    include: {
                        account: true,
                        agent: true,
                        bot: true
                    }
                });
                
                res.writeHead(400);
                res.end(JSON.stringify({ 
                    error: `Failed to launch DreamBot: ${launchError.message}`,
                    data: task 
                }));
                return;
            }
            
            // Update task status with process information
            const task = await prisma.task.update({
                where: { id: taskId },
                data: {
                    status: 'running',
                    agent_id: agent_id,
                    account_id: account_id || taskData.account_id,
                    started_at: new Date(),
                    process_id: processId,
                    error_message: null // Clear any previous errors
                },
                include: {
                    account: true,
                    agent: true,
                    bot: true
                }
            });
            
            // Broadcast task start to all connected clients
            broadcastToClients('task_started', {
                task: task,
                message: `Task ${task.id} started on agent ${task.agent?.name || agent_id} with account ${account.username}`,
                botProcess: {
                    pid: processId,
                    launched: true,
                    account: account.username
                }
            });
            
            // Send Discord notification about successful bot launch
            if (DISCORD_WEBHOOK_URL) {
                sendDiscordNotification(
                    "🚀 Bot Task Started",
                    `DreamBot task launched successfully!\n\n` +
                    `🎯 **Task:** ${task.name || `Task ${task.id}`}\n` +
                    `👤 **Account:** ${account.username}\n` +
                    `🤖 **Agent:** ${task.agent?.name || 'Unknown'}\n` +
                    `🔧 **Process ID:** ${processId}\n` +
                    `🌍 **World:** ${process.env.DREAMBOT_WORLD || '301'}\n` +
                    `⏰ **Started:** ${new Date().toLocaleString()}`,
                    0x00ff00 // Green color
                );
            }
            
            res.writeHead(200);
            res.end(JSON.stringify({ 
                message: "Task started and DreamBot launched successfully",
                data: task,
                botProcess: {
                    pid: processId,
                    launched: true,
                    account: account.username,
                    world: process.env.DREAMBOT_WORLD || '301'
                }
            }));
            
        } catch (error) {
            console.error('Error starting task:', error);
            res.writeHead(400);
            res.end(JSON.stringify({ error: error.message }));
        }
    };
}

// Enhanced task stop logic with process termination
function createTaskStopHandler(prisma, broadcastToClients, sendDiscordNotification, DISCORD_WEBHOOK_URL) {
    return async function handleTaskStop(taskId, body, res) {
        try {
            const { agent_id, account_id } = JSON.parse(body);
            
            console.log(`🛑 Stopping task ${taskId}`);
            
            // Get current task with process info
            const currentTask = await prisma.task.findUnique({
                where: { id: taskId },
                include: {
                    account: true,
                    agent: true,
                    bot: true
                }
            });
            
            if (!currentTask) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: "Task not found" }));
                return;
            }
            
            // Stop DreamBot process if it exists
            if (currentTask.process_id) {
                try {
                    await stopDreamBot(currentTask.process_id);
                    console.log(`✅ DreamBot process ${currentTask.process_id} terminated`);
                } catch (stopError) {
                    console.error(`⚠️ Failed to stop DreamBot process: ${stopError.message}`);
                }
            }
            
            // Update task status
            const task = await prisma.task.update({
                where: { id: taskId },
                data: {
                    status: 'stopped',
                    completed_at: new Date(),
                    process_id: null // Clear process ID
                },
                include: {
                    account: true,
                    agent: true,
                    bot: true
                }
            });
            
            // Broadcast task stop to all connected clients
            broadcastToClients('task_stopped', {
                task: task,
                message: `Task ${task.id} stopped and DreamBot terminated`,
                processTerminated: true
            });
            
            // Send Discord notification
            if (DISCORD_WEBHOOK_URL) {
                sendDiscordNotification(
                    "🛑 Bot Task Stopped",
                    `DreamBot task stopped successfully!\n\n` +
                    `🎯 **Task:** ${task.name || `Task ${task.id}`}\n` +
                    `👤 **Account:** ${currentTask.account?.username || 'Unknown'}\n` +
                    `🤖 **Agent:** ${task.agent?.name || 'Unknown'}\n` +
                    `⏰ **Stopped:** ${new Date().toLocaleString()}`,
                    0xff6600 // Orange color
                );
            }
            
            res.writeHead(200);
            res.end(JSON.stringify({ 
                message: "Task stopped and DreamBot terminated successfully",
                data: task,
                processTerminated: currentTask.process_id ? true : false
            }));
            
        } catch (error) {
            console.error('Error stopping task:', error);
            res.writeHead(400);
            res.end(JSON.stringify({ error: error.message }));
        }
    };
}

module.exports = {
    createTaskStartHandler,
    createTaskStopHandler
}; 