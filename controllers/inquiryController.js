import Inquiry from '../models/Inquiry.js';
import nodemailer from 'nodemailer';

// Email Transporter Config
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    auth: {
      user: process.env.SMTP_USER || 'mock_user',
      pass: process.env.SMTP_PASS || 'mock_pass'
    }
  });
};

// Send inquiry notifications to customer and admin
const sendInquiryEmails = async (inquiry) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'yousayideliver0802@gmail.com';
  
  // 1. Mail to Admin
  const adminMailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@yousayideliver.com',
    to: adminEmail,
    subject: `🚨 New Inquiry Request: ${inquiry.name}`,
    html: `
      <h2>You Say I Deliver - New Client Inquiry</h2>
      <p>A new inquiry has been received with the following details:</p>
      <table border="1" cellpadding="8" style="border-collapse: collapse; border-color: #eee;">
        <tr><td><strong>Client Name:</strong></td><td>${inquiry.name}</td></tr>
        <tr><td><strong>Company Name:</strong></td><td>${inquiry.companyName || 'N/A'}</td></tr>
        <tr><td><strong>Email:</strong></td><td>${inquiry.email}</td></tr>
        <tr><td><strong>Location:</strong></td><td>${inquiry.location}</td></tr>
        <tr><td><strong>Phone / Contact:</strong></td><td>${inquiry.phone || 'N/A'}</td></tr>
        <tr><td><strong>Details:</strong></td><td>${inquiry.details}</td></tr>
      </table>
      <p>Please log in to the admin panel to view this inquiry.</p>
    `
  };

  // 2. Mail to Customer
  const customerMailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@yousayideliver.com',
    to: inquiry.email,
    subject: `Inquiry Received: You Say I Deliver`,
    html: `
      <h2>Thank You for Reaching Out, ${inquiry.name}!</h2>
      <p>We have successfully received your project inquiry. Here is a summary of the details received:</p>
      <table border="1" cellpadding="8" style="border-collapse: collapse; border-color: #eee;">
        <tr><td><strong>Location:</strong></td><td>${inquiry.location}</td></tr>
        <tr><td><strong>Details:</strong></td><td>${inquiry.details}</td></tr>
      </table>
      <p>Our team will review your project requirements and contact you within 24 hours.</p>
      <p>Best regards,<br/><strong>You Say I Deliver Team</strong></p>
    `
  };

  const transporter = createTransporter();
  
  // Send Admin Mail
  try {
    await transporter.sendMail(adminMailOptions);
    console.log(`[EMAIL NOTIFICATION] Sent inquiry alert to Admin: ${adminMailOptions.to}`);
  } catch (error) {
    console.warn(`[EMAIL NOTIFICATION MOCK] Could not send real admin email: ${error.message}`);
    console.log(`[EMAIL NOTIFICATION LOG] (To Admin: ${adminMailOptions.to})\nName: ${inquiry.name}, Location: ${inquiry.location}`);
  }

  // Send Customer Mail
  try {
    await transporter.sendMail(customerMailOptions);
    console.log(`[EMAIL NOTIFICATION] Sent inquiry confirmation to Customer: ${customerMailOptions.to}`);
  } catch (error) {
    console.warn(`[EMAIL NOTIFICATION MOCK] Could not send real customer email: ${error.message}`);
    console.log(`[EMAIL NOTIFICATION LOG] (To Customer: ${customerMailOptions.to})\nName: ${inquiry.name}, Email: ${inquiry.email}`);
  }
};

