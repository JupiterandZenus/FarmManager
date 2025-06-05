#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing EternalFarm Individual Service Keys Setup');
console.log('==================================================');

// Check environment variables
console.log('\n📊 Environment Variables:');
console.log('AGENT_KEY:', process.env.AGENT_KEY ? '✅ Set' : '❌ Missing');
console.log('CHECKER_KEY:', process.env.CHECKER_KEY ? '✅ Set' : '❌ Missing');
console.log('AUTOMATOR_KEY:', process.env.AUTOMATOR_KEY ? '✅ Set' : '❌ Missing');
console.log('ETERNALFARM_KEYS_TYPE:', process.env.ETERNALFARM_KEYS_TYPE || '❌ Not set');
console.log('ETERNALFARM_SERVICES_ENABLED:', process.env.ETERNALFARM_SERVICES_ENABLED || '❌ Not set');

// Check key file directories
console.log('\n📁 Directory Structure:');
const keyDirs = [
    '/appdata/EternalFarm',
    '/root/.eternalfarm',
    '/app/data',
    '/root/DreamBot/BotData'
];

keyDirs.forEach(dir => {
    try {
        const exists = fs.existsSync(dir);
        console.log(`${dir}: ${exists ? '✅ Exists' : '❌ Missing'}`);
        if (exists) {
            const stats = fs.statSync(dir);
            console.log(`  - Permissions: ${stats.mode.toString(8)}`);
            console.log(`  - Contents: ${fs.readdirSync(dir).join(', ') || 'Empty'}`);
        }
    } catch (error) {
        console.log(`${dir}: ❌ Error - ${error.message}`);
    }
});

// Check key files
console.log('\n🔑 Key Files:');
const keyFiles = [
    '/appdata/EternalFarm/agent.key',
    '/appdata/EternalFarm/checker.key',
    '/appdata/EternalFarm/api.key'
];

keyFiles.forEach(file => {
    try {
        const exists = fs.existsSync(file);
        console.log(`${file}: ${exists ? '✅ Exists' : '❌ Missing'}`);
        if (exists) {
            const stats = fs.statSync(file);
            const content = fs.readFileSync(file, 'utf8').trim();
            console.log(`  - Size: ${stats.size} bytes`);
            console.log(`  - Permissions: ${stats.mode.toString(8)}`);
            console.log(`  - Content preview: ${content.substring(0, 20)}...`);
        }
    } catch (error) {
        console.log(`${file}: ❌ Error - ${error.message}`);
    }
});

// Check settings.json
console.log('\n📋 Settings Files:');
const settingsFiles = [
    '/app/settings.json',
    '/root/DreamBot/BotData/settings.json',
    '/appdata/DreamBot/BotData/settings.json'
];

settingsFiles.forEach(file => {
    try {
        const exists = fs.existsSync(file);
        console.log(`${file}: ${exists ? '✅ Exists' : '❌ Missing'}`);
        if (exists) {
            const stats = fs.statSync(file);
            console.log(`  - Size: ${stats.size} bytes`);
        }
    } catch (error) {
        console.log(`${file}: ❌ Error - ${error.message}`);
    }
});

// Create missing directories and files if needed
console.log('\n🔧 Auto-Fix Missing Components:');

// Create directories
keyDirs.forEach(dir => {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✅ Created directory: ${dir}`);
        }
    } catch (error) {
        console.log(`❌ Failed to create ${dir}: ${error.message}`);
    }
});

// Create key files if environment variables exist
const keyMappings = {
    'agent.key': process.env.AGENT_KEY,
    'checker.key': process.env.CHECKER_KEY,
    'api.key': process.env.AUTOMATOR_KEY
};

Object.entries(keyMappings).forEach(([filename, keyValue]) => {
    if (keyValue) {
        const filePath = `/appdata/EternalFarm/${filename}`;
        try {
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, keyValue, { mode: 0o600 });
                console.log(`✅ Created key file: ${filePath}`);
            }
        } catch (error) {
            console.log(`❌ Failed to create ${filePath}: ${error.message}`);
        }
    } else {
        console.log(`⚠️ Skipping ${filename} - environment variable not set`);
    }
});

// Copy settings.json if needed
const sourceSettings = '/app/settings.json';
const targetSettings = [
    '/root/DreamBot/BotData/settings.json',
    '/appdata/DreamBot/BotData/settings.json'
];

if (fs.existsSync(sourceSettings)) {
    targetSettings.forEach(target => {
        try {
            const targetDir = path.dirname(target);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            if (!fs.existsSync(target)) {
                fs.copyFileSync(sourceSettings, target);
                console.log(`✅ Copied settings.json to: ${target}`);
            }
        } catch (error) {
            console.log(`❌ Failed to copy settings.json to ${target}: ${error.message}`);
        }
    });
} else {
    console.log(`⚠️ Source settings.json not found at ${sourceSettings}`);
}

console.log('\n🎉 Key setup test completed!');
console.log('\nIf you see missing files, run this script inside your Docker container:');
console.log('docker exec -it farm-admin-local node /app/test-local-keys.js'); 