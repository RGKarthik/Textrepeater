# Text Repeater

A simple web application that takes user input (name and message) and stores it in a MySQL database. The app displays all stored messages in real-time.

## Features

- **Simple Form Interface**: Two input fields for name and message
- **Database Storage**: All data is stored in MySQL database
- **Real-time Display**: Shows all stored messages with timestamps
- **Azure Ready**: Configured for Azure Web App deployment with multiple MySQL hosting options
- **Responsive Design**: Works on desktop and mobile devices
- **RESTful API**: Clean API endpoints for data operations

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MySQL (supports Azure Database for MySQL, AWS RDS, Google Cloud SQL, local MySQL)
- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Deployment**: Azure Web App with MySQL database

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
- MySQL database (local installation, Azure Database for MySQL, AWS RDS, or Google Cloud SQL)

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
DB_HOST=localhost
DB_PORT=3306
DB_NAME=textrepeater_db
DB_USER=your-username
DB_PASSWORD=your-password
DB_SSL=false
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
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Database Deployment

For detailed MySQL deployment instructions, see [MYSQL_DEPLOYMENT.md](./MYSQL_DEPLOYMENT.md).

### MySQL Hosting Options:

1. **Azure Database for MySQL** (Recommended for Azure Web App)
2. **AWS RDS MySQL**
3. **Google Cloud SQL MySQL**
4. **Local MySQL** (Development)

### Quick Deployment Steps:

1. **Create MySQL Database** (choose from options above)
2. **Create Azure Web App** (Node.js 18 LTS)
3. **Configure Application Settings** with MySQL connection details
4. **Deploy the code** via Git, GitHub, or ZIP upload

### Required Azure Application Settings:

```
NODE_ENV=production
DB_HOST=your-mysql-host
DB_PORT=3306
DB_NAME=textrepeater_db
DB_USER=your-username
DB_PASSWORD=your-password
DB_SSL=true
```

## Security Features

- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries using mysql2 driver
- **XSS Protection**: HTML escaping on frontend
- **Helmet.js**: Security headers for Express
- **CORS**: Configured for secure cross-origin requests
- **Environment Variables**: Sensitive data stored in environment variables
- **SSL Support**: Configurable SSL connections for cloud databases

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

- For deployment issues, see [MYSQL_DEPLOYMENT.md](./MYSQL_DEPLOYMENT.md)
- For application issues, check the server logs
- For MySQL-specific questions, consult [MySQL Documentation](https://dev.mysql.com/doc/)
