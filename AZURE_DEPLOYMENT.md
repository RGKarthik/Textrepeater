# Azure Deployment Guide for Text Repeater

This guide walks through deploying the Text Repeater application to Azure App Service (Web App) backed by **Azure Database for MySQL**. The same steps apply if you are using another managed MySQL service; just adjust the connection settings accordingly.

## Prerequisites

- Azure subscription
- Azure CLI installed (optional, can use Azure Portal)
- Git installed

## Step 1: Provision Azure Database for MySQL

You can follow either the Azure Portal steps or the Azure CLI commands below. The examples use **Flexible Server** (recommended), but Single Server works too.

### Using Azure Portal

1. Open [Azure Portal](https://portal.azure.com).
2. Create (or select) a resource group, e.g., `textrepeater-rg`.
3. Click "Create a resource" → "Databases" → "Azure Database for MySQL Flexible Server".
4. Fill in these values (adjust as needed):
   - **Server name**: `textrepeater-mysql` (must be globally unique)
   - **Region**: Same region you plan to host the Web App
   - **Workload type**: Development
   - **Compute + storage**: Burstable B1ms (enough for this demo)
   - **Authentication**: Password authentication (or AAD if preferred)
   - **Admin username**: `mysqladmin`
   - **Password**: `YourSecurePassword123!`
   - **Allow public access**: Enabled (you can tighten later)
   - **Firewall rules**: Allow current client IP **and** "Allow access to Azure services" = On
5. After the server is created, add a database named `textrepeater_db` from the "Databases" blade.

### Using Azure CLI

```bash
# Create resource group
az group create --name textrepeater-rg --location "East US"

# Create MySQL flexible server (basic dev SKU)
az mysql flexible-server create \
  --name textrepeater-mysql \
  --resource-group textrepeater-rg \
  --location "East US" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 8.0 \
  --admin-user mysqladmin \
  --admin-password YourSecurePassword123! \
  --yes

# Allow Azure services to connect to the server
az mysql flexible-server firewall-rule create \
  --resource-group textrepeater-rg \
  --name textrepeater-mysql \
  --rule-name AllowAzure \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Create the application database
az mysql flexible-server db create \
  --resource-group textrepeater-rg \
  --server-name textrepeater-mysql \
  --database-name textrepeater_db
```

## Step 2: Configure Database Firewall / Network Access

1. In Azure Portal, open the MySQL server you created.
2. Under **Networking**, ensure **Allow public access** is enabled (for private access, integrate your Web App with the same VNet).
3. Toggle **Allow access to Azure services** to **Yes** so App Service can connect.
4. Add your current public IP so you can test connections from your laptop if needed.
5. Save the changes. Firewall updates can take a minute to apply.

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

### Using Azure Portal

1. Open your Web App → **Configuration** → **Application settings**.
2. Add (or update) these key/value pairs:

```
NODE_ENV = production
DB_HOST = textrepeater-mysql.mysql.database.azure.com
DB_PORT = 3306
DB_NAME = textrepeater_db
DB_USER = mysqladmin@textrepeater-mysql
DB_PASSWORD = YourSecurePassword123!
DB_SSL = true
WEBSITE_NODE_DEFAULT_VERSION = 18.17.0
SCM_DO_BUILD_DURING_DEPLOYMENT = true
```

3. Click **Save** and allow the application to restart.

### Using Azure CLI

```bash
az webapp config appsettings set \
  --resource-group textrepeater-rg \
  --name textrepeater-app \
  --settings \
    NODE_ENV=production \
    DB_HOST=textrepeater-mysql.mysql.database.azure.com \
    DB_PORT=3306 \
    DB_NAME=textrepeater_db \
    DB_USER=mysqladmin@textrepeater-mysql \
    DB_PASSWORD=YourSecurePassword123! \
    DB_SSL=true \
    WEBSITE_NODE_DEFAULT_VERSION=18.17.0 \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true
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
5. (Optional) Visit `/api/test-db` and `/health` to confirm database connectivity and overall health

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

- **Dev/Test**: F1 App Service + B1ms MySQL Flexible Server ≈ $12–15/month
- **Production**: B1 App Service + GP_S_2 MySQL Flexible Server ≈ $60+/month
- **Enterprise**: Consider reserved compute and Azure Hybrid Benefit to reduce spend

## Support

For issues with Azure services:
- [Azure Documentation](https://docs.microsoft.com/en-us/azure/)
- [Azure Support](https://azure.microsoft.com/en-us/support/)

For application-specific issues, check the application logs and ensure all environment variables are properly set.