
Text Repeater (Guestbook)
=========================

A very small Flask web app that lets visitors submit their name and a message. Each submission is persisted in a MySQL database (locally via Docker; in production via Azure Database for MySQL Flexible Server) and all stored messages are rendered on the landing page.

Stack
-----
* Backend: Python 3 + Flask + SQLAlchemy
* Database: MySQL 8 (Azure Database for MySQL Flexible Server in prod)
* ORM Driver: PyMySQL
* Containerization: Docker / docker-compose (for local dev)

Features
--------
* Landing page with a form (name, message)
* Stores each entry in the `messages` table (id, name, message, created_at)
* Lists all messages newest-first
* Basic validation + flash messages
* `/healthz` endpoint for container / Azure App Service health probing

Project Layout
--------------
```
app.py                # Flask application & model definition
templates/index.html  # Landing page template
static/style.css      # Basic styling
requirements.txt      # Python dependencies
Dockerfile            # Image for deployment
docker-compose.yml    # Local dev stack (app + MySQL)
.env.example          # Sample environment variable file
test_app.py           # Basic pytest tests
```

Quick Start (Local - Docker Compose)
-----------------------------------
1. Copy environment file:
	```powershell
	Copy-Item .env.example .env
	```
	(You may keep defaults for local.)
2. Start services:
	```powershell
	docker compose up --build
	```
3. Visit: http://localhost:5000
4. Stop: `Ctrl+C` then `docker compose down`

Local Development (Without Docker)
----------------------------------
1. Ensure you have Python 3.12+ and a running MySQL (or use SQLite by editing `app.py`).
2. Create & activate a virtual environment:
	```powershell
	python -m venv .venv; .\.venv\Scripts\Activate.ps1
	```
3. Install dependencies:
	```powershell
	pip install -r requirements.txt
	```
4. Copy `.env.example` to `.env` and adjust DB credentials.
5. Run:
	```powershell
	python app.py
	```
6. Browse http://localhost:5000

Environment Variables
---------------------
| Variable | Purpose | Example |
|----------|---------|---------|
| FLASK_SECRET_KEY | Session & flash signing | a-long-random-string |
| DB_HOST | MySQL host | my-flex-server.mysql.database.azure.com |
| DB_PORT | MySQL port | 3306 |
| DB_USER | MySQL user (include @servername for Azure) | appuser@my-flex-server |
| DB_PASSWORD | MySQL password | (secret) |
| DB_NAME | Database name | textrepeater |
| DB_SSL_MODE | SSL setting (Azure requires) | REQUIRED |
| PORT | Listening port (for App Service) | 8000 |

Azure: Create MySQL Flexible Server
-----------------------------------
Below uses Azure CLI (adjust names / regions):
```powershell
# Variables
$RESOURCE_GROUP = "rg-textrepeater"
$LOCATION = "eastus"
$SERVER_NAME = "tr-flex-server-$([System.Guid]::NewGuid().ToString().Substring(0,8))"  # must be globally unique
$ADMIN_USER = "dbadmin"
$ADMIN_PASSWORD = "P@ssw0rd!ChangeThis42"  # choose strong secret
$DB_NAME = "textrepeater"

az group create --name $RESOURCE_GROUP --location $LOCATION
az mysql flexible-server create --resource-group $RESOURCE_GROUP --name $SERVER_NAME --location $LOCATION --admin-user $ADMIN_USER --admin-password $ADMIN_PASSWORD --sku-name Standard_B1ms --storage-size 20 --version 8.0 --public-access 0.0.0.0
az mysql flexible-server db create --resource-group $RESOURCE_GROUP --server-name $SERVER_NAME --database-name $DB_NAME

# (Optional) Set connection string output
az mysql flexible-server show-connection-string --name $SERVER_NAME --admin-user $ADMIN_USER --type pymysql
```

Networking / Firewall
---------------------
If using public access, ensure the App Service outbound IPs are allowed or set `--public-access 0.0.0.0` (allow all) only for quick testing (not production). Private VNet integration is recommended for production.

Create a Least-Privilege App User
---------------------------------
Log into the server (change host accordingly):
```powershell
mysql -h $SERVER_NAME.mysql.database.azure.com -u $ADMIN_USER@$SERVER_NAME -p
```
Then inside MySQL:
```sql
CREATE USER 'appuser'@'%' IDENTIFIED BY 'ProdAppPassword!Change';
CREATE DATABASE IF NOT EXISTS textrepeater CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER ON textrepeater.* TO 'appuser'@'%';
FLUSH PRIVILEGES;
```

