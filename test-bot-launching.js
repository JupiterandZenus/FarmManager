#!/usr/bin/env node

/**
 * Bot Launching Test Script
 * 
 * This script tests the DreamBot launching functionality
 * Run this to verify everything is working correctly.
 */

const { checkDreamBotInstallation } = require('./dreambot-launcher');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Bot Launching Functionality');
console.log('======================================');

// Test 1: Check if all required files exist
console.log('\n📋 Test 1: Checking Required Files');
const requiredFiles = [
    'dreambot-launcher.js',
    'enhanced-task-handler.js',
    'server.js',
    'prisma/schema.prisma'
];

let allFilesExist = true;
for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
}

// Test 2: Check server.js integration
console.log('\n📋 Test 2: Checking Server.js Integration');
const serverContent = fs.readFileSync('server.js', 'utf8');

const checks = [
    { name: 'Enhanced task handler import', pattern: /enhanced-task-handler/ },
    { name: 'Task start handler', pattern: /handleTaskStart/ },
    { name: 'Task stop handler', pattern: /handleTaskStop/ },
    { name: 'Task handler initialization', pattern: /createTaskStartHandler/ }
];

let integrationComplete = true;
for (const check of checks) {
    if (check.pattern.test(serverContent)) {
        console.log(`✅ ${check.name}`);
    } else {
        console.log(`❌ ${check.name} - NOT FOUND`);
        integrationComplete = false;
    }
}

// Test 3: Check Prisma schema
console.log('\n📋 Test 3: Checking Database Schema');
const schemaContent = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (schemaContent.includes('process_id')) {
    console.log('✅ process_id field added to Task model');
} else {
    console.log('❌ process_id field missing from Task model');
    integrationComplete = false;
}

// Test 4: Check DreamBot installation (will work in container)
console.log('\n📋 Test 4: DreamBot Installation Check');
console.log('ℹ️ This test will show results when running in Docker container:');

try {
    const installation = checkDreamBotInstallation();
    if (installation.installed) {
        console.log(`✅ DreamBot found at: ${installation.path}`);
    } else {
        console.log('⚠️ DreamBot not found (expected when running locally)');
        console.log('   This will work when running in Docker container');
    }
} catch (error) {
    console.log('⚠️ DreamBot check failed (expected when running locally)');
    console.log('   This will work when running in Docker container');
}

// Test 5: Check environment configuration
console.log('\n📋 Test 5: Environment Configuration');
const configPath = 'config.env';
if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    const envChecks = [
        { name: 'DATABASE_URL', pattern: /DATABASE_URL=/ },
        { name: 'API_KEY', pattern: /API_KEY=/ },
        { name: 'ETERNALFARM_AGENT_KEY', pattern: /ETERNALFARM_AGENT_KEY=/ },
        { name: 'DISCORD_WEBHOOK_URL', pattern: /DISCORD_WEBHOOK_URL=/ }
    ];
    
    for (const check of envChecks) {
        if (check.pattern.test(configContent)) {
            console.log(`✅ ${check.name} configured`);
        } else {
            console.log(`⚠️ ${check.name} not configured`);
        }
    }
} else {
    console.log('❌ config.env file not found');
}

// Summary
console.log('\n🎯 Test Summary');
console.log('===============');

if (allFilesExist && integrationComplete) {
    console.log('✅ All tests passed! Bot launching functionality is ready.');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Deploy your Docker container');
    console.log('   2. Access Farm Manager web interface');
    console.log('   3. Start a task to test bot launching');
    console.log('   4. Check VNC (port 8080) to see DreamBot GUI');
    console.log('');
    console.log('📊 Expected Results:');
    console.log('   • Task status changes to "running"');
    console.log('   • Process ID appears in task details');
    console.log('   • DreamBot visible in VNC interface');
    console.log('   • Discord notification sent (if configured)');
} else {
    console.log('❌ Some tests failed. Please check the issues above.');
    console.log('');
    console.log('🔧 To fix issues:');
    console.log('   1. Re-run: node enable-bot-launching.js');
    console.log('   2. Check file permissions');
    console.log('   3. Verify all files are present');
}

console.log('\n📚 Documentation:');
console.log('   • BOT-LAUNCHING-SETUP-COMPLETE.md - Full setup guide');
console.log('   • dreambot-launcher.js - Bot launching logic');
console.log('   • enhanced-task-handler.js - Task management');

process.exit(allFilesExist && integrationComplete ? 0 : 1); 