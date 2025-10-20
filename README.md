# Text Repeater

A simple web application that takes user input (name and message) and stores it in an Azure SQL Database. The app displays all stored messages in real-time.

## Features

- **Simple Form Interface**: Two input fields for name and message
- **Database Storage**: All data is stored in Azure SQL Database
- **Real-time Display**: Shows all stored messages with timestamps
- **Azure Ready**: Configured for Azure Web App deployment
- **Responsive Design**: Works on desktop and mobile devices
- **RESTful API**: Clean API endpoints for data operations

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: Azure SQL Database (using mssql driver)
- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Deployment**: Azure Web App with Azure SQL Database

## Project Structure

```
textrepeater/
├── server.js              # Main Express server
├── database.js            # Database connection and configuration
├── package.json           # Node.js dependencies and scripts
├── web.config             # IIS configuration for Azure
├── iisnode.yml            # IISNode configuration
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore file
├── public/
│   └── index.html         # Frontend application
├── AZURE_DEPLOYMENT.md    # Comprehensive deployment guide
└── README.md              # This file
```

## Local Development

### Prerequisites

- Node.js 18+ installed
- Azure SQL Database instance (or SQL Server for testing)

### Setup

1. **Clone and Install Dependencies**:
   ```bash
   git clone <repository-url>
   cd textrepeater
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database connection details
   ```

3. **Start the Application**:
   ```bash
   npm start
   # For development with auto-restart:
   npm run dev
   ```

4. **Access the Application**:
   Open http://localhost:3000 in your browser

### Environment Variables

Create a `.env` file with the following variables:

```env
NODE_ENV=development
PORT=3000
DB_SERVER=your-azure-sql-server.database.windows.net
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
```

## API Endpoints

### POST /api/messages
Store a new message in the database.

**Request Body**:
```json
{
  "name": "John Doe",
  "message": "Hello, World!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Message saved successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "message": "Hello, World!",
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET /api/messages
Retrieve all messages from the database.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "message": "Hello, World!",
      "created_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### GET /api/messages/count
Get the total count of messages.

**Response**:
```json
{
  "success": true,
  "count": 42
}
```

### GET /health
Health check endpoint.

**Response**:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600
}
```

## Database Schema

The application creates a `messages` table with the following structure:

```sql
CREATE TABLE messages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);
```

## Azure Deployment

For detailed deployment instructions, see [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md).

### Quick Deployment Steps:

1. **Create Azure SQL Database**
2. **Create Azure Web App** (Node.js 18 LTS)
3. **Configure Application Settings** with database connection details
4. **Deploy the code** via Git, GitHub, or ZIP upload

### Required Azure Application Settings:

```
NODE_ENV=production
DB_SERVER=your-server.database.windows.net
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
```

## Security Features

- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries using mssql driver
- **XSS Protection**: HTML escaping on frontend
- **Helmet.js**: Security headers for Express
- **CORS**: Configured for secure cross-origin requests
- **Environment Variables**: Sensitive data stored in environment variables

## Monitoring and Logging

- **Morgan**: HTTP request logging
- **Health Check**: `/health` endpoint for monitoring
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Azure Application Insights**: Ready for integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

- For deployment issues, see [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)
- For application issues, check the server logs
- For Azure-specific questions, consult [Azure Documentation](https://docs.microsoft.com/en-us/azure/)
