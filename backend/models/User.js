const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  bio:       { type: String, default: '' },
  trailsAdded: { type: Number, default: 0 },
  // Emergency contact — who gets alerted when SOS is triggered
  emergencyContactName:  { type: String, default: '' },
  emergencyContactEmail: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);