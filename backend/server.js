const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const trailRoutes = require('./routes/trails');
app.use('/api/trails', trailRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Ghost Trail API is running!' });
});

// Connect to MongoDB then start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✓ MongoDB connected — ghosttrail database ready');
    app.listen(process.env.PORT, () => {
      console.log(`✓ Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log('✗ MongoDB connection failed:', err.message);
  });