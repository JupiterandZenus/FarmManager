# EternalFarm Configuration Test Script (Windows PowerShell)
# Tests the configuration files for EternalFarm Agent setup

Write-Host "🧪 EternalFarm Configuration Test (Windows)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Test 1: Check if settings.json exists locally
Write-Host ""
Write-Host "1. Testing local settings.json file:" -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Yellow

if (Test-Path "settings.json") {
    Write-Host "✅ settings.json - EXISTS" -ForegroundColor Green
    $settingsContent = Get-Content "settings.json" | ConvertFrom-Json
    Write-Host "   Discord webhook configured: $($settingsContent.discordWebhook -ne $null)" -ForegroundColor Gray
    Write-Host "   Covert mode enabled: $($settingsContent.covertMode)" -ForegroundColor Gray
} else {
    Write-Host "❌ settings.json - MISSING" -ForegroundColor Red
}

# Test 2: Check docker-entrypoint.sh configuration
Write-Host ""
Write-Host "2. Testing docker-entrypoint.sh configuration:" -ForegroundColor Yellow
Write-Host "----------------------------------------------" -ForegroundColor Yellow

if (Test-Path "docker-entrypoint.sh") {
    Write-Host "✅ docker-entrypoint.sh - EXISTS" -ForegroundColor Green
    
    $entrypointContent = Get-Content "docker-entrypoint.sh" -Raw
    
    if ($entrypointContent -match "mkdir -p /appdata/EternalFarm") {
        Write-Host "✅ Creates EternalFarm directory" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing EternalFarm directory creation" -ForegroundColor Red
    }
    
    if ($entrypointContent -match "agent\.key") {
        Write-Host "✅ Configures agent.key file" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing agent.key configuration" -ForegroundColor Red
    }
    
    if ($entrypointContent -match "settings\.json") {
        Write-Host "✅ Copies settings.json files" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing settings.json copy" -ForegroundColor Red
    }
} else {
    Write-Host "❌ docker-entrypoint.sh - MISSING" -ForegroundColor Red
}

# Test 3: Check supervisord.conf configuration
Write-Host ""
Write-Host "3. Testing supervisord.conf configuration:" -ForegroundColor Yellow
Write-Host "------------------------------------------" -ForegroundColor Yellow

if (Test-Path "supervisord.conf") {
    Write-Host "✅ supervisord.conf - EXISTS" -ForegroundColor Green
    
    $supervisordContent = Get-Content "supervisord.conf" -Raw
    
    if ($supervisordContent -match "eternalfarm-agent") {
        Write-Host "✅ EternalFarm Agent service configured" -ForegroundColor Green
    } else {
        Write-Host "❌ EternalFarm Agent service missing" -ForegroundColor Red
    }
    
    if ($supervisordContent -match "key-file=/appdata/EternalFarm/agent\.key") {
        Write-Host "✅ Agent configured to use key file" -ForegroundColor Green
    } else {
        Write-Host "❌ Agent not configured for key file" -ForegroundColor Red
    }
    
    if ($supervisordContent -match "xfce4-terminal.*EternalFarm Agent") {
        Write-Host "✅ Agent configured for terminal display" -ForegroundColor Green
    } else {
        Write-Host "❌ Agent not configured for terminal display" -ForegroundColor Red
    }
    
    if ($supervisordContent -match "show-gui") {
        Write-Host "✅ GUI display enabled" -ForegroundColor Green
    } else {
        Write-Host "❌ GUI display not enabled" -ForegroundColor Red
    }
} else {
    Write-Host "❌ supervisord.conf - MISSING" -ForegroundColor Red
}

# Test 4: Check Dockerfile configuration
Write-Host ""
Write-Host "4. Testing Dockerfile configuration:" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow

