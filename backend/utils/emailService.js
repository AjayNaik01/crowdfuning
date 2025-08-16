const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, name) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Email Verification OTP - Crowdfunding Platform',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with our crowdfunding platform. Please use the following OTP to verify your email address:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <p>Best regards,<br>Crowdfunding Team</p>
        </div>
      `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('Email sending failed:', error);

        // Check if it's a fake email error
        if (error.code === 'EAUTH' || error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
            throw new Error('Invalid email address or email service not available');
        }

        // Check for specific email validation errors
        if (error.message.includes('Invalid recipient') || error.message.includes('550')) {
            throw new Error('Invalid email address. Please provide a valid email.');
        }

        throw new Error('Failed to send verification email. Please try again.');
    }
};

// Verify email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Send donor notification email with exact notification content
const sendDonorNotificationEmail = async (email, name, notification) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Notification: ${notification.type ? notification.type.toUpperCase() : 'Notification'} - ${notification.campaignTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
                  <div style="margin-bottom: 16px;">
                    <span style="display: inline-block; background: #fef3c7; color: #b45309; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">${notification.type ? notification.type.toUpperCase() : ''}</span>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <span style="color: #6366f1; font-weight: bold;">Campaign:</span> <span style="color: #3730a3; font-weight: bold; text-decoration: underline;">${notification.campaignTitle}</span>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <span style="color: #374151;">Document:</span> <a href="${notification.documentUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">${notification.documentTitle}</a>
                  </div>
                  <div style="margin-bottom: 16px; color: #111827; font-weight: 500;">${notification.message}</div>
                  <div style="color: #6b7280; font-size: 13px;">${notification.date}</div>
                  ${notification.voteUrl ? `<div style="margin-top: 20px;"><a href="${notification.voteUrl}" style="background: #6366f1; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Review & Vote</a></div>` : ''}
                </div>
            `
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Donor notification email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Donor notification email failed:', error);
        throw new Error('Failed to send donor notification email.');
    }
};

// Generic email sending function
const sendEmail = async (email, subject, htmlContent) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: subject,
            html: htmlContent
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email sending failed:', error);
        throw new Error('Failed to send email.');
    }
};

module.exports = {
    sendOTPEmail,
    generateOTP,
    isValidEmail,
    sendDonorNotificationEmail,
    sendEmail
}; 