#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate DreamBot settings.json from environment variables
 * This ensures settings are dynamically configured based on the container environment
 */
function generateDreamBotSettings() {
    console.log('🎯 Generating DreamBot settings.json from environment variables...');
    
    // Get environment variables with defaults
    const settings = {
        // Basic configuration
        "breaks": [],
        "cpuSaver": process.env.DREAMBOT_CPU_SAVER === 'true' || true,
        "disableCPUSaverWhenNotRunning": process.env.DREAMBOT_DISABLE_CPU_SAVER_WHEN_NOT_RUNNING === 'true' || false,
        "enableCPUSaverWhenMinimized": process.env.DREAMBOT_ENABLE_CPU_SAVER_WHEN_MINIMIZED === 'true' || false,
        "ignoreVisualInjections": process.env.DREAMBOT_IGNORE_VISUAL_INJECTIONS === 'true' || false,
        "isAlwaysOnTop": process.env.DREAMBOT_ALWAYS_ON_TOP === 'true' || false,
        "clientRendering": process.env.DREAMBOT_CLIENT_RENDERING === 'true' || false,
        "drawScriptPaint": process.env.DREAMBOT_DRAW_SCRIPT_PAINT === 'true' || true,
        
        // World configuration
        "useRandomWorld": process.env.DREAMBOT_USE_RANDOM_WORLD === 'true' || true,
        "useCustomWorld": process.env.DREAMBOT_USE_CUSTOM_WORLD === 'true' || false,
        "customWorld": parseInt(process.env.DREAMBOT_WORLD) || -8,
        
        // Security and development
        "hasSeenAccountWarning": process.env.DREAMBOT_HAS_SEEN_ACCOUNT_WARNING === 'true' || false,
        "disableSecurityManager": process.env.DREAMBOT_DISABLE_SECURITY_MANAGER === 'true' || false,
        "developerMode": process.env.DREAMBOT_DEVELOPER_MODE === 'true' || false,
        "freshStart": process.env.DREAMBOT_FRESH_START === 'true' || false,
        
        // Performance settings
        "fps": parseInt(process.env.DREAMBOT_FPS) || 20,
        "renderDistance": parseInt(process.env.DREAMBOT_RENDER_DISTANCE) || 25,
        "lowMemory": process.env.DREAMBOT_LOW_MEMORY === 'true' || false,
        "lowDetail": process.env.DREAMBOT_LOW_DETAIL === 'true' || false,
        
        // Integration settings
        "sdnIntegration": process.env.DREAMBOT_SDN_INTEGRATION === 'true' || true,
        "covertMode": process.env.DREAMBOT_COVERT_MODE === 'true' || true,
        "autoAddAccounts": process.env.DREAMBOT_AUTO_ADD_ACCOUNTS === 'true' || true,
        
        // Mouse and interaction
        "mouseSpeed": parseInt(process.env.DREAMBOT_MOUSE_SPEED) || 100,
        "movesMouseOffscreen": process.env.DREAMBOT_MOVES_MOUSE_OFFSCREEN === 'true' || true,
        
        // Script configuration
        "lastRanScript": process.env.DREAMBOT_LAST_RAN_SCRIPT || "Premium:1.312:P2P Master AI",
        "favoriteScripts": process.env.DREAMBOT_FAVORITE_SCRIPTS ? 
            process.env.DREAMBOT_FAVORITE_SCRIPTS.split(',') : [
                "P2P Master AI",
                "# NMZ", 
                "Dreamy AIO Skiller Elite Lifetime",
                "Guester - Lifetime"
            ],
        
        // Account settings
        "lastUsedUsername": process.env.DREAMBOT_LAST_USED_USERNAME || "",
        "lastScriptCategories": parseInt(process.env.DREAMBOT_LAST_SCRIPT_CATEGORIES) || 7,
        "deleteAccountOnBan": process.env.DREAMBOT_DELETE_ACCOUNT_ON_BAN === 'true' || false,
        "worldHopOnLoginError": process.env.DREAMBOT_WORLD_HOP_ON_LOGIN_ERROR === 'true' || false,
        
        // UI settings
        "lastCanvasSize": process.env.DREAMBOT_LAST_CANVAS_SIZE || "765:503",
        "gameLayout": process.env.DREAMBOT_GAME_LAYOUT || "Force resizable (modern)",
        
        // Solver settings
        "roofSolverActive": process.env.DREAMBOT_ROOF_SOLVER_ACTIVE === 'true' || true,
        "dismissSolversActive": process.env.DREAMBOT_DISMISS_SOLVERS_ACTIVE === 'true' || true,
        
        // Rendering settings
        "disableRegionRendering": process.env.DREAMBOT_DISABLE_REGION_RENDERING === 'true' || false,
        "disableTileRendering": process.env.DREAMBOT_DISABLE_TILE_RENDERING === 'true' || false,
        "disableTileUnderlayRendering": process.env.DREAMBOT_DISABLE_TILE_UNDERLAY_RENDERING === 'true' || false,
        "disableTileOverlayRendering": process.env.DREAMBOT_DISABLE_TILE_OVERLAY_RENDERING === 'true' || false,
        "stopWidgetUpdates": process.env.DREAMBOT_STOP_WIDGET_UPDATES === 'true' || false,
        "stopWidgetDraw": process.env.DREAMBOT_STOP_WIDGET_DRAW === 'true' || false,
        
        // Input settings
        "noClickWalk": process.env.DREAMBOT_NO_CLICK_WALK === 'true' || false,
        "noInputLogin": process.env.DREAMBOT_NO_INPUT_LOGIN === 'true' || false,
        "menuInjection": process.env.DREAMBOT_MENU_INJECTION === 'true' || false,
        
        // Visual settings
        "disableAnimation": process.env.DREAMBOT_DISABLE_ANIMATION === 'true' || false,
        "disableModelDrawing": process.env.DREAMBOT_DISABLE_MODEL_DRAWING === 'true' || false,
        "disableSounds": process.env.DREAMBOT_DISABLE_SOUNDS === 'true' || true,
        
        // Discord webhook integration
        "discordWebhook": process.env.DISCORD_WEBHOOK_URL || "",
        "notifyOnScriptStart": process.env.DREAMBOT_NOTIFY_ON_SCRIPT_START === 'true' || false,
        "notifyOnScriptStop": process.env.DREAMBOT_NOTIFY_ON_SCRIPT_STOP === 'true' || false,
        "notifyOnScriptPause": process.env.DREAMBOT_NOTIFY_ON_SCRIPT_PAUSE === 'true' || false,
        "notifyOnScheduleStart": process.env.DREAMBOT_NOTIFY_ON_SCHEDULE_START === 'true' || false,
        "notifyOnScheduleStop": process.env.DREAMBOT_NOTIFY_ON_SCHEDULE_STOP === 'true' || false,
        "notifyOnBreakStart": process.env.DREAMBOT_NOTIFY_ON_BREAK_START === 'true' || false,
        "notifyOnBreakStop": process.env.DREAMBOT_NOTIFY_ON_BREAK_STOP === 'true' || false,
        "notifyOnBan": process.env.DREAMBOT_NOTIFY_ON_BAN !== undefined ? process.env.DREAMBOT_NOTIFY_ON_BAN === 'true' : true,
        "notifyOnDeath": process.env.DREAMBOT_NOTIFY_ON_DEATH === 'true' || true,
        "notifyOnLevelUp": process.env.DREAMBOT_NOTIFY_ON_LEVEL_UP === 'true' || true,
        "notifyOnLevelUpAmount": parseInt(process.env.DREAMBOT_NOTIFY_ON_LEVEL_UP_AMOUNT) || 5,
        "notifyOnPet": process.env.DREAMBOT_NOTIFY_ON_PET === 'true' || true,
        "notifyOnValuableDrop": process.env.DREAMBOT_NOTIFY_ON_VALUABLE_DROP === 'true' || true,
        "notifyOnValuableDropAmount": parseInt(process.env.DREAMBOT_NOTIFY_ON_VALUABLE_DROP_AMOUNT) || 250000,
        "notifyOnUntradeableDrop": process.env.DREAMBOT_NOTIFY_ON_UNTRADEABLE_DROP === 'true' || true,
        "scriptWebhookAccessAllowed": process.env.DREAMBOT_SCRIPT_WEBHOOK_ACCESS_ALLOWED === 'true' || true,
        "mentionOnBan": process.env.DREAMBOT_MENTION_ON_BAN === 'true' || true,
        
        // Updates
        "stopsAfterUpdates": process.env.DREAMBOT_STOPS_AFTER_UPDATES === 'true' || true,
        
        // Version
        "settingsVersion": parseInt(process.env.DREAMBOT_SETTINGS_VERSION) || 3
    };
    
    return settings;
}

