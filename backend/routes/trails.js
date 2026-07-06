const express = require('express');
const router = express.Router();
const Trail = require('../models/Trail');

// GET all trails
router.get('/', async (req, res) => {
  try {
    const trails = await Trail.find();
    res.json(trails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single trail by ID
router.get('/:id', async (req, res) => {
  try {
    const trail = await Trail.findById(req.params.id);
    if (!trail) return res.status(404).json({ error: 'Trail not found' });
    res.json(trail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new trail
router.post('/', async (req, res) => {
  try {
    const trail = new Trail(req.body);
    const saved = await trail.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT confirm trail is still fresh (trail decay reset)
router.put('/:id/confirm', async (req, res) => {
  try {
    const trail = await Trail.findByIdAndUpdate(
      req.params.id,
      { lastConfirmedDate: Date.now() },
      { new: true }
    );
    res.json({ message: 'Trail confirmed fresh', trail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;