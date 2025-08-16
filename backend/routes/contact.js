const express = require('express');
const router = express.Router();
const { sendEmail, isValidEmail } = require('../utils/emailService');

// POST /api/contact
router.post('/', async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email address.' });
    }
    try {
        const subject = `Contact Form Submission from ${name}`;
        const htmlContent = `
      <div style="font-family: Arial, sans-serif;">
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      </div>
    `;
        await sendEmail(process.env.EMAIL_FROM, subject, htmlContent);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

module.exports = router; 