// Send status update notifications to customer and admin
const sendInquiryUpdateEmails = async (inquiry) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'yousayideliver0802@gmail.com';

  // 1. Mail to Customer
  const customerMailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@yousayideliver.com',
    to: inquiry.email,
    subject: `Inquiry Status Update: ${inquiry.status}`,
    html: `
      <h2>Inquiry Status Update</h2>
      <p>Dear ${inquiry.name},</p>
      <p>Your project inquiry status has been updated to: <strong>${inquiry.status}</strong>.</p>
      <p>Our consultant will follow up with you on next steps.</p>
      <p>Best regards,<br/><strong>You Say I Deliver Team</strong></p>
    `
  };

  // 2. Mail to Admin
  const adminMailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@yousayideliver.com',
    to: adminEmail,
    subject: `Inquiry Status Changed: ${inquiry.name} is ${inquiry.status}`,
    html: `
      <h2>Inquiry Status Update Notification</h2>
      <p>The status of the inquiry from ${inquiry.name} (${inquiry.email}) has been changed to: <strong>${inquiry.status}</strong>.</p>
    `
  };

  const transporter = createTransporter();

  // Send Customer Mail
  try {
    await transporter.sendMail(customerMailOptions);
    console.log(`[EMAIL NOTIFICATION] Sent inquiry status update to Customer: ${customerMailOptions.to}`);
  } catch (error) {
    console.warn(`[EMAIL NOTIFICATION MOCK] Could not send real customer update email: ${error.message}`);
  }

  // Send Admin Mail
  try {
    await transporter.sendMail(adminMailOptions);
    console.log(`[EMAIL NOTIFICATION] Sent inquiry status update alert to Admin: ${adminMailOptions.to}`);
  } catch (error) {
    console.warn(`[EMAIL NOTIFICATION MOCK] Could not send real admin update email: ${error.message}`);
  }
};

// Send simulated WhatsApp notification for inquiries
const sendWhatsAppNotification = (inquiry) => {
  const adminWhatsApp = process.env.ADMIN_WHATSAPP_NUMBER || '+919313482177';
  const whatsappMsg = `
📱 *YOU SAY I DELIVER - NEW INQUIRY*
---------------------------------------
👤 *Client:* ${inquiry.name}
🏢 *Company:* ${inquiry.companyName || 'N/A'}
📧 *Email:* ${inquiry.email}
📍 *Location:* ${inquiry.location}
📞 *Phone:* ${inquiry.phone || 'N/A'}
💬 *Details:* ${inquiry.details}
---------------------------------------
Please review this inquiry in the Admin Portal.
`;

  console.log(`
========================================================================
💬 [WHATSAPP NOTIFICATION OUTBOX]
Recipient: ${adminWhatsApp}
Message Content: ${whatsappMsg}
Status: SIMULATED SUCCESSFUL DELIVERY
========================================================================
  `);
};

// @desc    Create a new inquiry
// @route   POST /api/inquiries
// @access  Public
export const createInquiry = async (req, res) => {
  const { name, companyName, email, location, phone, details } = req.body;

  try {
    if (!name || !email || !location || !details) {
      return res.status(400).json({ message: 'Name, email, location, and inquiry details are required' });
    }

    const inquiry = await Inquiry.create({
      name,
      companyName,
      email,
      location,
      phone,
      details
    });

    // Fire notifications asynchronously
    sendInquiryEmails(inquiry);
    sendWhatsAppNotification(inquiry);

    res.status(201).json({
      success: true,
      message: 'Inquiry request received successfully. Outbox notifications dispatched.',
      inquiry
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all inquiries
// @route   GET /api/inquiries
// @access  Private (Admin)
export const getInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.status(200).json(inquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an inquiry status
// @route   PUT /api/inquiries/:id
// @access  Private (Admin)
export const updateInquiry = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    inquiry.status = status;
    const updatedInquiry = await inquiry.save();

    // Fire notifications asynchronously
    sendInquiryUpdateEmails(updatedInquiry);

    res.status(200).json(updatedInquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an inquiry
// @route   DELETE /api/inquiries/:id
// @access  Private (Admin)
export const deleteInquiry = async (req, res) => {
  const { id } = req.params;

  try {
    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    await inquiry.deleteOne();
    res.status(200).json({ message: 'Inquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
