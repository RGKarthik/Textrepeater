require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { initializeDatabase, getPool, closePool } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to save a message
app.post('/api/messages', async (req, res) => {
    try {
        const { name, message } = req.body;
        
        // Validation
        if (!name || !message) {
            return res.status(400).json({ 
                error: 'Both name and message are required' 
            });
        }
        
        if (name.length > 255) {
            return res.status(400).json({ 
                error: 'Name must be 255 characters or less' 
            });
        }
        
        const pool = getPool();
        if (!pool) {
            return res.status(503).json({ 
                error: 'Database not available. Please configure database connection.' 
            });
        }
        
        // Insert the message
        const [result] = await pool.execute(
            'INSERT INTO messages (name, message) VALUES (?, ?)',
            [name.trim(), message.trim()]
        );
        
        // Get the inserted message
        const [rows] = await pool.execute(
            'SELECT id, name, message, created_at FROM messages WHERE id = ?',
            [result.insertId]
        );
        
        const insertedMessage = rows[0];
        
        res.status(201).json({
            success: true,
            message: 'Message saved successfully',
            data: {
                id: insertedMessage.id,
                name: insertedMessage.name,
                message: insertedMessage.message,
                created_at: insertedMessage.created_at
            }
        });
        
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ 
            error: 'Internal server error while saving message' 
        });
    }
});

// API endpoint to get all messages
app.get('/api/messages', async (req, res) => {
    try {
        const pool = getPool();
        if (!pool) {
            return res.json({
                success: true,
                data: []
            });
        }
        
        const [rows] = await pool.execute(`
            SELECT id, name, message, created_at 
            FROM messages 
            ORDER BY created_at DESC
        `);
        
        res.json({
            success: true,
            data: rows
        });
        
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ 
            error: 'Internal server error while fetching messages' 
        });
    }
});

// API endpoint to get message count
app.get('/api/messages/count', async (req, res) => {
    try {
        const pool = getPool();
        if (!pool) {
            return res.json({
                success: true,
                count: 0
            });
        }
        
        const [rows] = await pool.execute('SELECT COUNT(*) as count FROM messages');
        
        res.json({
            success: true,
            count: rows[0].count
        });
        
    } catch (error) {
        console.error('Error getting message count:', error);
        res.status(500).json({ 
            error: 'Internal server error while getting message count' 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    const pool = getPool();
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: pool ? 'Connected' : 'Not configured'
    });
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
    try {
        const pool = getPool();
        if (!pool) {
            return res.status(503).json({ 
                success: false,
                error: 'Database not configured',
                config: {
                    host: process.env.DB_HOST || 'Not set',
                    port: process.env.DB_PORT || 'Not set',
                    database: process.env.DB_NAME || 'Not set',
                    user: process.env.DB_USER || 'Not set'
                }
            });
        }
        
        const [rows] = await pool.execute('SELECT 1 as test, NOW() as current_time');
        res.json({ 
            success: true, 
            data: rows[0],
            message: 'Database connection successful'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message,
            code: error.code
        });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
const startServer = async () => {
    try {
        await initializeDatabase();
        
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Access the application at: http://localhost:${PORT}`);
            
            if (!process.env.DB_HOST) {
                console.log('\n⚠️  WARNING: No database configured.');
                console.log('The application will run but database operations will be limited.');
                console.log('Please configure database environment variables for full functionality.');
            }
        });
    } catch (error) {
        console.error('Failed to initialize database:', error);
        console.log('\n🚀 Starting server anyway without database...');
        
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT} (without database)`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Access the application at: http://localhost:${PORT}`);
            console.log('\n⚠️  Database connection failed. Please check your configuration.');
        });
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await closePool();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await closePool();
    process.exit(0);
});

startServer();