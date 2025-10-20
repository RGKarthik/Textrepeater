# Azure Deployment Guide for Text Repeater

This guide will help you deploy the Text Repeater application to Azure Web App with Azure SQL Database.

## Prerequisites

- Azure subscription
- Azure CLI installed (optional, can use Azure Portal)
- Git installed

## Step 1: Create Azure SQL Database

### Using Azure Portal:

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → "Databases" → "SQL Database"
3. Fill in the details:
   - **Database name**: `textrepeater-db`
   - **Server**: Create new server
   - **Server name**: `textrepeater-sql-server` (must be globally unique)
   - **Server admin login**: `sqladmin`
   - **Password**: Choose a strong password
   - **Location**: Choose your preferred region
   - **Pricing tier**: Basic (sufficient for this app)

4. Click "Review + create" and then "Create"

### Using Azure CLI:

```bash
# Create resource group
az group create --name textrepeater-rg --location "East US"

# Create SQL server
az sql server create \
  --name textrepeater-sql-server \
  --resource-group textrepeater-rg \
  --location "East US" \
  --admin-user sqladmin \
  --admin-password YourSecurePassword123!

# Create SQL database
az sql db create \
  --resource-group textrepeater-rg \
  --server textrepeater-sql-server \
  --name textrepeater-db \
  --service-objective Basic
```

## Step 2: Configure Database Firewall

1. In Azure Portal, go to your SQL server
2. Click "Firewalls and virtual networks"
3. Set "Allow Azure services and resources to access this server" to **YES**
4. Add your client IP address for management access
5. Click "Save"

## Step 3: Create Azure Web App

### Using Azure Portal:

1. Go to Azure Portal
2. Click "Create a resource" → "Web App"
3. Fill in the details:
   - **App name**: `textrepeater-app` (must be globally unique)
   - **Resource Group**: Use existing `textrepeater-rg`
   - **Runtime stack**: Node.js 18 LTS
   - **Operating System**: Windows
   - **Region**: Same as your database
   - **App Service Plan**: Create new (F1 Free tier for testing)

4. Click "Review + create" and then "Create"

### Using Azure CLI:

```bash
# Create App Service plan
az appservice plan create \
  --name textrepeater-plan \
  --resource-group textrepeater-rg \
  --sku F1 \
  --is-linux false

# Create Web App
az webapp create \
  --resource-group textrepeater-rg \
  --plan textrepeater-plan \
  --name textrepeater-app \
  --runtime "node|18-lts"
```

## Step 4: Configure Application Settings

### Using Azure Portal:

1. Go to your Web App in Azure Portal
2. Click "Configuration" → "Application settings"
3. Add the following settings (click "New application setting" for each):

```
NODE_ENV = production
DB_SERVER = textrepeater-sql-server.database.windows.net
DB_NAME = textrepeater-db
DB_USER = sqladmin
DB_PASSWORD = YourSecurePassword123!
```

4. Click "Save"

### Using Azure CLI:

```bash
az webapp config appsettings set \
  --resource-group textrepeater-rg \
  --name textrepeater-app \
  --settings \
    NODE_ENV=production \
    DB_SERVER=textrepeater-sql-server.database.windows.net \
    DB_NAME=textrepeater-db \
    DB_USER=sqladmin \
    DB_PASSWORD=YourSecurePassword123!
```

## Step 5: Deploy the Application

### Option A: Deploy from Local Git

1. In your Web App, go to "Deployment Center"
2. Choose "Local Git" as source
3. Copy the Git URL provided
4. In your local project directory, run:

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Add Azure remote and deploy
git remote add azure <Git-URL-from-Azure>
git push azure main
```

### Option B: Deploy from GitHub

1. Push your code to a GitHub repository
2. In your Web App, go to "Deployment Center"
3. Choose "GitHub" as source
4. Authorize and select your repository
5. Choose the branch (main)
6. Click "Save"

### Option C: Deploy using ZIP

1. Create a ZIP file of your project (excluding node_modules)
2. Use Azure CLI:

```bash
az webapp deployment source config-zip \
  --resource-group textrepeater-rg \
  --name textrepeater-app \
  --src textrepeater.zip
```

## Step 6: Verify Deployment

1. Go to your Web App URL: `https://textrepeater-app.azurewebsites.net`
2. The application should load and display the form
3. Test submitting a message
4. Verify that messages are saved and displayed

## Step 7: Monitor and Troubleshoot

### Check Application Logs:

```bash
az webapp log tail \
  --resource-group textrepeater-rg \
  --name textrepeater-app
```

### Common Issues:

1. **Database connection errors**: Check your connection string settings
2. **App won't start**: Check the logs for Node.js errors
3. **502 Bad Gateway**: Usually indicates the app is not starting properly

### Enable Application Insights (Optional):

1. Go to your Web App → "Application Insights"
2. Click "Turn on Application Insights"
3. Create new or use existing Application Insights resource

## Scaling and Production Considerations

### For Production Use:

1. **Upgrade App Service Plan**: Move from F1 to at least B1 for production
2. **Database Scaling**: Upgrade from Basic to Standard or Premium tier
3. **SSL Certificate**: Azure Web Apps include free SSL certificates
4. **Custom Domain**: Add your own domain name
5. **Backup Strategy**: Enable database backups
6. **Monitoring**: Set up Application Insights and alerts

### Security Best Practices:

1. Use Azure Key Vault for sensitive configuration
2. Enable Azure Active Directory authentication if needed
3. Set up proper firewall rules for your database
4. Regular security updates for dependencies

## Cost Optimization

- **Free Tier**: F1 App Service + Basic SQL Database costs ~$5/month
- **Production**: B1 App Service + Standard SQL Database costs ~$25-50/month
- **Enterprise**: Consider reserved instances for cost savings

## Support

For issues with Azure services:
- [Azure Documentation](https://docs.microsoft.com/en-us/azure/)
- [Azure Support](https://azure.microsoft.com/en-us/support/)

For application-specific issues, check the application logs and ensure all environment variables are properly set.