const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to launch DreamBot with account details
async function launchDreamBot(account, task, env = {}) {
    return new Promise((resolve, reject) => {
        try {
            console.log(`🚀 Launching DreamBot for account: ${account.username}`);
            
            // DreamBot installation path
            const dreambotDir = '/root/DreamBot';
            const launcherPath = `${dreambotDir}/DBLauncher.jar`;
            
            // Check if DreamBot launcher exists
            if (!fs.existsSync(launcherPath)) {
                // Try alternative paths
                const altPaths = [
                    '/root/DreamBot/client.jar',
                    '/root/DreamBot/DreamBot.jar',
                    '/root/dreambot.jar'
                ];
                
                let foundPath = null;
                for (const altPath of altPaths) {
                    if (fs.existsSync(altPath)) {
                        foundPath = altPath;
                        break;
                    }
                }
                
                if (!foundPath) {
                    throw new Error(`DreamBot launcher not found at ${launcherPath} or alternative paths`);
                }
                
                console.log(`✅ Found DreamBot at alternative path: ${foundPath}`);
            }
            
            // Prepare DreamBot arguments
            const args = [
                '-Xmx1024m', // Set max memory
                '-Djava.awt.headless=false',
                '-jar', fs.existsSync(launcherPath) ? launcherPath : foundPath,
                '--username', account.username,
                '--password', account.password,
                '--world', process.env.DREAMBOT_WORLD || '301'
            ];
            
            // Add script if specified
            if (task && task.bot && task.bot.script_name) {
                args.push('--script', task.bot.script_name);
            } else if (process.env.DREAMBOT_SCRIPT) {
                args.push('--script', process.env.DREAMBOT_SCRIPT);
            }
            
            // Add additional arguments
            args.push('--no-splash');
            args.push('--developer-mode');
            
            // Set environment variables
            const processEnv = {
                ...process.env,
                ...env,
                DISPLAY: ':1',
                XAUTHORITY: '/root/.Xauthority',
                JAVA_HOME: '/usr/lib/jvm/temurin-8-jdk-amd64',
                HOME: '/root'
            };
            
            const command = `java ${args.join(' ')}`;
            console.log(`🔧 DreamBot command: ${command}`);
            
            // Launch DreamBot process
            const botProcess = exec(command, {
                cwd: dreambotDir,
                env: processEnv,
                detached: true,
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            // Handle process output
            botProcess.stdout.on('data', (data) => {
                console.log(`🤖 DreamBot stdout: ${data.toString()}`);
            });
            
            botProcess.stderr.on('data', (data) => {
                console.log(`⚠️ DreamBot stderr: ${data.toString()}`);
            });
            
            botProcess.on('error', (error) => {
                console.error(`❌ DreamBot process error: ${error.message}`);
                reject(error);
            });
            
            botProcess.on('exit', (code, signal) => {
                console.log(`🔄 DreamBot process exited with code: ${code}, signal: ${signal}`);
            });
            
            // Store process reference
            botProcess.unref(); // Allow parent process to exit independently
            
            if (botProcess.pid) {
                console.log(`✅ DreamBot launched with PID: ${botProcess.pid}`);
                console.log(`🎮 Account: ${account.username} | Task: ${task ? task.id : 'N/A'}`);
                
                resolve(botProcess);
            } else {
                reject(new Error('Failed to start DreamBot process'));
            }
            
        } catch (error) {
            console.error('❌ Error launching DreamBot:', error);
            reject(error);
        }
    });
}

// Function to stop DreamBot process
async function stopDreamBot(pid) {
    return new Promise((resolve, reject) => {
        try {
            console.log(`🛑 Stopping DreamBot process with PID: ${pid}`);
            process.kill(pid, 'SIGTERM');
            resolve({ success: true, message: `Process ${pid} terminated` });
        } catch (error) {
            console.error(`❌ Error stopping DreamBot process ${pid}:`, error);
            reject(error);
        }
    });
}

// Function to check if DreamBot is installed
function checkDreamBotInstallation() {
    const possiblePaths = [
        '/root/DreamBot/DBLauncher.jar',
        '/root/DreamBot/client.jar',
        '/root/DreamBot/DreamBot.jar',
        '/root/dreambot.jar'
    ];
    
    for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
            console.log(`✅ DreamBot found at: ${path}`);
            return { installed: true, path: path };
        }
    }
    
    console.log(`❌ DreamBot not found in any of the expected locations`);
    return { installed: false, path: null };
}

module.exports = {
    launchDreamBot,
    stopDreamBot,
    checkDreamBotInstallation
}; 