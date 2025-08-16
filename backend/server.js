const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const path = require('path');
const statisticsRoute = require('./routes/statistics');

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

// Serve static files with CORS headers
app.use('/uploads', cors(), express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/user', require('./routes/user'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/kyc', require('./routes/kyc'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/withdrawals', require('./routes/withdrawals'));
app.use('/api/platform-settings', require('./routes/platformSettings'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/statistics', statisticsRoute);

// Admin routes - mount adminAuth first, then admin routes
console.log('Loading admin routes...');
app.use('/api/admin', require('./routes/adminAuth'));
app.use('/api/admin', require('./routes/admin'));
console.log('Admin routes loaded successfully');

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