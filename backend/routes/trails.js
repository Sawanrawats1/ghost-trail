const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Trail = require('../models/Trail');
const { calculateHealthScore } = require('../utils/trailHealth');

function getUserFromToken(req) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Attaches computed fields (health score, upvote count, whether the
// requesting user has upvoted) without storing them in the database.
function withComputedFields(trail, currentUserId) {
  const obj = trail.toObject ? trail.toObject() : trail;
  obj.healthScore = calculateHealthScore(obj);
  obj.upvoteCount = obj.upvotedBy?.length || 0;
  obj.hasUpvoted = currentUserId
    ? (obj.upvotedBy || []).some((id) => id.toString() === currentUserId)
    : false;
  return obj;
}

// GET all trails
router.get('/', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    const trails = await Trail.find();
    res.json(trails.map((t) => withComputedFields(t, user?.id)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET trails contributed by the logged-in user (My Trails page)
router.get('/mine', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Login required to view your trails' });

    const trails = await Trail.find({ contributorId: user.id }).sort({ createdAt: -1 });
    res.json(trails.map((t) => withComputedFields(t, user.id)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single trail by ID
router.get('/:id', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    const trail = await Trail.findById(req.params.id);
    if (!trail) return res.status(404).json({ error: 'Trail not found' });
    res.json(withComputedFields(trail, user?.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new trail
router.post('/', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    const trailData = { ...req.body };
    if (user) trailData.contributorId = user.id;

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

    if (!trail.contributorId || trail.contributorId.toString() !== user.id) {
      return res.status(403).json({ error: 'You can only edit trails you contributed' });
    }

    const editableFields = ['name', 'location', 'type', 'difficulty', 'description', 'story', 'challenges'];
    editableFields.forEach(field => {
      if (req.body[field] !== undefined) trail[field] = req.body[field];
    });

    const updated = await trail.save();
    res.json(withComputedFields(updated, user.id));
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
    const user = getUserFromToken(req);
    const trail = await Trail.findByIdAndUpdate(
      req.params.id,
      { lastConfirmedDate: Date.now() },
      { new: true }
    );
    res.json({ message: 'Trail confirmed fresh', trail: withComputedFields(trail, user?.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add comment + auto NLP analysis
router.post('/:id/comments', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    const { text, author } = req.body;
    if (!text) return res.status(400).json({ error: 'Comment text required' });

    const nlpResponse = await fetch('http://127.0.0.1:5001/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: text })
    });
    const nlpResult = await nlpResponse.json();

    const comment = {
      text,
      author: author || 'Anonymous',
      commenterId: user?.id || null,
      date: new Date(),
      nlpRisk: nlpResult.risk,
      nlpConfidence: nlpResult.confidence,
      hazardKeywords: nlpResult.hazard_keywords_found
    };

    const trail = await Trail.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: comment } },
      { new: true }
    );

    res.json({ comment, nlpResult, trail: withComputedFields(trail, user?.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a comment — only the person who posted it can remove it
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Login required' });

    const trail = await Trail.findById(req.params.id);
    if (!trail) return res.status(404).json({ error: 'Trail not found' });

    const comment = trail.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (!comment.commenterId || comment.commenterId.toString() !== user.id) {
      return res.status(403).json({ error: 'You can only delete comments you posted' });
    }

    comment.deleteOne();
    const updated = await trail.save();
    res.json(withComputedFields(updated, user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a photo — the file itself was already uploaded to Cloudinary
// client-side; this just attaches the resulting URL to the trail record.
router.post('/:id/photos', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Login required to add photos' });

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Photo URL required' });

    const photo = { url, uploadedBy: user.name, uploadedById: user.id, date: new Date() };

    const trail = await Trail.findByIdAndUpdate(
      req.params.id,
      { $push: { photos: photo } },
      { new: true }
    );
    if (!trail) return res.status(404).json({ error: 'Trail not found' });

    res.json({ photo, trail: withComputedFields(trail, user.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a photo — only the person who uploaded it can remove it
router.delete('/:id/photos/:photoId', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Login required' });

    const trail = await Trail.findById(req.params.id);
    if (!trail) return res.status(404).json({ error: 'Trail not found' });

    const photo = trail.photos.id(req.params.photoId);
    if (!photo) return res.status(404).json({ error: 'Photo not found' });

    if (!photo.uploadedById || photo.uploadedById.toString() !== user.id) {
      return res.status(403).json({ error: 'You can only delete photos you uploaded' });
    }

    photo.deleteOne();
    const updated = await trail.save();
    res.json(withComputedFields(updated, user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST toggle upvote — each user can upvote once, and can un-upvote by
// calling this again.
router.post('/:id/upvote', async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Login required to upvote' });

    const trail = await Trail.findById(req.params.id);
    if (!trail) return res.status(404).json({ error: 'Trail not found' });

    const alreadyUpvoted = trail.upvotedBy.some((id) => id.toString() === user.id);
    if (alreadyUpvoted) {
      trail.upvotedBy = trail.upvotedBy.filter((id) => id.toString() !== user.id);
    } else {
      trail.upvotedBy.push(user.id);
    }

    const updated = await trail.save();
    res.json(withComputedFields(updated, user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;