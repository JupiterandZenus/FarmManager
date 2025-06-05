#!/bin/bash

echo "🔧 EternalFarm Individual Service Keys Fix Script"
echo "================================================="

# Check if running in container
if [ -f /.dockerenv ]; then
    echo "✅ Running inside Docker container"
else
    echo "⚠️ Not running inside Docker container - some paths may differ"
fi

# Function to create directory if it doesn't exist
ensure_directory() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo "✅ Created directory: $dir"
    else
        echo "✅ Directory exists: $dir"
    fi
    chmod 755 "$dir"
}

# Function to create key file
create_service_key() {
    local service="$1"
    local env_var="$2"
    local filename="$3"
    local key_value
    
    # Get the value from environment variable
    key_value="${!env_var}"
    
    echo ""
    echo "🔑 Processing $service Service Key..."
    echo "   Environment Variable: $env_var"
    echo "   Target File: /appdata/EternalFarm/$filename"
    
    if [ -n "$key_value" ]; then
        echo "   Key Value: ${key_value:0:20}... (showing first 20 chars)"
        
        # Create the key file
        echo "$key_value" > "/appdata/EternalFarm/$filename"
        chmod 600 "/appdata/EternalFarm/$filename"
        
        # Verify the file was created correctly
        if [ -f "/appdata/EternalFarm/$filename" ] && [ -s "/appdata/EternalFarm/$filename" ]; then
            local file_size=$(wc -c < "/appdata/EternalFarm/$filename")
            echo "   ✅ Key file created successfully ($file_size chars)"
        else
            echo "   ❌ Failed to create key file"
            return 1
        fi
    else
        echo "   ❌ Environment variable $env_var is not set or empty"
        echo "   💡 Make sure to set this in your Docker environment"
        return 1
    fi
}

# Main execution
echo ""
echo "🏗️ Setting up directories..."

# Ensure all required directories exist
ensure_directory "/appdata/EternalFarm"
ensure_directory "/root/.eternalfarm"
ensure_directory "/app/data"
ensure_directory "/root/DreamBot/BotData"
ensure_directory "/appdata/DreamBot/BotData"

echo ""
echo "🔐 Creating individual service key files..."

# Create individual service keys
create_service_key "Agent" "AGENT_KEY" "agent.key"
create_service_key "Checker" "CHECKER_KEY" "checker.key"
create_service_key "Automator" "AUTOMATOR_KEY" "api.key"

# Create legacy key for backward compatibility
echo ""
echo "🔄 Creating legacy key file..."
if [ -n "$ETERNALFARM_AGENT_KEY" ]; then
    echo "$ETERNALFARM_AGENT_KEY" > "/root/.eternalfarm/key"
    chmod 600 "/root/.eternalfarm/key"
    echo "✅ Legacy key file created: /root/.eternalfarm/key"
else
    echo "⚠️ ETERNALFARM_AGENT_KEY not set - legacy key not created"
fi

echo ""
echo "📋 Handling settings.json..."

# Handle settings.json
if [ -f "/app/settings.json" ]; then
    echo "✅ Source settings.json found"
    
    # Copy to DreamBot directories
    for target in "/root/DreamBot/BotData/settings.json" "/appdata/DreamBot/BotData/settings.json"; do
        target_dir=$(dirname "$target")
        ensure_directory "$target_dir"
        
        cp "/app/settings.json" "$target"
        if [ -f "$target" ]; then
            echo "✅ Copied settings.json to: $target"
        else
            echo "❌ Failed to copy settings.json to: $target"
        fi
    done
else
    echo "⚠️ /app/settings.json not found - this may cause DreamBot issues"
fi

echo ""
echo "🔍 Verification Report:"
echo "======================"

# Verify all key files
for service_file in "agent.key:Agent" "checker.key:Checker" "api.key:Automator"; do
    IFS=':' read -r filename servicename <<< "$service_file"
    filepath="/appdata/EternalFarm/$filename"
    
    if [ -f "$filepath" ] && [ -s "$filepath" ]; then
        size=$(wc -c < "$filepath")
        perms=$(stat -c "%a" "$filepath" 2>/dev/null || echo "unknown")
        echo "✅ $servicename Key: $filepath ($size chars, permissions: $perms)"
    else
        echo "❌ $servicename Key: Missing or empty"
    fi
done

# Verify settings files
for settings_file in "/app/settings.json" "/root/DreamBot/BotData/settings.json" "/appdata/DreamBot/BotData/settings.json"; do
    if [ -f "$settings_file" ] && [ -s "$settings_file" ]; then
        size=$(wc -c < "$settings_file")
        echo "✅ Settings: $settings_file ($size chars)"
    else
        echo "❌ Settings: $settings_file missing or empty"
    fi
done

# Verify legacy key
if [ -f "/root/.eternalfarm/key" ] && [ -s "/root/.eternalfarm/key" ]; then
    size=$(wc -c < "/root/.eternalfarm/key")
    echo "✅ Legacy Key: /root/.eternalfarm/key ($size chars)"
else
    echo "❌ Legacy Key: Missing or empty"
fi

echo ""
echo "📊 Environment Variables Check:"
echo "=============================="
for var in "AGENT_KEY" "CHECKER_KEY" "AUTOMATOR_KEY" "ETERNALFARM_AGENT_KEY" "ETERNALFARM_KEYS_TYPE" "ETERNALFARM_SERVICES_ENABLED"; do
    value="${!var}"
    if [ -n "$value" ]; then
        # Show first 20 characters for security
        echo "✅ $var: ${value:0:20}..."
    else
        echo "❌ $var: Not set"
    fi
done

echo ""
echo "🎉 EternalFarm keys fix script completed!"
echo ""
echo "💡 Usage Instructions:"
echo "  - Run this script inside your Docker container"
echo "  - If environment variables are missing, update your docker-compose.yml"
echo "  - If keys are still not working, check EternalFarm application logs"
echo ""
echo "🐳 Docker Commands:"
echo "  docker exec -it farm-admin-local /bin/bash"
echo "  chmod +x /app/fix-eternalfarm-keys.sh"
echo "  /app/fix-eternalfarm-keys.sh" 