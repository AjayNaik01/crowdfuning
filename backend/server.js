const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const path = require('path');

// Load environment variables
dotenv.config({ path: './config.env' });

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Debug route to test server response
app.get('/debug', (req, res) => {
    res.json({
        message: 'Server is working',
        timestamp: new Date().toISOString(),
        uploadsPath: path.join(__dirname, 'uploads')
    });
});

// Test route to verify static file serving
app.get('/test-image', (req, res) => {
    const testImagePath = path.join(__dirname, 'uploads', 'campaigns', 'images', 'img-1750679476173-832855630.jpg');
    console.log('Testing image path:', testImagePath);
    console.log('File exists:', require('fs').existsSync(testImagePath));
    if (require('fs').existsSync(testImagePath)) {
        res.sendFile(testImagePath);
    } else {
        res.status(404).json({ error: 'Test image not found' });
    }
});

// Health check route
app.get('/', (req, res) => {
    res.json({ message: 'Crowdfunding API is running!' });
});

// Serve static files from uploads directory (MUST be before API routes)
app.use('/uploads', (req, res, next) => {
    console.log('=== STATIC FILE REQUEST ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);

    // Remove leading slash from req.url to get the correct path
    const cleanUrl = req.url.startsWith('/') ? req.url.substring(1) : req.url;
    const filePath = path.join(__dirname, 'uploads', cleanUrl);

    console.log('Clean URL:', cleanUrl);
    console.log('Full path:', filePath);
    console.log('File exists:', require('fs').existsSync(filePath));
    console.log('========================');

    if (require('fs').existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        console.log('File not found, passing to next middleware');
        next();
    }
});

// Routes
const userRoutes = require('./routes/user');
app.use('/api/user', require('./routes/user'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/kyc', require('./routes/kyc'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 