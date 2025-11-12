// server/routes/planner.js
const express = require('express');
const axios = require('axios');
const auth = require('../middleware/authMiddleware');
const Trip = require('../models/Trip');

const router = express.Router();

// helper: call Gemini once with long timeout
async function callGeminiOnce(endpoint, prompt, timeoutMs = 120000) {
  const resp = await axios.post(
    endpoint,
    { contents: [{ parts: [{ text: prompt }] }] },
    {
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: timeoutMs
    }
  );
  return resp;
}

// helper: retry wrapper
async function callGeminiWithRetry(endpoint, prompt, attempts = 5) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const resp = await callGeminiOnce(endpoint, prompt, 120000);
      return resp;
    } catch (e) {
      lastErr = e;
      const status = e.response?.status;
      console.warn(`Gemini attempt ${i + 1} failed, status=${status}, msg=${e.message}`);
      if (status && status >= 400 && status < 500) break; // don't retry 4xx
      const waitMs = 1000 * Math.pow(2, i);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
  throw lastErr;
}

// utility: extract text safely from API response
function extractTextFromResponse(response) {
  return (
    response?.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    response?.data?.candidates?.[0]?.content?.text ||
    response?.data?.outputs?.[0]?.content?.[0]?.text ||
    null
  );
}

// POST /generate - create a new trip (calls Gemini)
router.post('/generate', auth, async (req, res) => {
  const { destination, startDate, endDate, budget, preferences } = req.body || {};
  if (!destination || !startDate || !endDate) return res.status(400).json({ error: 'Missing required fields' });

  const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
  const prompt = `Plan a ${days}-day trip to ${destination}.
Budget: ${budget || 'not specified'} USD.
Preferences: ${preferences || 'none'}.
Provide a day-by-day itinerary, estimated cost, transport suggestions and a short packing list.`;

  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('placeholder')) {
      const aiText = `Mock plan for ${destination} (${days} days). Day 1: Arrival. Day 2: Sightseeing.`;
      const trip = new Trip({ user: req.userId, destination, startDate, endDate, budget, preferences, aiPlan: aiText, fallbackReason: 'mock' });
      await trip.save();
      return res.json({ trip, fallback: true });
    }

    const endpoint = process.env.GEMINI_ENDPOINT;
    if (!endpoint) return res.status(500).json({ error: 'GEMINI_ENDPOINT not configured' });

    let aiText = null;
    try {
      const response = await callGeminiWithRetry(endpoint, prompt, 5);
      aiText = extractTextFromResponse(response);
      if (!aiText) throw new Error('No text returned by Gemini');
    } catch (e) {
      console.error('Gemini final error:', {
        message: e.message,
        status: e.response?.status,
        data: e.response?.data
      });
      aiText = `Fallback plan for ${destination} (${days} days).\nAI temporarily unavailable — here's a starter plan:\nDay 1: Arrival.\nDay 2: Sightseeing.`;
      const trip = new Trip({
        user: req.userId,
        destination,
        startDate,
        endDate,
        budget,
        preferences,
        aiPlan: aiText,
        fallbackReason: e.response?.status || 'AI error'
      });
      await trip.save();
      return res.json({ trip, fallback: true });
    }

    const trip = new Trip({ user: req.userId, destination, startDate, endDate, budget, preferences, aiPlan: aiText });
    await trip.save();
    res.json({ trip, fallback: false });
  } catch (err) {
    console.error('Planner server error:', err);
    res.status(500).json({ error: 'Server error in planner', detail: err.message });
  }
});

// GET /mytrips - fetch user's trips
router.get('/mytrips', auth, async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({ trips });
  } catch (err) {
    console.error('My trips error:', err);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// DELETE /:id - delete trip
router.delete('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.user.toString() !== req.userId) return res.status(403).json({ error: 'Not authorized' });
    await Trip.deleteOne({ _id: trip._id });
    return res.json({ message: 'Trip deleted' });
  } catch (err) {
    console.error('Delete trip error:', err);
    return res.status(500).json({ error: 'Failed to delete trip' });
  }
});

// PUT /:id - edit trip, or regenerate if regenerate=true
router.put('/:id', auth, async (req, res) => {
  const { destination, startDate, endDate, budget, preferences, aiPlan, regenerate } = req.body || {};
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.user.toString() !== req.userId) return res.status(403).json({ error: 'Not authorized' });

    // If regenerate is requested, call Gemini; otherwise just update fields and save
    if (regenerate) {
      // Build a prompt - prefer using user's updated data if provided
      const dest = destination || trip.destination;
      const sDate = startDate || trip.startDate;
      const eDate = endDate || trip.endDate;
      const bdg = budget || trip.budget;
      const prefs = preferences || trip.preferences;

      const days = Math.max(1, Math.ceil((new Date(eDate) - new Date(sDate)) / (1000 * 60 * 60 * 24)));
      const prompt = `Plan a ${days}-day trip to ${dest}.
Budget: ${bdg || 'not specified'} USD.
Preferences: ${prefs || 'none'}.
Provide a day-by-day itinerary, estimated cost, transport suggestions and a short packing list.`;

      try {
        const endpoint = process.env.GEMINI_ENDPOINT;
        if (!endpoint) return res.status(500).json({ error: 'GEMINI_ENDPOINT not configured' });

        const response = await callGeminiWithRetry(endpoint, prompt, 5);
        const newAiText = extractTextFromResponse(response) || `Fallback plan for ${dest} (${days} days).`;

        // update trip with new aiPlan and any other provided fields
        trip.destination = dest;
        trip.startDate = sDate;
        trip.endDate = eDate;
        trip.budget = bdg;
        trip.preferences = prefs;
        trip.aiPlan = newAiText;
        trip.fallbackReason = null;
        await trip.save();

        return res.json({ trip, regenerated: true });
      } catch (e) {
        console.error('Regenerate error:', e.response?.data || e.message);
        return res.status(500).json({ error: 'Regenerate failed', detail: e.response?.data || e.message });
      }
    } else {
      // simple update: only save provided fields (or keep existing)
      if (destination !== undefined) trip.destination = destination;
      if (startDate !== undefined) trip.startDate = startDate;
      if (endDate !== undefined) trip.endDate = endDate;
      if (budget !== undefined) trip.budget = budget;
      if (preferences !== undefined) trip.preferences = preferences;
      if (aiPlan !== undefined) trip.aiPlan = aiPlan; // allow manual edits to aiPlan
      await trip.save();
      return res.json({ trip });
    }
  } catch (err) {
    console.error('Update trip error:', err);
    return res.status(500).json({ error: 'Failed to update trip' });
  }
});

module.exports = router;
