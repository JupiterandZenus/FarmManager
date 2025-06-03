# 🌱 Farm Admin - EternalFarm Management Interface

A modern web-based management interface for EternalFarm with comprehensive support for accounts, proxies, bots, tasks, and more.

## ✨ Features

- **Account Management** - Create, edit, and monitor game accounts with tutorial tracking
- **Proxy Management** - Manage proxy configurations with health monitoring
- **Bot Management** - Control and configure bot instances
- **Task Management** - Create and manage automated tasks with agent assignment
- **Category Management** - Organize accounts and proxies with custom categories
- **Prime Link Requests** - Handle prime membership requests
- **Real-time Monitoring** - Live status updates and health checks
- **Modern UI** - Responsive design with dark theme

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/swarnes1/farm-admin.git
cd farm-admin

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Start the server
npm start
```

### Docker Deployment

#### Option 1: Docker Compose (Recommended)
```bash
# Clone and deploy
git clone https://github.com/swarnes1/farm-admin.git
cd farm-admin
docker-compose up -d
```

#### Option 2: Portainer Stack
1. Copy the contents of `docker-compose.yml`
2. Create a new stack in Portainer
3. Paste the configuration and deploy

#### Option 3: Unraid
See [README-Docker.md](README-Docker.md) for detailed Unraid deployment instructions.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MariaDB connection string | `mysql://farm_admin:password@localhost:3306/farm_admin_db` |
| `API_KEY` | API authentication key | Generated |
| `PORT` | Application port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

### Database Setup

The application uses MariaDB with Prisma ORM. The database schema includes:

- **Accounts** - Game account management
- **Proxies** - Proxy configuration and monitoring
- **Bots** - Bot instance management
- **Tasks** - Automated task scheduling
- **Categories** - Organization and grouping
- **Prime Link Requests** - Premium membership handling

## 📊 API Documentation

The application provides a RESTful API with the following endpoints:

- `GET/POST/PUT/DELETE /api/v1/accounts` - Account management
- `GET/POST/PUT/DELETE /api/v1/proxies` - Proxy management
- `GET/POST/PUT/DELETE /api/v1/bots` - Bot management
- `GET/POST/PUT/DELETE /api/v1/tasks` - Task management
- `GET/POST/PUT/DELETE /api/v1/account-categories` - Category management
- `GET/POST/PUT/DELETE /api/v1/prime-link-requests` - Prime request management

## 🐳 Docker Support

This application is fully containerized with:

- **Multi-stage builds** for optimized images
- **Health checks** for monitoring
- **Security hardening** with non-root user
- **Automatic migrations** on startup
- **Volume persistence** for data

## 🔒 Security

- API key authentication
- Input validation and sanitization
- SQL injection protection via Prisma
- CORS configuration
- Security headers

## 🛠️ Development

### Prerequisites

- Node.js 18+
- MariaDB 10.11+
- Docker (optional)

### Project Structure

```
farm-admin/
├── app.js              # Frontend JavaScript
├── server.js           # Backend API server
├── style.css           # Styling
├── index.html          # Main HTML page
├── prisma/             # Database schema and migrations
├── docker-compose.yml  # Docker deployment
├── Dockerfile          # Container definition
└── deploy.sh          # Deployment automation
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

1. Check the [Docker deployment guide](README-Docker.md)
2. Review the [deployment summary](DEPLOYMENT-SUMMARY.md)
3. Check container logs for troubleshooting
4. Open an issue on GitHub

## 🎯 Roadmap

- [ ] User authentication and authorization
- [ ] Advanced reporting and analytics
- [ ] WebSocket real-time updates
- [ ] Mobile-responsive improvements
- [ ] API rate limiting
- [ ] Backup and restore functionality

---

**Happy farming! 🌱** 