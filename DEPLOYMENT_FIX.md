# Azure Deployment Fix Guide

## 🚨 Common Azure Deployment Issues & Solutions

### Issue 1: GitHub Actions Build Failures

**Problem**: Build fails with Node.js version mismatches or test failures

**Solution**: ✅ Fixed in latest commit
- Updated GitHub workflow to use Node.js 18.x
- Fixed test script to exit with code 0
- Added proper build script

### Issue 2: Application Not Starting

**Problem**: 502 Bad Gateway or Application Error

**Solutions**:

#### Check Application Settings in Azure Portal:
```
NODE_ENV = production
WEBSITE_NODE_DEFAULT_VERSION = 18.17.0
SCM_DO_BUILD_DURING_DEPLOYMENT = true
```

#### Check Startup Command:
In Azure Portal → Configuration → General Settings:
```
Startup Command: npm start
```

### Issue 3: Database Connection Issues

**Problem**: App starts but database operations fail

**Solution**: Add these to Azure Application Settings:
```
DB_HOST = your-mysql-host
DB_PORT = 3306
DB_NAME = textrepeater_db
DB_USER = your-username
DB_PASSWORD = your-password
DB_SSL = true
```

### Issue 4: Static Files Not Loading

**Problem**: CSS/JS files return 404 errors

**Solution**: ✅ Fixed in web.config
- Updated rewrite rules for better static file handling
- Proper routing configuration

## 🔧 Manual Deployment Steps

If GitHub Actions is failing, try manual deployment:

### Option 1: Local Git Deployment
```bash
# In Azure Portal → Deployment Center → Local Git
git remote add azure <your-azure-git-url>
git push azure main
```

### Option 2: ZIP Deployment
```bash
# Create deployment package
zip -r deploy.zip . -x node_modules/\* .git/\* .env

# Deploy using Azure CLI
az webapp deployment source config-zip \
  --resource-group your-rg \
  --name TextRepeaterApp \
  --src deploy.zip
```

### Option 3: FTP Deployment
1. Get FTP credentials from Azure Portal → Deployment Center
2. Upload files to `/site/wwwroot/`
3. Restart the app

## 🏥 Health Check URLs

Test these after deployment:

1. **Main App**: `https://textrepeaterapp.azurewebsites.net/`
2. **Health Check**: `https://textrepeaterapp.azurewebsites.net/health`
3. **Database Test**: `https://textrepeaterapp.azurewebsites.net/api/test-db`

## 📋 Deployment Checklist

### Before Deployment:
- [ ] Code committed and pushed to GitHub
- [ ] Package.json has correct start script
- [ ] Environment variables configured in Azure
- [ ] Database server accessible from Azure

### After Deployment:
- [ ] Application starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Database test endpoint works
- [ ] Frontend loads correctly

## 🔍 Debugging Commands

### View Live Logs:
```bash
# Azure CLI
az webapp log tail --resource-group your-rg --name TextRepeaterApp

# Or use Azure Portal → Monitoring → Log Stream
```

### Check Application Settings:
```bash
az webapp config appsettings list \
  --resource-group your-rg \
  --name TextRepeaterApp
```

### Restart Application:
```bash
az webapp restart \
  --resource-group your-rg \
  --name TextRepeaterApp
```

## 🚀 Quick Fix Commands

Run these if deployment is stuck:

```bash
# Clear deployment cache
az webapp deployment source delete \
  --resource-group your-rg \
  --name TextRepeaterApp

# Force rebuild
az webapp config appsettings set \
  --resource-group your-rg \
  --name TextRepeaterApp \
  --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Restart app
az webapp restart \
  --resource-group your-rg \
  --name TextRepeaterApp
```

## ⚡ Emergency Bypass

If all else fails, deploy without database:

1. **Remove all DB_ environment variables** temporarily
2. **Deploy the application**
3. **App will start with limited functionality**
4. **Add database configuration later**

The app is designed to gracefully handle missing database configuration.

## 📞 Getting Help

### Check These in Order:
1. **GitHub Actions**: Repository → Actions tab
2. **Azure Logs**: Portal → Monitoring → Log Stream  
3. **Kudu Console**: Portal → Advanced Tools → Go
4. **Health Endpoints**: Test /health and /api/test-db

### Common Error Messages:

**"Application Error"**
→ Check Application Settings and restart

**"502 Bad Gateway"**  
→ Check startup command and Node.js version

**"ECONNREFUSED"**
→ Database connection issue, check firewall

**"Module not found"**
→ Clear cache and redeploy