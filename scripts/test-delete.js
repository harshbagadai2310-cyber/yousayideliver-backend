import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../models/Booking.js';
import PortfolioItem from '../models/PortfolioItem.js';
import Niche from '../models/Niche.js';
import Category from '../models/Category.js';

dotenv.config();

const API_BASE = 'http://localhost:5001/api';

const runDeleteTests = async () => {
  try {
    console.log('\n🚀 RUNNING DELETE INTEGRATION TESTS...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yousayideliver');

    // Establish auth token
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    const cookies = loginRes.headers.get('set-cookie');
    const authHeaders = {
      'Cookie': cookies,
      'Authorization': `Bearer ${loginData.token}`
    };

    // 1. Create a dummy Booking and Delete it
    console.log('Testing Booking delete...');
    const dummyBooking = await Booking.create({
      name: 'Delete Test Client',
      email: 'test@delete.com',
      phone: '1234567890',
      packageInterest: 'Phase 1: Brand Strategy & Identity Core',
      date: '2026-08-01',
      timeSlot: '10:00 AM - 11:00 AM IST'
    });
    
    const delBookingRes = await fetch(`${API_BASE}/bookings/${dummyBooking._id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    if (!delBookingRes.ok) {
      throw new Error(`Failed to delete booking: ${await delBookingRes.text()}`);
    }
    console.log('✅ Booking delete successful.');

    // 2. Create a dummy PortfolioItem, Niche, Category and Delete them
    console.log('Testing Portfolio, Niche, and Category delete...');
    const dummyNiche = await Niche.create({ name: 'Delete Niche Test' });
    const dummyCat = await Category.create({ name: 'Delete Cat Test' });
    const dummyProject = await PortfolioItem.create({
      title: 'Delete Project Test',
      niche: dummyNiche._id,
      category: dummyCat._id
    });

    // Try deleting project
    const delProjRes = await fetch(`${API_BASE}/portfolio/${dummyProject._id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    if (!delProjRes.ok) {
      throw new Error(`Failed to delete portfolio project: ${await delProjRes.text()}`);
    }
    console.log('✅ Portfolio Item delete successful.');

    // Try deleting niche
    const delNicheRes = await fetch(`${API_BASE}/portfolio/niches/${dummyNiche._id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    if (!delNicheRes.ok) {
      throw new Error(`Failed to delete niche: ${await delNicheRes.text()}`);
    }
    console.log('✅ Niche tag delete successful.');

    // Try deleting category
    const delCatRes = await fetch(`${API_BASE}/portfolio/categories/${dummyCat._id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    if (!delCatRes.ok) {
      throw new Error(`Failed to delete category: ${await delCatRes.text()}`);
    }
    console.log('✅ Category tag delete successful.');

    console.log('🎉 ALL DELETE TESTS COMPLETED SUCCESSFULLY!\n');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ DELETE TEST FAILED:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runDeleteTests();
