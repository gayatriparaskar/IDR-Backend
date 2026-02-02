require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');
const queryRoutes = require('./routes/queryRoutes');
const teamMemberRoutes = require('./routes/teamMemberRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
// File upload directories
const teamUploadsDir = path.join(__dirname, 'public', 'uploads', 'team');
const propertyUploadsDir = path.join(__dirname, 'public', 'uploads', 'properties');

// Create directories if they don't exist
[teamUploadsDir, propertyUploadsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
// API Routes
app.use('/api', require('./routes/api'));
app.use('/api/queries', queryRoutes);
app.use('/api/team-members', teamMemberRoutes);
app.use('/api/properties', propertyRoutes);
// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server Error' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});