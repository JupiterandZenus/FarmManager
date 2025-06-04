# Farm Manager Environment Labels Guide

## Overview

This document explains all the Docker labels used across the Farm Manager deployment files. These labels provide metadata about the containers and help with management, monitoring, and automation.

## Label Categories

### 1. Core Application Labels

```yaml
# Basic application information
- "com.farmboy.type=hybrid"                    # Container type (hybrid = full stack)
- "com.farmboy.version=0.2"                    # Application version
- "com.farmboy.environment=production"         # Environment (production/staging/development)
- "com.farmboy.maintainer=SupScotty"          # Maintainer information
```

### 2. Service Labels

```yaml
# Available services in the container
- "com.farmboy.service.vnc=enabled"           # VNC server enabled
- "com.farmboy.service.novnc=enabled"         # noVNC web client enabled
- "com.farmboy.service.ssh=enabled"           # SSH access enabled
- "com.farmboy.service.web=enabled"           # Web interface enabled
```

### 3. Port Labels

```yaml
# Port mappings for services
- "com.farmboy.ports.vnc=5900"               # VNC server port
- "com.farmboy.ports.novnc=8080"             # noVNC web client port
- "com.farmboy.ports.web=3333"               # Farm Manager web interface port
- "com.farmboy.ports.ssh=2222"               # SSH access port
```

### 4. Integration Labels

```yaml
# External service integrations
- "com.farmboy.integration.dreambot=enabled"  # DreamBot OSRS client integration
- "com.farmboy.integration.eternalfarm=enabled" # EternalFarm tools integration
- "com.farmboy.integration.discord=enabled"   # Discord webhook notifications
```

### 5. Resource Labels

```yaml
# Resource allocation information
- "com.farmboy.resources.memory=2g"          # Memory allocation
- "com.farmboy.resources.cpus=2"             # CPU allocation
```

### 6. Database Labels (Farm-Admin Container)

```yaml
# Database connection information
- "com.farmboy.database.type=mariadb"        # Database type
- "com.farmboy.database.user=farmboy"        # Database user
- "com.farmboy.database.host=mariadb"        # Database hostname
- "com.farmboy.database.port=3306"           # Database port
- "com.farmboy.database.name=farmboy_db"     # Database name
- "com.farmboy.database.auth.fixed=true"     # Authentication issue resolved
- "com.farmboy.database.connection=mysql://farmboy:***@mariadb:3306/farmboy_db" # Connection string (password masked)
```

### 7. Database Labels (MariaDB Container)

```yaml
# MariaDB-specific configuration
- "com.farmboy.database.service=mariadb"     # Database service type
- "com.farmboy.database.type=mariadb"        # Database engine
- "com.farmboy.database.version=latest"      # Database version
- "com.farmboy.database.provider=linuxserver.io" # Image provider

# Configuration
- "com.farmboy.database.root_host=%"         # Root user access from any host
- "com.farmboy.database.default_user=farmboy" # Default application user
- "com.farmboy.database.default_db=farmboy_db" # Default database
- "com.farmboy.database.charset=utf8mb4"     # Character set
- "com.farmboy.database.collation=utf8mb4_unicode_ci" # Collation

# Security
- "com.farmboy.database.auth_method=mysql_native_password" # Authentication method
- "com.farmboy.database.secure_user=farmboy" # Secure user for applications

# Health monitoring
- "com.farmboy.database.healthcheck=enabled" # Health check enabled
- "com.farmboy.database.healthcheck.interval=30s" # Health check interval
```

### 8. EternalFarm Service Labels

```yaml
# EternalFarm tool configuration
- "com.farmboy.eternalfarm.agent.enabled=true"      # EternalFarm Agent enabled
- "com.farmboy.eternalfarm.checker.enabled=true"    # EternalFarm Checker enabled
- "com.farmboy.eternalfarm.automator.enabled=true"  # EternalFarm Browser Automator enabled
- "com.farmboy.eternalfarm.keys.type=individual"    # Key type (individual vs shared)
- "com.farmboy.eternalfarm.services=agent,checker,automator" # Enabled services
```

### 9. Auto-login Labels

```yaml
# Automatic login configuration
- "com.farmboy.autologin=enabled"            # Auto-login feature enabled
- "com.farmboy.autologin.version=1.0"        # Auto-login system version
- "com.farmboy.autologin.services=dreambot,agent,checker,automator" # Services with auto-login
```

