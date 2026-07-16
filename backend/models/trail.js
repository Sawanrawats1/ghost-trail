const mongoose = require('mongoose');

const WaypointSchema = new mongoose.Schema({
  order:       { type: Number, required: true },
  title:       { type: String, required: true },
  description: { type: String, required: true },
  lat:         { type: Number },
  lng:         { type: Number },
  photo_url:   { type: String }
});

const CommentSchema = new mongoose.Schema({
  text:           { type: String, required: true },
  author:         { type: String, default: 'Anonymous' },
  // Tracks who posted it (by account), so only that user can delete it later
  commenterId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  date:           { type: Date, default: Date.now },
  nlpRisk:        { type: String, enum: ['clear', 'caution', 'needs_review'] },
  nlpConfidence:  { type: Number },
  hazardKeywords: [{ type: String }]
});

// A visitor-submitted photo — proves the trail is real and shows current
// conditions. Hosted on Cloudinary; only the resulting URL is stored here.
const PhotoSchema = new mongoose.Schema({
  url:            { type: String, required: true },
  uploadedBy:     { type: String, default: 'Anonymous' },
  // Tracks who uploaded it (by account) so only that user can delete it later —
  // separate from the display name above, which could theoretically collide.
  uploadedById:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  date:           { type: Date, default: Date.now }
});

const TrailSchema = new mongoose.Schema({
  name:              { type: String, required: true },
  location:          { type: String, required: true },
  type:              { type: String, enum: ['waterfall','lake','cave','meadow','river','summit','other'] },
  difficulty:        { type: String, enum: ['easy','moderate','hard'] },
  description:       { type: String },
  story:             { type: String },
  challenges:        { type: String },
  waypoints:         [WaypointSchema],
  comments:          [CommentSchema],
  photos:            [PhotoSchema],
  upvotedBy:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastConfirmedDate: { type: Date, default: Date.now },
  createdBy:         { type: String },
  contributorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  totalVisitors:     { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Trail', TrailSchema);