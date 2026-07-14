const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Reusable transporter — uses Gmail with an App Password (NOT your regular
// Gmail password). Set EMAIL_USER and EMAIL_APP_PASSWORD in your .env.
// To create an App Password: Google Account > Security > 2-Step Verification
// (must be ON) > App passwords > generate one for "Mail".
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

function requireUser(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('No token');
  return jwt.verify(token, process.env.JWT_SECRET);
}

// POST /api/sos/alert — sends a real email to the user's emergency contact
// with their live GPS location, a Google Maps link, and a timestamp.
router.post('/alert', async (req, res) => {
  try {
    const decoded = requireUser(req);
    const { lat, lng, accuracy } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.emergencyContactEmail) {
      return res.status(400).json({ error: 'No emergency contact set. Please add one first.' });
    }

    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    await transporter.sendMail({
      from: `"Ghost Trail SOS" <${process.env.EMAIL_USER}>`,
      to: user.emergencyContactEmail,
      subject: `🆘 SOS Alert from ${user.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #A32D2D; color: #fff; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h2 style="margin: 0;">🆘 Emergency Alert</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
            <p><strong>${user.name}</strong> has triggered an SOS alert on Ghost Trail and may need help.</p>
            <p><strong>Time:</strong> ${timestamp} (IST)</p>
            <p><strong>Location accuracy:</strong> ±${accuracy || 'unknown'} meters</p>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${mapsLink}" style="background: #27500A; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                View live location on Google Maps
              </a>
            </p>
            <p style="font-size: 12px; color: #888;">
              This is an automated message sent because you are listed as ${user.name}'s emergency contact on Ghost Trail.
              If this seems urgent and you cannot reach them, consider contacting local emergency services.
            </p>
          </div>
        </div>
      `
    });

    res.json({ message: `Alert sent to ${user.emergencyContactName || user.emergencyContactEmail}` });
  } catch (err) {
    console.error('SOS alert failed:', err.message);
    res.status(500).json({ error: 'Failed to send SOS alert. Please try calling 112 directly.' });
  }
});

module.exports = router;