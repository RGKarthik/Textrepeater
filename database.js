const sql = require('mssql');

// Database configuration using environment variables
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Use encryption for Azure SQL
        enableArithAbort: true,
        trustServerCertificate: false
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let poolPromise;

const initializeDatabase = async () => {
    try {
        // Create connection pool
        poolPromise = new sql.ConnectionPool(config).connect();
        const pool = await poolPromise;
        
        console.log('Connected to Azure SQL Database');
        
        // Create the messages table if it doesn't exist
        await createMessagesTable(pool);
        
        return pool;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        throw error;
    }
};

const createMessagesTable = async (pool) => {
    try {
        const request = pool.request();
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='messages' AND xtype='U')
            CREATE TABLE messages (
                id INT IDENTITY(1,1) PRIMARY KEY,
                name NVARCHAR(255) NOT NULL,
                message NVARCHAR(MAX) NOT NULL,
                created_at DATETIME2 DEFAULT GETDATE()
            )
        `);
        console.log('Messages table ready');
    } catch (error) {
        console.error('Error creating messages table:', error.message);
        throw error;
    }
};

const getPool = () => {
    if (!poolPromise) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return poolPromise;
};

module.exports = {
    initializeDatabase,
    getPool,
    sql
};