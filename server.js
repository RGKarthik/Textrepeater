require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { initializeDatabase, getPool, sql } = require('./database');

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
        
        const pool = await getPool();
        const request = pool.request();
        
        // Insert the message
        const result = await request
            .input('name', sql.NVarChar(255), name.trim())
            .input('message', sql.NVarChar(sql.MAX), message.trim())
            .query(`
                INSERT INTO messages (name, message) 
                OUTPUT INSERTED.id, INSERTED.name, INSERTED.message, INSERTED.created_at
                VALUES (@name, @message)
            `);
        
        const insertedMessage = result.recordset[0];
        
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
        const pool = await getPool();
        const request = pool.request();
        
        const result = await request.query(`
            SELECT id, name, message, created_at 
            FROM messages 
            ORDER BY created_at DESC
        `);
        
        res.json({
            success: true,
            data: result.recordset
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
        const pool = await getPool();
        const request = pool.request();
        
        const result = await request.query('SELECT COUNT(*) as count FROM messages');
        
        res.json({
            success: true,
            count: result.recordset[0].count
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
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
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
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

startServer();