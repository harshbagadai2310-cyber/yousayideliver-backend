import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Niche from '../models/Niche.js';
import Category from '../models/Category.js';
import Blog from '../models/Blog.js';

dotenv.config();

const defaultNiches = [
  'Tours and Travel',
  'Real Estate',
  'Finance & Investment',
  'Healthcare & Medical',
  'Fitness & Athletics',
  'Beauty & Wellness',
  'Restaurant & Fine Dining',
  'E-commerce & Retail',
  'Education & Academy',
  'SaaS & Software',
  'Professional Legal Services',
  'Fashion & Apparel',
  'Architecture & Interior Design',
  'Entertainment & Media',
  'Non-Profit & Charity',
  'Auto & Transportation',
  'Event & Wedding Planning',
  'Pet Care & Veterinary'
];

const defaultCategories = [
  'Logo',
  'Ads Creative',
  'Reel Content',
  'Brand Kit'
];

const defaultServices = [
  {
    title: 'Brand Story & Logo Design',
    phase: 'Phase 1',
    description: 'Perfect for new businesses and growing brands that need a clear direction, a beautiful logo, and a consistent look from day one.',
    price: '₹5,000',
    originalPrice: '₹6,000',
    savings: '₹1,000',
    ctaLabel: 'AUTHORIZE & SETUP BUNDLE',
    features: [
      'Brand Discovery & Research Session: Analyzing your market and competitor designs.',
      'Brand Story & Messaging Plan: Defining your message, voice, and main slogans.',
      'Logo & Icon Design: Creating clean logos, alternative versions, and icons.',
      'Complete Brand Book & File Handoff: Guidelines for fonts, colors, and spacing, with all raw files (AI, SVG, PDF).'
    ]
  },
  {
    title: 'Marketing & Social Media Designs',
    phase: 'Phase 2',
    description: 'Designed for active businesses who want to look professional across social media, printed materials, and advertising campaigns.',
    price: '₹10,000',
    originalPrice: '₹13,000',
    savings: '₹3,000',
    ctaLabel: 'AUTHORIZE & SETUP BUNDLE',
    features: [
      'Business Cards & Stationery Designs: Professional cards, presentation slides, and printed letterheads.',
      'Social Media Profiles & Grid Templates: Clean headers, profile templates, and matching highlights.',
      'High-Converting Social Media Ad Templates: Eye-catching layouts designed to stop feeds and attract clicks.'
    ]
  },
  {
    title: 'Website Design & Development',
    phase: 'Phase 3',
    description: 'Our full website package. We design and build fast, modern, and beautiful websites tailored specifically to help your business grow.',
    price: '₹20,000',
    originalPrice: '₹25,000',
    savings: '₹5,000',
    ctaLabel: 'AUTHORIZE & SETUP BUNDLE',
    features: [
      'Website Layout Planning & Interactive Mockups: Designing easy-to-use layouts focused on guiding visitors to contact you.',
      'Custom Website Development: Building your website with clean code, smooth animations, and contact form setups.',
      'Google Search Optimization & Speed Tuning: Adding search tags, testing load speeds, and completing final launch preparations.'
    ]
  },
  {
    title: 'The Elite Corporate Scale-Up Mega Combo',
    phase: 'Elite',
    description: 'Combine all three phases and our entire 9-step roadmap. Get a unified, professional business identity, beautiful marketing designs, and a custom launch-ready website.',
    price: '₹35,000',
    originalPrice: '₹44,000',
    savings: '₹9,000',
    ctaLabel: 'BOOK FULL PACKAGE',
    features: [
      'Everything in Phases 1, 2, and 3',
      'Dedicated strategy planning & custom 9-step implementation roadmap',
      'MERN Stack full deployment (CMS, custom dashboard, JWT cookies)',
      'Premium custom media integration (GridFS architecture)',
      'Priority ongoing support & strategy sessions (3 months)'
    ]
  }
];

const defaultBlogs = [
  {
    title: 'The Anatomy of a Premium MERN Stack Architecture',
    slug: 'premium-mern-stack-architecture',
    summary: 'Why we choose React and Node.js + GridFS for strategic, highly secure business dashboards.',
    content: '<p>A detailed review of full-stack engineering, secure HttpOnly cookie authentication, and MongoDB GridFS chunked streaming systems.</p><p>Building custom dashboards requires high-performance architectures. Combining React on the frontend and Node/Express on the backend offers excellent async capabilities and responsive rendering. By using MongoDB as both our JSON store and, via GridFS, our image storage host, we maintain a unified cluster, reducing server integration overhead and streamlining security rules.</p>',
    tags: ['MERN', 'Engineering', 'Architecture'],
    published: true,
    author: 'You Say I Deliver Team'
  },
  {
    title: 'Why Brand Kit Matters: Scaling Your Digital ROI',
    slug: 'brand-kit-scaling-roi',
    summary: 'Your visual handbooks and design assets are more than styling. They are conversion drivers.',
    content: '<p>Exploring the business ROI of custom typography, signature color palettes (like deep crimson and off-white cream), and strategic collateral design.</p><p>A premium design kit establishes trust. Customers judge brand credibility within milliseconds of landing. When your visual layout is coherent, uses modern serif titles, elegant grids, and cohesive color accents, you project a professional image that drives sales and secures partnerships.</p>',
    tags: ['Branding', 'ROI', 'Design'],
    published: true,
    author: 'You Say I Deliver Team'
  },
  {
    title: 'Hyper-Local Velocity in Modern Software Deployment',
    slug: 'hyper-local-velocity-deployment',
    summary: 'In fast-moving niches like Tours and Travel or Real Estate, launching early is a major strategic advantage.',
    content: '<p>How automated roadmap execution, wireframing, and boilerplate deployment accelerate project timelines, letting you hit market opportunities before your competitors.</p><p>Velocity is a core business asset. Deploying premium systems early lets companies capture traffic, collect analytical insights, and optimize booking pipelines while competitors are still stuck in planning stages.</p>',
    tags: ['Software Development', 'Velocity', 'Tours and Travel'],
    published: true,
    author: 'You Say I Deliver Team'
  }
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yousayideliver';
    console.log(`Connecting to MongoDB for seeding at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connection established.');

    // 1. Seed Admin User (if none exists)
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: 'admin123' // hashes automatically via pre-save hook
      });
      console.log('✅ Admin user created (username: admin, password: admin123).');
    } else {
      console.log('ℹ️ Admin user already exists. Skipping...');
    }

    // 2. Seed Niches
    console.log('Seeding niches...');
    for (const nicheName of defaultNiches) {
      await Niche.findOneAndUpdate(
        { name: nicheName },
        { name: nicheName },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Seeded ${defaultNiches.length} default niches.`);

    // 3. Seed Categories
    console.log('Seeding categories...');
    for (const catName of defaultCategories) {
      await Category.findOneAndUpdate(
        { name: catName },
        { name: catName },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Seeded ${defaultCategories.length} default categories.`);

    // 4. Seed Services
    console.log('Seeding services...');
    await Service.deleteMany({});
    for (const serviceData of defaultServices) {
      await Service.create(serviceData);
    }
    console.log(`✅ Seeded ${defaultServices.length} pricing packages.`);

    // 5. Seed Blogs
    console.log('Seeding blogs...');
    for (const blogData of defaultBlogs) {
      await Blog.findOneAndUpdate(
        { slug: blogData.slug },
        blogData,
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Seeded ${defaultBlogs.length} default blog posts.`);

    console.log('🎉 Seeding successfully completed!');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seedDatabase();