/**
 * Write settings to multiple locations
 */
function writeSettingsToLocations(settings) {
    const locations = [
        '/app/settings.json',
        '/root/DreamBot/BotData/settings.json',
        '/appdata/DreamBot/BotData/settings.json'
    ];
    
    const settingsJSON = JSON.stringify(settings, null, 2);
    
    locations.forEach(location => {
        try {
            // Ensure directory exists
            const dir = path.dirname(location);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`✅ Created directory: ${dir}`);
            }
            
            // Write settings file
            fs.writeFileSync(location, settingsJSON);
            console.log(`✅ Settings written to: ${location}`);
        } catch (error) {
            console.error(`❌ Failed to write settings to ${location}:`, error.message);
        }
    });
}

/**
 * Display current environment variable configuration
 */
function displayEnvironmentVariables() {
    console.log('\n📊 DreamBot Environment Variables:');
    console.log('==================================');
    
    const dreamBotVars = Object.keys(process.env)
        .filter(key => key.startsWith('DREAMBOT_') || key === 'DISCORD_WEBHOOK_URL')
        .sort();
    
    if (dreamBotVars.length === 0) {
        console.log('⚠️ No DreamBot environment variables set - using defaults');
        return;
    }
    
    dreamBotVars.forEach(varName => {
        const value = process.env[varName];
        // Hide sensitive values like Discord webhooks
        if (varName.includes('WEBHOOK') || varName.includes('TOKEN')) {
            console.log(`✅ ${varName}: ${value ? value.substring(0, 20) + '...' : 'Not set'}`);
        } else {
            console.log(`✅ ${varName}: ${value || 'Not set'}`);
        }
    });
}

// Main execution
if (require.main === module) {
    console.log('🎯 DreamBot Settings Generator');
    console.log('==============================\n');
    
    try {
        // Display current environment variables
        displayEnvironmentVariables();
        
        // Generate settings from environment variables
        const settings = generateDreamBotSettings();
        
        // Write to all required locations
        writeSettingsToLocations(settings);
        
        console.log('\n🎉 DreamBot settings.json generation completed successfully!');
        console.log('\n💡 To customize settings, set environment variables like:');
        console.log('   DREAMBOT_DEVELOPER_MODE=true');
        console.log('   DREAMBOT_FPS=30');
        console.log('   DREAMBOT_MOUSE_SPEED=150');
        console.log('   DISCORD_WEBHOOK_URL=your_webhook_url');
        
    } catch (error) {
        console.error('❌ Error generating DreamBot settings:', error);
        process.exit(1);
    }
}

module.exports = {
    generateDreamBotSettings,
    writeSettingsToLocations,
    displayEnvironmentVariables
}; 