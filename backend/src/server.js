const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const videosRoutes = require('./routes/videos.routes');
const categoriesRoutes = require('./routes/categories.routes');
const graphRoutes = require('./routes/graph.routes');
const chatRoutes = require('./routes/chat.routes');

// API Routes
app.use('/api/videos', videosRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'YouTube Study App API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});

module.exports = app;
