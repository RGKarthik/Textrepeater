# MySQL Deployment Guide for Text Repeater

This guide will help you deploy the Text Repeater application with MySQL database support. You can use various MySQL hosting options including Azure Database for MySQL, AWS RDS, Google Cloud SQL, or self-hosted MySQL.

## MySQL Hosting Options

### Option 1: Azure Database for MySQL (Recommended for Azure Web App)

#### Create Azure Database for MySQL:

```bash
# Create resource group
az group create --name textrepeater-rg --location "East US"

# Create MySQL server
az mysql server create \
  --resource-group textrepeater-rg \
  --name textrepeater-mysql \
  --location "East US" \
  --admin-user mysqladmin \
  --admin-password YourSecurePassword123! \
  --sku-name B_Gen5_1 \
  --version 8.0

# Create database
az mysql db create \
  --resource-group textrepeater-rg \
  --server-name textrepeater-mysql \
  --name textrepeater_db

# Configure firewall to allow Azure services
az mysql server firewall-rule create \
  --resource-group textrepeater-rg \
  --server-name textrepeater-mysql \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

**Connection Details:**
```
DB_HOST: textrepeater-mysql.mysql.database.azure.com
DB_PORT: 3306
DB_NAME: textrepeater_db
DB_USER: mysqladmin@textrepeater-mysql
DB_PASSWORD: YourSecurePassword123!
DB_SSL: true
```

### Option 2: AWS RDS MySQL

1. Go to AWS RDS Console
2. Create database → MySQL
3. Choose settings:
   - **Engine version**: MySQL 8.0
   - **Instance class**: db.t3.micro (free tier)
   - **Storage**: 20 GB
   - **Database name**: `textrepeater_db`
   - **Username**: `admin`
   - **Password**: `YourSecurePassword123!`

**Connection Details:**
```
DB_HOST: your-rds-instance.region.rds.amazonaws.com
DB_PORT: 3306
DB_NAME: textrepeater_db
DB_USER: admin
DB_PASSWORD: YourSecurePassword123!
DB_SSL: true
```

### Option 3: Google Cloud SQL MySQL

```bash
# Create Cloud SQL instance
gcloud sql instances create textrepeater-mysql \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-central1

# Set root password
gcloud sql users set-password root \
  --host=% \
  --instance=textrepeater-mysql \
  --password=YourSecurePassword123!

# Create database
gcloud sql databases create textrepeater_db \
  --instance=textrepeater-mysql
```

### Option 4: Local MySQL (Development)

**Install MySQL locally:**
- **Windows**: Download MySQL Installer or use XAMPP
- **macOS**: `brew install mysql`
- **Linux**: `sudo apt-get install mysql-server`

**Setup:**
```sql
CREATE DATABASE textrepeater_db;
CREATE USER 'textrepeater'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON textrepeater_db.* TO 'textrepeater'@'localhost';
FLUSH PRIVILEGES;
```

## Azure Web App Configuration for MySQL

### Application Settings:

Add these to your Azure Web App Configuration → Application Settings:

| Name | Value | Example |
|------|-------|---------|
| `NODE_ENV` | `production` | production |
| `DB_HOST` | Your MySQL host | textrepeater-mysql.mysql.database.azure.com |
| `DB_PORT` | `3306` | 3306 |
| `DB_NAME` | `textrepeater_db` | textrepeater_db |
| `DB_USER` | Your MySQL username | mysqladmin@textrepeater-mysql |
| `DB_PASSWORD` | Your MySQL password | YourSecurePassword123! |
| `DB_SSL` | `true` | true |

### Azure CLI Configuration:

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
    DB_SSL=true
```

## Database Schema

The application will automatically create this table:

```sql
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Connection Security

### For Cloud Databases:

1. **Enable SSL**: Always set `DB_SSL=true` for cloud databases
2. **Firewall Rules**: Configure to allow your Azure Web App
3. **VNet Integration**: Consider VNet integration for enhanced security

### Firewall Configuration:

#### Azure Database for MySQL:
```bash
# Allow Azure services
az mysql server firewall-rule create \
  --resource-group textrepeater-rg \
  --server-name textrepeater-mysql \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow your IP for management
az mysql server firewall-rule create \
  --resource-group textrepeater-rg \
  --server-name textrepeater-mysql \
  --name AllowMyIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

## Performance Optimization

### Connection Pooling:
The application uses connection pooling with these settings:
```javascript
connectionLimit: 10,
acquireTimeout: 60000,
timeout: 60000,
reconnect: true
```

### Database Indexing:
```sql
-- Already included in table creation
CREATE INDEX idx_created_at ON messages(created_at);

-- Optional: Add index for name searches
CREATE INDEX idx_name ON messages(name);
```

## Monitoring and Maintenance

### Enable Slow Query Log:
```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
```

### Backup Strategy:
- **Azure MySQL**: Automated backups with 7-day retention
- **AWS RDS**: Automated backups with configurable retention
- **Local**: Regular mysqldump backups

## Troubleshooting

### Common Issues:

1. **Connection Timeout**:
   ```
   Error: connect ETIMEDOUT
   Solution: Check firewall rules and network connectivity
   ```

2. **SSL Connection Error**:
   ```
   Error: ER_NOT_SUPPORTED_AUTH_MODE
   Solution: Ensure DB_SSL is set correctly, check MySQL version
   ```

3. **Authentication Failed**:
   ```
   Error: ER_ACCESS_DENIED_ERROR
   Solution: Verify username, password, and host permissions
   ```

### Debug Connection:

Add this temporary endpoint to test database connectivity:

```javascript
app.get('/api/test-db', async (req, res) => {
    try {
        const pool = await getPool();
        const [rows] = await pool.execute('SELECT 1 as test');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## Cost Optimization

### Pricing Comparison (Monthly):

| Service | Basic Tier | Standard Tier | Premium Tier |
|---------|------------|---------------|--------------|
| **Azure MySQL** | ~$25 | ~$60 | ~$200+ |
| **AWS RDS** | ~$15 (free tier) | ~$30 | ~$150+ |
| **Google Cloud SQL** | ~$25 | ~$50 | ~$200+ |
| **Local/VPS** | ~$5-20 | ~$20-50 | ~$50-100 |

### Cost Optimization Tips:
1. Use Basic tier for development/testing
2. Enable auto-pause for development databases
3. Monitor storage usage and clean old data
4. Use reserved instances for production workloads

## Migration from Azure SQL

If migrating from the previous Azure SQL version:

1. **Export data** from Azure SQL Database
2. **Import data** to MySQL using mysqldump
3. **Update connection strings** in Azure Web App
4. **Test thoroughly** before switching

## Support Resources

- [Azure Database for MySQL Documentation](https://docs.microsoft.com/en-us/azure/mysql/)
- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
- [Node.js MySQL2 Documentation](https://github.com/sidorares/node-mysql2)