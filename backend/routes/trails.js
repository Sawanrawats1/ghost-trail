const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Trail = require('../models/Trail');

// Small helper — decodes the JWT from the Authorization header if present.
// Returns null instead of throwing, so routes that don't strictly require
// auth (like POST /) can still work for anonymous/legacy calls.
function getUserFromToken(req) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET); // { id, name, email }
  } catch (err) {
    return null;
  }
}

// GET all trails
router.get('/', async (req, res) => {
  try {
    const trails = await Trail.find();
    res.json(trails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET trails contributed by the logged-in user (My Trails page)
// IMPORTANT: this must come BEFORE /:id, or Express will try to treat
// "mine" as a trail ID and 404/CastError on ObjectId parsing.
router.get('/mine', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Login required to view your trails' });

    const trails = await Trail.find({ contributorId: user.id }).sort({ createdAt: -1 });
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
    const user = getUserFromToken(req);
    const trailData = { ...req.body };
    if (user) trailData.contributorId = user.id; // auto-attach if logged in

    const trail = new Trail(trailData);
    const saved = await trail.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update trail — only the original contributor can edit
router.put('/:id', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Login required' });

    const trail = await Trail.findById(req.params.id);
    if (!trail) return res.status(404).json({ error: 'Trail not found' });

    // Legacy trails (seeded before contributorId existed) have no owner —
    // block edits on those too, rather than letting anyone claim them.
    if (!trail.contributorId || trail.contributorId.toString() !== user.id) {
      return res.status(403).json({ error: 'You can only edit trails you contributed' });
    }

    // Only allow editing safe, non-structural fields — not waypoints/comments/contributorId here
    const editableFields = ['name', 'location', 'type', 'difficulty', 'description', 'story', 'challenges'];
    editableFields.forEach(field => {
      if (req.body[field] !== undefined) trail[field] = req.body[field];
    });

    const updated = await trail.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE trail — only the original contributor can delete
router.delete('/:id', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Login required' });

    const trail = await Trail.findById(req.params.id);
    if (!trail) return res.status(404).json({ error: 'Trail not found' });

    if (!trail.contributorId || trail.contributorId.toString() !== user.id) {
      return res.status(403).json({ error: 'You can only delete trails you contributed' });
    }

    await Trail.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trail deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// POST add comment + auto NLP analysis
router.post('/:id/comments', async (req, res) => {
  try {
    const { text, author } = req.body;
    if (!text) return res.status(400).json({ error: 'Comment text required' });

    // Call NLP service
    const nlpResponse = await fetch('http://127.0.0.1:5001/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: text })
    });
    const nlpResult = await nlpResponse.json();

    // Build comment object
    const comment = {
      text,
      author: author || 'Anonymous',
      date: new Date(),
      nlpRisk: nlpResult.risk,
      nlpConfidence: nlpResult.confidence,
      hazardKeywords: nlpResult.hazard_keywords_found
    };

    // Add comment to trail
    const trail = await Trail.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: comment } },
      { new: true }
    );

    res.json({ comment, nlpResult, trail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;