if (Test-Path "Dockerfile") {
    Write-Host "✅ Dockerfile - EXISTS" -ForegroundColor Green
    
    $dockerfileContent = Get-Content "Dockerfile" -Raw
    
    if ($dockerfileContent -match "/appdata/EternalFarm") {
        Write-Host "✅ Creates appdata directories" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing appdata directory creation" -ForegroundColor Red
    }
    
    if ($dockerfileContent -match "settings\.json") {
        Write-Host "✅ Copies settings.json to container" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing settings.json copy" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Dockerfile - MISSING" -ForegroundColor Red
}

# Test 5: Check Portainer stack configuration
Write-Host ""
Write-Host "5. Testing Portainer stack configuration:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

if (Test-Path "portainer-farmmanager-stack.yml") {
    Write-Host "✅ portainer-farmmanager-stack.yml - EXISTS" -ForegroundColor Green
    
    $stackContent = Get-Content "portainer-farmmanager-stack.yml" -Raw
    
    if ($stackContent -match "AUTH_AGENT_KEY") {
        Write-Host "✅ AUTH_AGENT_KEY environment variable configured" -ForegroundColor Green
    } else {
        Write-Host "❌ AUTH_AGENT_KEY environment variable missing" -ForegroundColor Red
    }
    
    if ($stackContent -match "JAVA_HOME") {
        Write-Host "✅ JAVA_HOME configured" -ForegroundColor Green
    } else {
        Write-Host "❌ JAVA_HOME missing" -ForegroundColor Red
    }
    
    if ($stackContent -match "DISPLAY=:1") {
        Write-Host "✅ X11 display configured" -ForegroundColor Green
    } else {
        Write-Host "❌ X11 display not configured" -ForegroundColor Red
    }
} else {
    Write-Host "❌ portainer-farmmanager-stack.yml - MISSING" -ForegroundColor Red
}

# Test 6: Check environment file
Write-Host ""
Write-Host "6. Testing stack.env configuration:" -ForegroundColor Yellow
Write-Host "----------------------------------" -ForegroundColor Yellow

if (Test-Path "stack.env") {
    Write-Host "✅ stack.env - EXISTS" -ForegroundColor Green
    
    $envContent = Get-Content "stack.env" -Raw
    
    if ($envContent -match "AGENT_KEY=") {
        Write-Host "✅ AGENT_KEY defined in environment" -ForegroundColor Green
    } else {
        Write-Host "❌ AGENT_KEY not defined" -ForegroundColor Red
    }
    
    if ($envContent -match "CHECKER_KEY=") {
        Write-Host "✅ CHECKER_KEY defined in environment" -ForegroundColor Green
    } else {
        Write-Host "❌ CHECKER_KEY not defined" -ForegroundColor Red
    }
    
    if ($envContent -match "AUTOMATOR_KEY=") {
        Write-Host "✅ AUTOMATOR_KEY defined in environment" -ForegroundColor Green
    } else {
        Write-Host "❌ AUTOMATOR_KEY not defined" -ForegroundColor Red
    }
    
    if ($envContent -match "PORT=3333") {
        Write-Host "✅ Correct port configuration (3333)" -ForegroundColor Green
    } else {
        Write-Host "❌ Incorrect port configuration" -ForegroundColor Red
    }
} else {
    Write-Host "❌ stack.env - MISSING" -ForegroundColor Red
}

# Test 7: Check individual key file configuration
Write-Host ""
Write-Host "7. Testing individual key file setup:" -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Yellow

$entrypointContent = Get-Content "docker-entrypoint.sh" -Raw -ErrorAction SilentlyContinue

if ($entrypointContent -match "agent\.key") {
    Write-Host "✅ agent.key file creation configured" -ForegroundColor Green
} else {
    Write-Host "❌ agent.key file creation missing" -ForegroundColor Red
}

if ($entrypointContent -match "checker\.key") {
    Write-Host "✅ checker.key file creation configured" -ForegroundColor Green
} else {
    Write-Host "❌ checker.key file creation missing" -ForegroundColor Red
}

if ($entrypointContent -match "api\.key") {
    Write-Host "✅ api.key file creation configured" -ForegroundColor Green
} else {
    Write-Host "❌ api.key file creation missing" -ForegroundColor Red
}

# Test 8: Check supervisord individual key usage
Write-Host ""
Write-Host "8. Testing supervisord individual key usage:" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Yellow

$supervisordContent = Get-Content "supervisord.conf" -Raw -ErrorAction SilentlyContinue

if ($supervisordContent -match "key-file=/appdata/EternalFarm/agent\.key") {
    Write-Host "✅ Agent service uses agent.key" -ForegroundColor Green
} else {
    Write-Host "❌ Agent service not configured for agent.key" -ForegroundColor Red
}

if ($supervisordContent -match "key-file=/appdata/EternalFarm/checker\.key") {
    Write-Host "✅ Checker service uses checker.key" -ForegroundColor Green
} else {
    Write-Host "❌ Checker service not configured for checker.key" -ForegroundColor Red
}

if ($supervisordContent -match "key-file=/appdata/EternalFarm/api\.key") {
    Write-Host "✅ Automator service uses api.key" -ForegroundColor Green
} else {
    Write-Host "❌ Automator service not configured for api.key" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 CONFIGURATION TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔧 EXPECTED BEHAVIOR IN CONTAINER:" -ForegroundColor Yellow
Write-Host "- EternalFarm Agent will load key from /appdata/EternalFarm/agent.key"
Write-Host "- EternalFarm Checker will load key from /appdata/EternalFarm/checker.key"
Write-Host "- EternalFarm Automator will load key from /appdata/EternalFarm/api.key"
Write-Host "- Each service will launch in separate terminal windows"
Write-Host "- All GUIs will be visible via VNC on port 8080"
Write-Host "- DreamBot settings will be available in correct directories"
Write-Host "- Key files created as PRIORITY 1 before services launch"

Write-Host ""
Write-Host "🌐 DEPLOYMENT STEPS:" -ForegroundColor Yellow
Write-Host "1. Commit and push changes to Git"
Write-Host "2. Deploy updated stack in Portainer"
Write-Host "3. Access VNC interface: http://your-server:8080"
Write-Host "4. Look for terminal windows with EternalFarm services"

Write-Host ""
Write-Host "✅ Configuration test completed!" -ForegroundColor Green 