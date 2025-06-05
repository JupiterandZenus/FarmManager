const fetch = require('node-fetch');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const execAsync = promisify(exec);
const isWindows = process.platform === 'win32';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Test launch sequence of Farm Manager system
 */
async function testLaunchSequence() {
  console.log(`${colors.cyan}===================================================${colors.reset}`);
  console.log(`${colors.cyan}🚀 FARM MANAGER LAUNCH SEQUENCE TEST${colors.reset}`);
  console.log(`${colors.cyan}===================================================${colors.reset}\n`);

  try {
    // Step 1: Check if Docker is running
    console.log(`${colors.blue}[1/7]${colors.reset} Checking if Docker is running...`);
    try {
      const dockerStatus = await execAsync('docker info');
      console.log(`${colors.green}✓ Docker is running${colors.reset}`);
    } catch (error) {
      console.log(`${colors.red}✗ Docker is not running or not installed${colors.reset}`);
      console.log(`${colors.red}Please start Docker and try again${colors.reset}`);
      return;
    }

    // Step 2: Check configuration files
    console.log(`\n${colors.blue}[2/7]${colors.reset} Checking configuration files...`);
    await validateConfigFiles();
    
    // Step 3: Bring down any existing containers
    console.log(`\n${colors.blue}[3/7]${colors.reset} Stopping any existing containers...`);
    try {
      await execAsync('docker-compose down');
      console.log(`${colors.green}✓ Successfully stopped existing containers${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}⚠ No containers were running or docker-compose down failed${colors.reset}`);
    }

    // Step 4: Start services
    console.log(`\n${colors.blue}[4/7]${colors.reset} Starting services...`);
    await execAsync('docker-compose up -d');
    console.log(`${colors.green}✓ Services started in detached mode${colors.reset}`);

    // Step 5: Wait for services to be ready
    console.log(`\n${colors.blue}[5/7]${colors.reset} Waiting for services to be ready...`);
    await new Promise(resolve => setTimeout(resolve, 20000)); // Wait 20 seconds

    // Step 6: Check if MariaDB is running
    console.log(`\n${colors.blue}[6/7]${colors.reset} Checking if MariaDB is running...`);
    const dbStatus = await checkMariaDB();

    // Step 7: Check if Farm Manager web interface is running
    console.log(`\n${colors.blue}[7/7]${colors.reset} Checking if Farm Manager web interface is running...`);
    const webStatus = await checkWebInterface();
    
    // Print test summary
    console.log(`\n${colors.cyan}===================================================${colors.reset}`);
    console.log(`${colors.cyan}📊 TEST SUMMARY${colors.reset}`);
    console.log(`${colors.cyan}===================================================${colors.reset}`);
    console.log(`Docker Status: ${colors.green}✓ RUNNING${colors.reset}`);
    console.log(`MariaDB Status: ${dbStatus.success ? colors.green + '✓ RUNNING' : colors.red + '✗ FAILED'} ${colors.reset}${dbStatus.message ? '(' + dbStatus.message + ')' : ''}`);
    console.log(`Web Interface: ${webStatus.success ? colors.green + '✓ RUNNING' : colors.red + '✗ FAILED'} ${colors.reset}${webStatus.message ? '(' + webStatus.message + ')' : ''}`);
    
    // Print additional container info
    console.log(`\n${colors.cyan}Container Status:${colors.reset}`);
    const containerStatus = await execAsync('docker ps');
    console.log(containerStatus.stdout);

    // Overall status
    const allPassed = dbStatus.success && webStatus.success;
    console.log(`\n${colors.cyan}===================================================${colors.reset}`);
    console.log(`${allPassed ? colors.green + '✓ ALL TESTS PASSED' : colors.red + '✗ SOME TESTS FAILED'} ${colors.reset}`);
    console.log(`${colors.cyan}===================================================${colors.reset}`);

    // List next steps
    if (allPassed) {
      console.log(`\n${colors.green}🎉 Farm Manager is running successfully!${colors.reset}`);
      console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
      console.log(`1. Access web interface at: ${colors.blue}http://localhost:3333${colors.reset}`);
      console.log(`2. Access VNC interface at: ${colors.blue}http://localhost:8080/vnc.html${colors.reset}`);
      console.log(`3. Connect to VNC directly at: ${colors.blue}localhost:5900${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}⚠ Some components failed to start. Check the logs for details.${colors.reset}`);
      console.log(`\n${colors.cyan}Troubleshooting:${colors.reset}`);
      console.log(`1. Check container logs: ${colors.blue}docker-compose logs${colors.reset}`);
      console.log(`2. Check database connection: ${colors.blue}docker exec -it farm-admin-mariadb-fresh mysql -u farmboy -pSntioi004! farmboy_db -e "SHOW TABLES;"${colors.reset}`);
      console.log(`3. Check if Entry.sh is running: ${colors.blue}docker exec -it farm-admin-hybrid ps aux${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}Error during launch sequence test:${colors.reset}`, error);
  }
}

/**
 * Validates configuration files
 */
async function validateConfigFiles() {
  try {
    // Check docker-compose.yml exists and contains farm-admin-hybrid
    try {
      const dockerComposeContent = await fs.readFile('docker-compose.yml', 'utf8');
      if (dockerComposeContent.includes('farm-admin-hybrid')) {
        console.log(`${colors.green}✓ docker-compose.yml looks valid${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ docker-compose.yml does not contain farm-admin-hybrid service${colors.reset}`);
        return { success: false, message: "Invalid docker-compose.yml" };
      }
    } catch (error) {
      console.log(`${colors.red}✗ Could not read docker-compose.yml: ${error.message}${colors.reset}`);
      return { success: false, message: "Missing docker-compose.yml" };
    }
    
    // Check Entry.sh exists
    try {
      const entryShStat = await fs.stat('Entry.sh');
      console.log(`${colors.green}✓ Entry.sh file exists${colors.reset}`);
      
      // On Windows, we can't really check or set executable permissions
      if (!isWindows) {
        // Check permissions on Entry.sh (Unix/Linux only)
        const mode = entryShStat.mode & parseInt('777', 8);
        if ((mode & parseInt('100', 8)) === 0) {
          await fs.chmod('Entry.sh', entryShStat.mode | parseInt('100', 8));
          console.log(`${colors.yellow}⚠ Fixed permissions on Entry.sh${colors.reset}`);
        } else {
          console.log(`${colors.green}✓ Entry.sh has correct permissions${colors.reset}`);
        }
      }
    } catch (error) {
      console.log(`${colors.red}✗ Entry.sh file not found: ${error.message}${colors.reset}`);
      return { success: false, message: "Missing Entry.sh" };
    }

    return { success: true };
  } catch (error) {
    console.log(`${colors.red}✗ Configuration validation failed:${colors.reset}`, error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Checks if MariaDB is running and accessible
 */
async function checkMariaDB() {
  try {
    // First check if the container exists
    try {
      const containerCheck = await execAsync('docker ps --format "{{.Names}}" | findstr farm-admin-mariadb-fresh');
      console.log(`${colors.green}✓ MariaDB container is running${colors.reset}`);
    } catch (error) {
      // Try again with filter on Unix systems
      try {
        const containerCheck = await execAsync('docker ps --format "{{.Names}}" | grep farm-admin-mariadb-fresh');
        console.log(`${colors.green}✓ MariaDB container is running${colors.reset}`);
      } catch (grepError) {
        // If both fail, try direct docker ps
        try {
          const allContainers = await execAsync('docker ps');
          if (allContainers.stdout.includes('farm-admin-mariadb-fresh')) {
            console.log(`${colors.green}✓ MariaDB container is running${colors.reset}`);
          } else {
            console.log(`${colors.red}✗ MariaDB container is not running${colors.reset}`);
            return { success: false, message: "Container not running" };
          }
        } catch (listError) {
          console.log(`${colors.red}✗ Error checking containers: ${listError.message}${colors.reset}`);
          return { success: false, message: "Error checking containers" };
        }
      }
    }

    // Now try to ping MariaDB
    try {
      const result = await execAsync(
        'docker exec farm-admin-mariadb-fresh mysqladmin ping -h 127.0.0.1 -u root -pSntioi004!'
      );
      
      if (result.stdout.includes('mysqld is alive')) {
        console.log(`${colors.green}✓ MariaDB is responding to ping${colors.reset}`);
        
        // Check if we can connect using the farmboy user
        try {
          const tableCheck = await execAsync(
            'docker exec farm-admin-mariadb-fresh mysql -u farmboy -pSntioi004! farmboy_db -e "SHOW TABLES;"'
          );
          console.log(`${colors.green}✓ Successfully connected to database with farmboy user${colors.reset}`);
          console.log(`${colors.green}✓ Tables in database:${colors.reset}`);
          console.log(tableCheck.stdout);
          
          return { success: true };
        } catch (error) {
          console.log(`${colors.red}✗ Could not connect with farmboy user:${colors.reset}`, error.message);
          return { success: false, message: "Database running but farmboy user connection failed" };
        }
      } else {
        console.log(`${colors.red}✗ MariaDB is not responding${colors.reset}`);
        return { success: false, message: "Not responding to ping" };
      }
    } catch (error) {
      console.log(`${colors.red}✗ MariaDB check failed:${colors.reset}`, error.message);
      return { success: false, message: "Failed to ping database" };
    }
  } catch (error) {
    console.log(`${colors.red}✗ MariaDB check failed:${colors.reset}`, error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Checks if the web interface is running
 */
async function checkWebInterface() {
  try {
    // First check if the container is running
    let containerRunning = false;
    
    try {
      const containerCheck = await execAsync('docker ps --format "{{.Names}}" | findstr farm-admin-hybrid');
      containerRunning = true;
    } catch (error) {
      // Try again with grep on Unix systems
      try {
        const containerCheck = await execAsync('docker ps --format "{{.Names}}" | grep farm-admin-hybrid');
        containerRunning = true;
      } catch (grepError) {
        // If both fail, try direct docker ps
        try {
          const allContainers = await execAsync('docker ps');
          containerRunning = allContainers.stdout.includes('farm-admin-hybrid');
        } catch (listError) {
          console.log(`${colors.red}✗ Error checking containers: ${listError.message}${colors.reset}`);
          return { success: false, message: "Error checking containers" };
        }
      }
    }
    
    if (containerRunning) {
      console.log(`${colors.green}✓ farm-admin-hybrid container is running${colors.reset}`);
      
      // Try to connect to the web interface
      try {
        const response = await fetch('http://localhost:3333/health', { timeout: 5000 });
        if (response.ok) {
          console.log(`${colors.green}✓ Web interface is responding on port 3333${colors.reset}`);
          return { success: true };
        } else {
          console.log(`${colors.red}✗ Web interface returned status ${response.status}${colors.reset}`);
          return { success: false, message: `HTTP ${response.status}` };
        }
      } catch (error) {
        // If fetch fails, check if the port is listening
        try {
          console.log(`${colors.yellow}⚠ Web interface not responding: ${error.message}${colors.reset}`);
          
          // Check container logs for more info
          const logs = await execAsync('docker logs --tail 20 farm-admin-hybrid');
          console.log(`${colors.yellow}⚠ Recent container logs:${colors.reset}`);
          console.log(logs.stdout);
          
          return { success: false, message: "Port not responding" };
        } catch (logError) {
          console.log(`${colors.red}✗ Could not check container logs: ${logError.message}${colors.reset}`);
          return { success: false, message: "Container running but web interface not accessible" };
        }
      }
    } else {
      console.log(`${colors.red}✗ farm-admin-hybrid container is not running${colors.reset}`);
      return { success: false, message: "Container not running" };
    }
  } catch (error) {
    console.log(`${colors.red}✗ Web interface check failed:${colors.reset}`, error.message);
    return { success: false, message: "Container check failed" };
  }
}

// Run the test
testLaunchSequence().catch(console.error); 