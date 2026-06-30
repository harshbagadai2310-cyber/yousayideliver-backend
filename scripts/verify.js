import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../models/Booking.js';
import PortfolioItem from '../models/PortfolioItem.js';
import Niche from '../models/Niche.js';
import Category from '../models/Category.js';

dotenv.config();

const verifyData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yousayideliver';
    await mongoose.connect(mongoUri);
    console.log('\n================ DATABASE VERIFICATION DUMP ================');

    // 1. Check GridFS Files
    const db = mongoose.connection.db;
    const filesCollection = db.collection('uploads.files');
    const files = await filesCollection.find().toArray();
    console.log(`📁 GridFS Files Count: ${files.length}`);
    files.forEach(f => {
      console.log(`  - File: ${f.filename} (${(f.length / 1024 / 1024).toFixed(2)} MB), Type: ${f.contentType}, ID: ${f._id}`);
    });

    // 2. Check Portfolio Items
    const items = await PortfolioItem.find().populate('niche').populate('category');
    console.log(`💼 Portfolio Items Count: ${items.length}`);
    items.forEach(i => {
      console.log(`  - Project: "${i.title}" | Niche: "${i.niche?.name}" | Category: "${i.category?.name}" | GridFS Image: ${i.imageFileId}`);
    });

    // 3. Check Bookings
    const bookings = await Booking.find();
    console.log(`📅 Bookings Count: ${bookings.length}`);
    bookings.forEach(b => {
      console.log(`  - Client: ${b.name} (${b.companyName}) | Email: ${b.email} | Package: ${b.packageInterest} | Date: ${b.date} | Slot: ${b.timeSlot} | Status: ${b.status}`);
    });

    console.log('============================================================\n');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Verification failed:', error);
  }
};

verifyData();
