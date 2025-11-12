const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  destination: String,
  startDate: Date,
  endDate: Date,
  budget: Number,
  preferences: String,
  aiPlan: String,
  fallbackReason: String // optional: 'mock', '503', etc.
}, { timestamps: true });

module.exports = mongoose.model('Trip', TripSchema);