### 10. Traefik Labels (Portainer Stack Only)

```yaml
# Reverse proxy configuration
- "traefik.enable=true"                       # Enable Traefik routing
- "traefik.http.routers.farm-admin.rule=Host(`farm-admin.local`)" # Routing rule
- "traefik.http.services.farm-admin.loadbalancer.server.port=3333" # Backend port
```

## Label Usage by File

### docker-compose.yml
- ✅ All core labels
- ✅ Database labels (both containers)
- ✅ EternalFarm labels
- ✅ Auto-login labels
- ❌ Traefik labels (not needed for local development)

### portainer-farmmanager-stack.yml
- ✅ All core labels
- ✅ Database labels (both containers)
- ✅ EternalFarm labels
- ✅ Auto-login labels
- ✅ Traefik labels (for reverse proxy)

### portainer-farmmanager-simple.yml
- ✅ All core labels
- ✅ Database labels (both containers)
- ✅ EternalFarm labels
- ✅ Auto-login labels
- ❌ Traefik labels (simplified deployment)

## Benefits of Using Labels

### 1. **Container Management**
- Easy identification of container purpose and configuration
- Automated container discovery and management
- Version tracking and rollback capabilities

### 2. **Monitoring & Alerting**
- Prometheus/Grafana can use labels for metrics collection
- Docker stats and monitoring tools can filter by labels
- Custom alerting rules based on service types

### 3. **Service Discovery**
- Traefik can automatically route traffic based on labels
- Load balancers can discover backend services
- Health check systems can identify checkable services

### 4. **Automation**
- CI/CD pipelines can use labels for deployment logic
- Backup systems can identify database containers
- Security scanning can prioritize based on environment labels

### 5. **Documentation**
- Self-documenting containers with metadata
- Configuration details embedded in the container
- Troubleshooting information readily available

## Label Querying Examples

### Docker Commands

```bash
# Find all farm-admin containers
docker ps --filter "label=com.farmboy.type=hybrid"

# Find database containers
docker ps --filter "label=com.farmboy.database.service=mariadb"

# Find production containers
docker ps --filter "label=com.farmboy.environment=production"

# Get all labels for a container
docker inspect <container_id> | jq '.[0].Config.Labels'
```

### Docker Compose Commands

```bash
# Filter services by label
docker-compose ps --filter "label=com.farmboy.integration.dreambot=enabled"

# View labels in compose
docker-compose config | grep -A 20 labels:
```

### Portainer Integration

Labels are automatically visible in Portainer UI:
- Container details page shows all labels
- Filtering containers by labels
- Stack templates can use label values
- Custom templates based on label patterns

## Best Practices

### 1. **Consistent Naming**
- Use reverse DNS notation: `com.farmboy.*`
- Use meaningful hierarchical structure
- Keep label names descriptive but concise

### 2. **Version Management**
- Include version labels for tracking
- Use semantic versioning where applicable
- Tag major configuration changes

### 3. **Environment Specific**
- Always include environment labels
- Use consistent environment names
- Separate staging and production clearly

### 4. **Documentation**
- Document all custom labels
- Include examples of label usage
- Maintain label schemas

### 5. **Security**
- Don't include sensitive data in labels
- Mask passwords in connection strings
- Use references to secrets instead of values

## Troubleshooting with Labels

### Database Issues
```bash
# Check database configuration
docker inspect farm-admin-mariadb-fresh | jq '.[0].Config.Labels' | grep database

# Verify database authentication settings
docker inspect farm-admin-hybrid | jq '.[0].Config.Labels' | grep database.auth
```

### Service Discovery
```bash
# Find all enabled services
docker ps --filter "label=com.farmboy.service*=enabled"

# Check integration status
docker ps --filter "label=com.farmboy.integration*=enabled"
```

### Auto-login Debugging
```bash
# Find containers with auto-login
docker ps --filter "label=com.farmboy.autologin=enabled"

# Check auto-login services
docker inspect <container> | jq '.[0].Config.Labels["com.farmboy.autologin.services"]'
```

This comprehensive labeling system provides better container management, monitoring capabilities, and deployment automation for the Farm Manager application. 