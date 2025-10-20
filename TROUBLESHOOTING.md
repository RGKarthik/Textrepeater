# Deployment Troubleshooting Guide

## Common Deployment Issues and Solutions

### 1. Application Won't Start on Azure

**Symptoms:**
- 502 Bad Gateway error
- Application Unavailable
- Logs show "Failed to start server"

**Solutions:**

#### Check Application Settings:
```bash
# Verify these are set in Azure Web App Configuration:
NODE_ENV=production
WEBSITE_NODE_DEFAULT_VERSION=18.17.0
```

#### Check Logs:
```bash
# View real-time logs
az webapp log tail --resource-group textrepeater-rg --name your-app-name

# Or in Azure Portal: 
# Your Web App → Monitoring → Log Stream
```

### 2. Database Connection Issues

**Symptoms:**
- "Database not available" errors
- API endpoints return 503 errors
- `/api/test-db` shows connection failures

**Solutions:**

#### For Azure Database for MySQL:
1. **Check Firewall Rules:**
   ```bash
   # Allow Azure services
   az mysql server firewall-rule create \
     --resource-group textrepeater-rg \
     --server-name your-mysql-server \
     --name AllowAzureServices \
     --start-ip-address 0.0.0.0 \
     --end-ip-address 0.0.0.0
   ```

2. **Verify Connection Settings:**
   ```
   DB_HOST=your-server.mysql.database.azure.com
   DB_PORT=3306
   DB_NAME=textrepeater_db  
   DB_USER=mysqladmin@your-server
   DB_PASSWORD=YourPassword123!
   DB_SSL=true
   ```

#### For Local MySQL:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=textrepeater_db
DB_USER=root
DB_PASSWORD=
DB_SSL=false
```

### 3. Build and Deployment Failures

**Symptoms:**
- Deployment fails during npm install
- "Module not found" errors
- Old code still running

**Solutions:**

#### Clear Deployment Cache:
1. Go to Azure Portal → Your Web App → Development Tools → Advanced Tools
2. Click "Go" to open Kudu
3. Navigate to CMD console
4. Run: `rmdir /s node_modules` then redeploy

#### Force Rebuild:
```bash
# Add this to Application Settings:
SCM_DO_BUILD_DURING_DEPLOYMENT=true
WEBSITE_NPM_DEFAULT_VERSION=latest
```

### 4. SSL/HTTPS Issues

**Symptoms:**
- Mixed content warnings
- HTTPS redirects not working

**Solutions:**

#### Enable HTTPS Only:
```bash
az webapp update --resource-group textrepeater-rg --name your-app-name --https-only true
```

#### Update Application Settings:
```
WEBSITE_HTTPS_ONLY=1
```

### 5. Performance Issues

**Symptoms:**
- Slow response times
- Timeouts
- High CPU usage

**Solutions:**

#### Scale Up App Service Plan:
```bash
# Upgrade to Basic B1 or higher
az appservice plan update --resource-group textrepeater-rg --name your-plan --sku B1
```

#### Enable Always On:
```bash
az webapp config set --resource-group textrepeater-rg --name your-app-name --always-on true
```

### 6. Environment Variables Not Loading

**Symptoms:**
- Application runs but can't connect to database
- "Configuration not found" errors

**Solutions:**

#### Verify in Azure Portal:
1. Go to Your Web App → Configuration → Application Settings
2. Ensure all required variables are present:
   - NODE_ENV=production
   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL

#### Using Azure CLI:
```bash
# List current settings
az webapp config appsettings list --resource-group textrepeater-rg --name your-app-name

# Add missing settings
az webapp config appsettings set --resource-group textrepeater-rg --name your-app-name --settings DB_HOST=your-host
```

## Debugging Steps

### Step 1: Test Locally
```bash
# Install dependencies
npm install

# Test with local settings
npm start

# Check endpoints:
# http://localhost:3000
# http://localhost:3000/health
# http://localhost:3000/api/test-db
```

### Step 2: Check Azure Deployment
```bash
# View deployment logs
az webapp deployment operation list --resource-group textrepeater-rg --name your-app-name

# Stream live logs
az webapp log tail --resource-group textrepeater-rg --name your-app-name
```

### Step 3: Test Database Connectivity
Visit: `https://your-app.azurewebsites.net/api/test-db`

**Expected Response (Success):**
```json
{
  "success": true,
  "data": {
    "test": 1,
    "current_time": "2024-01-01T12:00:00.000Z"
  },
  "message": "Database connection successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Connection details...",
  "config": {
    "host": "your-host",
    "port": "3306",
    "database": "textrepeater_db",
    "user": "your-user"
  }
}
```

### Step 4: Verify Application Health
Visit: `https://your-app.azurewebsites.net/health`

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "database": "Connected"
}
```

## Emergency Fixes

### Quick Database Bypass (Temporary)
If you need the application running immediately without database:

1. **Remove all DB_ environment variables**
2. **Restart the application**
3. **Application will run with limited functionality**
4. **Configure database later**

### Rollback Deployment
```bash
# List deployment slots
az webapp deployment slot list --resource-group textrepeater-rg --name your-app-name

# Swap to previous deployment
az webapp deployment slot swap --resource-group textrepeater-rg --name your-app-name --slot staging --target-slot production
```

## Getting Help

### Check These Resources:
1. **Azure Portal Logs**: Your Web App → Monitoring → Log Stream
2. **Kudu Console**: Your Web App → Advanced Tools → Go
3. **Application Insights**: If enabled, check for detailed error tracking
4. **MySQL Logs**: Check your MySQL service logs

### Useful Commands:
```bash
# Test local MySQL connection
mysql -h localhost -u root -p textrepeater_db

# Test Azure MySQL connection  
mysql -h your-server.mysql.database.azure.com -u mysqladmin@your-server -p textrepeater_db --ssl-mode=REQUIRED

# Check Azure resource status
az resource list --resource-group textrepeater-rg --output table
```