Deploy to Azure App Service (Container)
--------------------------------------
Option A: Build in Azure from Dockerfile.
```powershell
$APP_NAME = "textrepeater-web-$([System.Guid]::NewGuid().ToString().Substring(0,8))"
az appservice plan create --name $APP_NAME --resource-group $RESOURCE_GROUP --sku B1 --is-linux
az webapp create --resource-group $RESOURCE_GROUP --plan $APP_NAME --name $APP_NAME --runtime "PYTHON:3.12"

# Configure settings
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings \
  FLASK_SECRET_KEY="$(New-Guid)" \
  DB_HOST="$SERVER_NAME.mysql.database.azure.com" \
  DB_PORT=3306 \
  DB_USER="appuser@$SERVER_NAME" \
  DB_PASSWORD="ProdAppPassword!Change" \
  DB_NAME="textrepeater" \
  DB_SSL_MODE=REQUIRED

# Deploy via zip (Oryx build) or use az webapp up
az webapp up --resource-group $RESOURCE_GROUP --name $APP_NAME --runtime PYTHON:3.12
```

Option B: Container Registry
```powershell
$ACR_NAME = "tracr$([System.Guid]::NewGuid().ToString().Substring(0,5))"
az acr create -g $RESOURCE_GROUP -n $ACR_NAME --sku Basic
az acr login -n $ACR_NAME
docker build -t $ACR_NAME.azurecr.io/textrepeater:latest .
docker push $ACR_NAME.azurecr.io/textrepeater:latest

az webapp create --resource-group $RESOURCE_GROUP --plan $APP_NAME --name $APP_NAME --deployment-container-image-name $ACR_NAME.azurecr.io/textrepeater:latest
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings \
  WEBSITES_PORT=5000 FLASK_SECRET_KEY="$(New-Guid)" DB_HOST="$SERVER_NAME.mysql.database.azure.com" DB_PORT=3306 DB_USER="appuser@$SERVER_NAME" DB_PASSWORD="ProdAppPassword!Change" DB_NAME="textrepeater" DB_SSL_MODE=REQUIRED
```

Health Check
------------
Configure the App Service health check path to `/healthz` for better restarts.

Running Tests
-------------
```powershell
python -m pytest -q
```

Security & Hardening Tips
-------------------------
* Always use SSL (DB_SSL_MODE=REQUIRED) for Azure MySQL.
* Rotate secrets with Azure Key Vault & link via App Settings.
* Enforce length validations and possibly add server-side HTML sanitization if enabling rich text.
* Add pagination if volume grows; current page loads all rows.
* Consider Alembic migrations instead of `create_all()` for production schema evolution.

Troubleshooting
---------------
* Connection errors: verify firewall rules / SSL requirement.
* 500 errors after posting message: check Application Insights logs or `az webapp log tail`.
* Ensure `DB_USER` includes `@servername` suffix for Azure flexible server logins.

Next Ideas
----------
* Add pagination & search.
* Add rate limiting (Flask-Limiter) to reduce spam.
* Use Azure Monitor / App Insights telemetry.
* Add Alembic migrations.
* Add App Insights logging & traces.
* Implement caching layer (Redis) for heavy read scenarios.
* Add API endpoints (JSON) for SPA or mobile usage.

CI/CD (GitHub Actions)
----------------------
Included workflow: `.github/workflows/deploy.yml`

Jobs:
1. test – installs deps and runs pytest.
2. build-and-deploy – (only on main) zips and deploys to existing Azure Web App using OIDC login.

Required GitHub Secrets:
| Secret | Purpose |
|--------|---------|
| AZURE_CLIENT_ID | Federated credential-enabled AAD app (service principal) client ID |
| AZURE_TENANT_ID | Azure AD tenant ID |
| AZURE_SUBSCRIPTION_ID | Subscription for deployment |
| AZURE_RESOURCE_GROUP | Resource group containing the Web App |
| AZURE_WEBAPP_NAME | Existing Web App name |
| DB_HOST | MySQL host (flex server FQDN) |
| DB_USER | App DB user (include @servername) |
| DB_PASSWORD | App DB password |
| DB_NAME | Database name (textrepeater) |
| FLASK_SECRET_KEY | Production secret key |

Setup OIDC Deployment Identity (once):
1. Create an Entra ID (AAD) app/service principal.
2. Assign role (e.g., `Contributor` or narrower `Web Plan Contributor` + `Website Contributor`) to the resource group.
3. In Azure Portal > Web App > Deployment Center, or via Azure CLI, add a federated credential for your GitHub repo (environment: prod, branch: main).
4. Store IDs in GitHub Secrets (above). No password/client secret needed thanks to OIDC.

Manual Redeploy:
Push to `main` triggers tests + deploy. To force a redeploy without code changes, amend a trivial file or use the GitHub UI to re-run the workflow.

License
-------
MIT (add LICENSE file if distributing publicly).

