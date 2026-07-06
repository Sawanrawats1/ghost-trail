const mongoose = require('mongoose');

const WaypointSchema = new mongoose.Schema({
  order:       { type: Number, required: true },
  title:       { type: String, required: true },
  description: { type: String, required: true },
  lat:         { type: Number },
  lng:         { type: Number },
  photo_url:   { type: String }
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
  lastConfirmedDate: { type: Date, default: Date.now },
  createdBy:         { type: String },
  totalVisitors:     { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Trail', TrailSchema);