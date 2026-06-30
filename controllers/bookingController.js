import Booking from '../models/Booking.js';
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

// Send booking notifications to customer and admin
const sendBookingEmails = async (booking) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'yousayideliver0802@gmail.com';
  
  // 1. Mail to Admin
  const adminMailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@yousayideliver.com',
    to: adminEmail,
    subject: `🚨 New Booking Request: ${booking.name}`,
    html: `
      <h2>You Say I Deliver - New Appointment Booking</h2>
      <p>A new appointment has been scheduled with the following details:</p>
      <table border="1" cellpadding="8" style="border-collapse: collapse; border-color: #eee;">
        <tr><td><strong>Client Name:</strong></td><td>${booking.name}</td></tr>
        <tr><td><strong>Company Name:</strong></td><td>${booking.companyName || 'N/A'}</td></tr>
        <tr><td><strong>Email:</strong></td><td>${booking.email}</td></tr>
        <tr><td><strong>Phone / Contact:</strong></td><td>${booking.phone}</td></tr>
        <tr><td><strong>Package Interest:</strong></td><td>${booking.packageInterest}</td></tr>
        <tr><td><strong>Date:</strong></td><td>${booking.date}</td></tr>
        <tr><td><strong>Time Slot:</strong></td><td>${booking.timeSlot}</td></tr>
      </table>
      <p>Please log in to the admin panel to manage or confirm this request.</p>
    `
  };

  // 2. Mail to Customer
  const customerMailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@yousayideliver.com',
    to: booking.email,
    subject: `Booking Request Confirmed: You Say I Deliver`,
    html: `
      <h2>Thank You for Booking, ${booking.name}!</h2>
      <p>We have successfully received your strategic strategy session request. Here are the booking details:</p>
      <table border="1" cellpadding="8" style="border-collapse: collapse; border-color: #eee;">
        <tr><td><strong>Package Interest:</strong></td><td>${booking.packageInterest}</td></tr>
        <tr><td><strong>Date:</strong></td><td>${booking.date}</td></tr>
        <tr><td><strong>Time Slot:</strong></td><td>${booking.timeSlot}</td></tr>
      </table>
      <p>Our lead strategist will review your details and send you the Google Meet calendar invitation soon.</p>
      <p>Best regards,<br/><strong>You Say I Deliver Team</strong></p>
    `
  };

  const transporter = createTransporter();
  
  // Send Admin Mail
  try {
    await transporter.sendMail(adminMailOptions);
    console.log(`[EMAIL NOTIFICATION] Sent booking alert to Admin: ${adminMailOptions.to}`);
  } catch (error) {
    console.warn(`[EMAIL NOTIFICATION MOCK] Could not send real admin email: ${error.message}`);
    console.log(`[EMAIL NOTIFICATION LOG] (To Admin: ${adminMailOptions.to})\nName: ${booking.name}, Date: ${booking.date}`);
  }

  // Send Customer Mail
  try {
    await transporter.sendMail(customerMailOptions);
    console.log(`[EMAIL NOTIFICATION] Sent booking confirmation to Customer: ${customerMailOptions.to}`);
  } catch (error) {
    console.warn(`[EMAIL NOTIFICATION MOCK] Could not send real customer email: ${error.message}`);
    console.log(`[EMAIL NOTIFICATION LOG] (To Customer: ${customerMailOptions.to})\nName: ${booking.name}, Date: ${booking.date}`);
  }
};

// Send status update notifications to customer and admin
const sendBookingUpdateEmails = async (booking) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'yousayideliver0802@gmail.com';

  // 1. Mail to Customer
  const customerMailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@yousayideliver.com',
    to: booking.email,
    subject: `Strategy Session Status: ${booking.status}`,
    html: `
      <h2>Strategy Session Update</h2>
      <p>Dear ${booking.name},</p>
      <p>The status of your appointment request for <strong>${booking.date}</strong> at <strong>${booking.timeSlot}</strong> has been updated to: <strong>${booking.status}</strong>.</p>
      ${booking.status === 'Confirmed' ? '<p>We look forward to speaking with you! The session coordinator will send calendar invitations shortly.</p>' : ''}
      <p>Best regards,<br/><strong>You Say I Deliver Team</strong></p>
    `
  };

  // 2. Mail to Admin
  const adminMailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@yousayideliver.com',
    to: adminEmail,
    subject: `Booking Status Changed: ${booking.name} is ${booking.status}`,
    html: `
      <h2>Booking Status Update Notification</h2>
      <p>The status of the booking request for ${booking.name} (${booking.email}) has been changed to: <strong>${booking.status}</strong>.</p>
    `
  };

  const transporter = createTransporter();

  // Send Customer Mail
  try {
    await transporter.sendMail(customerMailOptions);
    console.log(`[EMAIL NOTIFICATION] Sent booking status update to Customer: ${customerMailOptions.to}`);
  } catch (error) {
    console.warn(`[EMAIL NOTIFICATION MOCK] Could not send real customer update email: ${error.message}`);
  }

  // Send Admin Mail
  try {
    await transporter.sendMail(adminMailOptions);
    console.log(`[EMAIL NOTIFICATION] Sent booking status update alert to Admin: ${adminMailOptions.to}`);
  } catch (error) {
    console.warn(`[EMAIL NOTIFICATION MOCK] Could not send real admin update email: ${error.message}`);
  }
};

// Send simulated WhatsApp notification
const sendWhatsAppNotification = (booking) => {
  const adminWhatsApp = process.env.ADMIN_WHATSAPP_NUMBER || '+919876543210';
  const whatsappMsg = `
📱 *YOU SAY I DELIVER - NEW BOOKING*
---------------------------------------
👤 *Client:* ${booking.name}
🏢 *Company:* ${booking.companyName || 'N/A'}
📧 *Email:* ${booking.email}
📞 *Phone:* ${booking.phone}
📦 *Interest:* ${booking.packageInterest}
📅 *Date:* ${booking.date}
⏰ *Time Slot:* ${booking.timeSlot}
---------------------------------------
Please approve this booking from the Admin Portal.
`;

  // Log in a highly visible visual panel in the console
  console.log(`
========================================================================
💬 [WHATSAPP NOTIFICATION OUTBOX]
Recipient: ${adminWhatsApp}
Message Content: ${whatsappMsg}
Status: SIMULATED SUCCESSFUL DELIVERY
========================================================================
  `);
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public
export const createBooking = async (req, res) => {
  const { name, companyName, email, phone, packageInterest, date, timeSlot } = req.body;

  try {
    if (!name || !email || !phone || !packageInterest || !date || !timeSlot) {
      return res.status(400).json({ message: 'All booking fields are required except company name' });
    }

    const booking = await Booking.create({
      name,
      companyName,
      email,
      phone,
      packageInterest,
      date,
      timeSlot
    });

    // Fire notifications asynchronously
    sendBookingEmails(booking);
    sendWhatsAppNotification(booking);

    res.status(201).json({
      success: true,
      message: 'Booking request received successfully. Notifications have been dispatched.',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private (Admin)
export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a booking status
// @route   PUT /api/bookings/:id
// @access  Private (Admin)
export const updateBooking = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    const updatedBooking = await booking.save();

    // Fire notifications asynchronously
    sendBookingUpdateEmails(updatedBooking);

    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin)
export const deleteBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await booking.deleteOne();
    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
