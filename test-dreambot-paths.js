#!/usr/bin/env node

/**
 * DreamBot Path Verification Test
 * Tests the correct paths for Java and DreamBot client based on user's screenshot
 */

const fs = require('fs');
const { exec } = require('child_process');

console.log('🧪 DreamBot Path Verification Test');
console.log('==================================');

// Test Java installation
function testJavaPath() {
    console.log('\n1. Testing Java Installation:');
    
    const javaHome = '/usr/lib/jvm/temurin-8-jdk-amd64';
    const javaBin = `${javaHome}/bin/java`;
    
    console.log(`   JAVA_HOME: ${javaHome}`);
    console.log(`   Java Binary: ${javaBin}`);
    
    // Check if Java home directory exists
    if (fs.existsSync(javaHome)) {
        console.log('   ✅ JAVA_HOME directory exists');
    } else {
        console.log('   ❌ JAVA_HOME directory not found');
        return false;
    }
    
    // Check if Java binary exists
    if (fs.existsSync(javaBin)) {
        console.log('   ✅ Java binary exists');
    } else {
        console.log('   ❌ Java binary not found');
        return false;
    }
    
    return true;
}

// Test DreamBot installation
function testDreamBotPaths() {
    console.log('\n2. Testing DreamBot Installation:');
    
    const primaryPath = '/root/DreamBot/BotData/client.jar'; // From user's screenshot
    const alternativePaths = [
        '/root/DreamBot/DBLauncher.jar',
        '/root/DreamBot/client.jar',
        '/root/DreamBot/DreamBot.jar',
        '/root/dreambot.jar'
    ];
    
    console.log(`   Primary Path: ${primaryPath}`);
    
    // Check primary path (from screenshot)
    if (fs.existsSync(primaryPath)) {
        console.log('   ✅ PRIMARY PATH FOUND - DreamBot client.jar exists');
        return { found: true, path: primaryPath };
    } else {
        console.log('   ⚠️ Primary path not found, checking alternatives...');
        
        // Check alternative paths
        for (const altPath of alternativePaths) {
            console.log(`   Checking: ${altPath}`);
            if (fs.existsSync(altPath)) {
                console.log(`   ✅ ALTERNATIVE FOUND: ${altPath}`);
                return { found: true, path: altPath };
            }
        }
        
        console.log('   ❌ No DreamBot installation found');
        return { found: false, path: null };
    }
}

// Test directory structure
function testDirectoryStructure() {
    console.log('\n3. Testing Directory Structure:');
    
    const directories = [
        '/root/DreamBot',
        '/root/DreamBot/BotData',
        '/usr/lib/jvm',
        '/usr/lib/jvm/temurin-8-jdk-amd64'
    ];
    
    directories.forEach(dir => {
        if (fs.existsSync(dir)) {
            console.log(`   ✅ ${dir} - exists`);
        } else {
            console.log(`   ❌ ${dir} - missing`);
        }
    });
}

// Test Java version (if available)
function testJavaVersion() {
    console.log('\n4. Testing Java Version:');
    
    return new Promise((resolve) => {
        exec('java -version', { env: { JAVA_HOME: '/usr/lib/jvm/temurin-8-jdk-amd64' } }, (error, stdout, stderr) => {
            if (error) {
                console.log('   ❌ Could not execute java -version');
                console.log(`   Error: ${error.message}`);
                resolve(false);
            } else {
                console.log('   ✅ Java version check successful:');
                console.log(`   ${stderr.split('\n')[0]}`); // Java version is usually in stderr
                resolve(true);
            }
        });
    });
}

// Main test function
async function runPathTests() {
    console.log('🚀 Starting DreamBot path verification...\n');
    
    const results = {
        java: false,
        dreambot: false,
        directories: true,
        javaVersion: false
    };
    
    // Test Java
    results.java = testJavaPath();
    
    // Test DreamBot
    const dreambotResult = testDreamBotPaths();
    results.dreambot = dreambotResult.found;
    
    // Test directories
    testDirectoryStructure();
    
    // Test Java version
    results.javaVersion = await testJavaVersion();
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(50));
    
    console.log(`Java Installation:     ${results.java ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`DreamBot Installation: ${results.dreambot ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Java Version Check:    ${results.javaVersion ? '✅ PASS' : '❌ FAIL'}`);
    
    const overallPass = results.java && results.dreambot;
    console.log(`\nOverall Status: ${overallPass ? '✅ READY FOR BOT LAUNCHING' : '❌ CONFIGURATION NEEDED'}`);
    
    if (!overallPass) {
        console.log('\n🔧 REQUIRED ACTIONS:');
        if (!results.java) {
            console.log('   - Install Java 8 (Temurin) at /usr/lib/jvm/temurin-8-jdk-amd64');
        }
        if (!results.dreambot) {
            console.log('   - Install DreamBot client at /root/DreamBot/BotData/client.jar');
            console.log('   - Or ensure DreamBot is installed in one of the alternative paths');
        }
    } else {
        console.log('\n🎉 All paths are correctly configured!');
        console.log('   Your Farm Manager should be able to launch DreamBot instances.');
    }
    
    return overallPass;
}

// Run the tests
if (require.main === module) {
    runPathTests()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { runPathTests }; 