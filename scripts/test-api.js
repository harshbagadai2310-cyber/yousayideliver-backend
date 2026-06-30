import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Niche from '../models/Niche.js';
import Category from '../models/Category.js';

// Setup config
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'http://localhost:5001/api';

const runTests = async () => {
  try {
    console.log('\n🚀 STARTING AUTOMATED API INTEGRATION TEST ROUTINE...');

    // 1. Establish database connection
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yousayideliver');
    console.log('✅ Connected to MongoDB.');

    // 2. Perform Login
    console.log('\n1. Testing Login API...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    if (!loginRes.ok) {
      const errBody = await loginRes.text();
      throw new Error(`Login failed with status ${loginRes.status}: ${errBody}`);
    }
    
    const loginData = await loginRes.json();
    console.log('✅ Admin login succeeded. Session details received.');
    
    // Extract JWT cookie from login response headers to authenticate subsequent calls
    const cookies = loginRes.headers.get('set-cookie');
    const authHeaders = {
      'Cookie': cookies,
      'Authorization': `Bearer ${loginData.token}`
    };

    // 3. GridFS Upload Test
    console.log('\n2. Testing GridFS Media Upload...');
    const logoPath = path.resolve(__dirname, '../Logo.jpeg');
    if (!fs.existsSync(logoPath)) {
      throw new Error(`Logo file not found at ${logoPath}`);
    }
    
    const logoBuffer = fs.readFileSync(logoPath);
    
    // Construct multi-part form data manually for node-fetch
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const filename = 'Logo.jpeg';
    const mimetype = 'image/jpeg';
    
    const bodyHeader = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimetype}\r\n\r\n`;
    const bodyFooter = `\r\n--${boundary}--\r\n`;
    const multipartBody = Buffer.concat([
      Buffer.from(bodyHeader, 'utf-8'),
      logoBuffer,
      Buffer.from(bodyFooter, 'utf-8')
    ]);

    const uploadRes = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: multipartBody
    });

    if (!uploadRes.ok) {
      const errTxt = await uploadRes.text();
      throw new Error(`GridFS upload failed: ${errTxt}`);
    }

    const uploadData = await uploadRes.json();
    const mediaId = uploadData.fileId;
    console.log(`✅ Uploaded "Logo.jpeg" to GridFS. Generated ID: ${mediaId}`);

    // 4. Portfolio Item Creation Test
    console.log('\n3. Testing Portfolio CRUD...');
    
    // Get existing niche and category IDs
    const toursNiche = await Niche.findOne({ name: 'Tours and Travel' });
    const brandKitCategory = await Category.findOne({ name: 'Brand Kit' });
    
    if (!toursNiche || !brandKitCategory) {
      throw new Error('Please run seeding first to establish niches and categories!');
    }

    const portfolioRes = await fetch(`${API_BASE}/portfolio`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Tours and Travel Luxury Portal',
        niche: toursNiche._id,
        category: brandKitCategory._id,
        imageFileId: mediaId,
        description: 'Strategic digital booking interface engineered for boutique travel agencies.'
      })
    });

    if (!portfolioRes.ok) {
      const errTxt = await portfolioRes.text();
      throw new Error(`Portfolio creation failed: ${errTxt}`);
    }

    const portfolioData = await portfolioRes.json();
    console.log(`✅ Portfolio item created: "${portfolioData.title}" referencing GridFS ID.`);

    // 5. Booking Submission Test (triggers notifications)
    console.log('\n4. Testing Public Appointment Booking...');
    const bookingRes = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Connor',
        companyName: 'Cyberdyne Systems',
        email: 'sarah@cyberdyne.com',
        phone: '+91 99887 76655',
        packageInterest: 'The Elite Corporate Scale-Up Mega Combo',
        date: '2026-07-15',
        timeSlot: '10:00 AM - 11:00 AM IST'
      })
    });

    if (!bookingRes.ok) {
      const errTxt = await bookingRes.text();
      throw new Error(`Booking request failed: ${errTxt}`);
    }

    const bookingData = await bookingRes.json();
    console.log(`✅ Public Booking registered for: ${bookingData.booking.name}.`);
    const bookingId = bookingData.booking._id;

    // 6. Booking Confirmation Test
    console.log('\n5. Testing Admin Booking Update (Confirmation)...');
    const confirmRes = await fetch(`${API_BASE}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'Confirmed' })
    });

    if (!confirmRes.ok) {
      const errTxt = await confirmRes.text();
      throw new Error(`Booking confirmation failed: ${errTxt}`);
    }

    const confirmedData = await confirmRes.json();
    console.log(`✅ Booking confirmed. New status: ${confirmedData.status}`);

    console.log('\n============================================================');
    console.log('🎉 ALL INTEGRATION API TESTS COMPLETED SUCCESSFULLY!');
    console.log('============================================================\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('\n❌ API INTEGRATION TEST FAILED:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
