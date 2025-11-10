const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Import middleware
const { performanceMonitor } = require('./middleware/performance.middleware');
const { errorHandler } = require('./middleware/error-handler.middleware');

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Performance monitoring
app.use(performanceMonitor);

// Import routes
const videosRoutes = require('./routes/videos.routes');
const categoriesRoutes = require('./routes/categories.routes');
const graphRoutes = require('./routes/graph.routes');
const chatRoutes = require('./routes/chat.routes');
const monitoringRoutes = require('./routes/monitoring.routes');

// API Routes
app.use('/api/videos', videosRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});

module.exports = app;
