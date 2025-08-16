const express = require('express');
const aiRouter = require('./routes/ai.routes');

const app = express();
const cors = require('cors');

app.use(cors());
// Middleware to parse JSON                         

// Middleware (optional if you plan to use POST later)
app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// AI routes
app.use('/api/ai', aiRouter);

module.exports = app;
