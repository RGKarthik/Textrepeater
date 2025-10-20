const mysql = require('mysql2/promise');

// Database configuration using environment variables
const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : false,
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

let pool;

const initializeDatabase = async () => {
    try {
        // Create connection pool
        pool = mysql.createPool(config);
        
        console.log('Connected to MySQL Database');
        
        // Test the connection
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        
        // Create the messages table if it doesn't exist
        await createMessagesTable();
        
        return pool;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        throw error;
    }
};

const createMessagesTable = async () => {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Messages table ready');
    } catch (error) {
        console.error('Error creating messages table:', error.message);
        throw error;
    }
};

const getPool = () => {
    if (!pool) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return pool;
};

const closePool = async () => {
    if (pool) {
        await pool.end();
        console.log('Database connection pool closed');
    }
};

module.exports = {
    initializeDatabase,
    getPool,
    closePool
};