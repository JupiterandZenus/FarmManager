#!/usr/bin/env node

/**
 * Quick Bot Launching Enabler
 * 
 * This script patches your existing server.js to add DreamBot launching functionality
 * Run this once to enable bot launching when tasks are started.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Farm Manager Bot Launching Enabler');
console.log('=====================================');

// Check if required files exist
const requiredFiles = [
    'server.js',
    'dreambot-launcher.js', 
    'enhanced-task-handler.js'
];

console.log('📋 Checking required files...');
for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
        console.error(`❌ Missing required file: ${file}`);
        process.exit(1);
    }
    console.log(`✅ Found: ${file}`);
}

// Backup original server.js
console.log('\n💾 Creating backup of server.js...');
const backupPath = `server.js.backup.${Date.now()}`;
fs.copyFileSync('server.js', backupPath);
console.log(`✅ Backup created: ${backupPath}`);

// Read current server.js
console.log('\n📖 Reading current server.js...');
let serverContent = fs.readFileSync('server.js', 'utf8');

// Check if already patched
if (serverContent.includes('enhanced-task-handler')) {
    console.log('✅ Bot launching already enabled in server.js');
    process.exit(0);
}

// Add the import for enhanced task handler
console.log('\n🔧 Adding enhanced task handler import...');
const importLine = "const { createTaskStartHandler, createTaskStopHandler } = require('./enhanced-task-handler');";

// Find the place to add the import (after existing requires)
const requiresRegex = /const os = require\('os'\);/;
const match = serverContent.match(requiresRegex);

if (match) {
    const insertPosition = match.index + match[0].length;
    serverContent = serverContent.slice(0, insertPosition) + 
                   '\n\n// Enhanced task handlers with bot launching\n' + 
                   importLine + 
                   serverContent.slice(insertPosition);
    console.log('✅ Import added successfully');
} else {
    console.error('❌ Could not find suitable location to add import');
    process.exit(1);
}

// Add handler creation after prisma initialization
console.log('🔧 Adding task handler initialization...');
const prismaRegex = /const prisma = new PrismaClient\(\);/;
const prismaMatch = serverContent.match(prismaRegex);

if (prismaMatch) {
    const insertPosition = prismaMatch.index + prismaMatch[0].length;
    const handlerInit = `

// Initialize enhanced task handlers
const handleTaskStart = createTaskStartHandler(prisma, broadcastToClients, sendDiscordNotification, DISCORD_WEBHOOK_URL);
const handleTaskStop = createTaskStopHandler(prisma, broadcastToClients, sendDiscordNotification, DISCORD_WEBHOOK_URL);`;
    
    serverContent = serverContent.slice(0, insertPosition) + 
                   handlerInit + 
                   serverContent.slice(insertPosition);
    console.log('✅ Handler initialization added');
} else {
    console.error('❌ Could not find Prisma initialization');
    process.exit(1);
}

// Replace the task start logic
console.log('🔧 Replacing task start logic...');
const taskStartRegex = /const taskStartMatch = pathname\.match\(\/\^\\\/api\\\/v1\\\/tasks\\\/\(\\d\+\)\\\/start\$\/\);[\s\S]*?return;\s*}/;
const taskStartMatch = serverContent.match(taskStartRegex);

if (taskStartMatch) {
    const newTaskStartLogic = `const taskStartMatch = pathname.match(/^\\/api\\/v1\\/tasks\\/(\\d+)\\/start$/);
            if (taskStartMatch && req.method === 'POST') {
                const taskId = parseInt(taskStartMatch[1]);
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', () => handleTaskStart(taskId, body, res));
                return;
            }`;
    
    serverContent = serverContent.replace(taskStartMatch[0], newTaskStartLogic);
    console.log('✅ Task start logic replaced');
} else {
    console.error('❌ Could not find task start logic to replace');
    process.exit(1);
}

// Replace the task stop logic
console.log('🔧 Replacing task stop logic...');
const taskStopRegex = /const taskStopMatch = pathname\.match\(\/\^\\\/api\\\/v1\\\/tasks\\\/\(\\d\+\)\\\/stop\$\/\);[\s\S]*?return;\s*}/;
const taskStopMatch = serverContent.match(taskStopRegex);

if (taskStopMatch) {
    const newTaskStopLogic = `const taskStopMatch = pathname.match(/^\\/api\\/v1\\/tasks\\/(\\d+)\\/stop$/);
            if (taskStopMatch && req.method === 'POST') {
                const taskId = parseInt(taskStopMatch[1]);
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', () => handleTaskStop(taskId, body, res));
                return;
            }`;
    
    serverContent = serverContent.replace(taskStopMatch[0], newTaskStopLogic);
    console.log('✅ Task stop logic replaced');
} else {
    console.error('❌ Could not find task stop logic to replace');
    process.exit(1);
}

// Write the updated server.js
console.log('\n💾 Writing updated server.js...');
fs.writeFileSync('server.js', serverContent);
console.log('✅ server.js updated successfully');

// Add process_id to Prisma schema if needed
console.log('\n🗄️ Checking Prisma schema for process_id field...');
const schemaPath = 'prisma/schema.prisma';
if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    if (!schemaContent.includes('process_id')) {
        console.log('⚠️ Adding process_id field to Task model in Prisma schema...');
        
        // Find the Task model and add process_id field
        const taskModelRegex = /(model Task \{[\s\S]*?)(@@map\("tasks"\))/;
        const taskMatch = schemaContent.match(taskModelRegex);
        
        if (taskMatch) {
            const updatedTaskModel = taskMatch[1] + 
                '  process_id      Int?      // DreamBot process ID\n  ' + 
                taskMatch[2];
            
            const updatedSchema = schemaContent.replace(taskModelRegex, updatedTaskModel);
            fs.writeFileSync(schemaPath, updatedSchema);
            console.log('✅ Added process_id field to Task model');
            console.log('⚠️ Remember to run: npx prisma db push');
        } else {
            console.log('⚠️ Could not automatically update Prisma schema');
            console.log('📝 Please manually add this field to your Task model:');
            console.log('   process_id      Int?      // DreamBot process ID');
        }
    } else {
        console.log('✅ process_id field already exists in schema');
    }
} else {
    console.log('⚠️ Prisma schema not found, skipping schema update');
}

console.log('\n🎉 Bot Launching Successfully Enabled!');
console.log('=====================================');
console.log('');
console.log('✅ What was added:');
console.log('   • DreamBot launcher module');
console.log('   • Enhanced task handlers');
console.log('   • Actual bot launching when tasks start');
console.log('   • Process tracking and termination');
console.log('   • Discord notifications for bot events');
console.log('');
console.log('🚀 Next Steps:');
console.log('   1. Update your database schema: npx prisma db push');
console.log('   2. Restart your Farm Manager: docker-compose restart');
console.log('   3. Test bot launching from the web interface');
console.log('   4. Check VNC (port 8080) to see DreamBot GUI');
console.log('');
console.log('📋 Features Now Available:');
console.log('   • Start tasks = Launch actual DreamBot instances');
console.log('   • Stop tasks = Terminate DreamBot processes');
console.log('   • Process ID tracking in database');
console.log('   • Real-time Discord notifications');
console.log('   • Error handling for failed launches');
console.log('');
console.log('🔍 Troubleshooting:');
console.log('   • Check logs for DreamBot launch errors');
console.log('   • Ensure DreamBot is installed at /root/DreamBot/');
console.log('   • Verify Java is available in the container');
console.log('   • Check VNC connection to see bot GUI');

process.exit(0); 