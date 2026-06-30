import mongoose from 'mongoose';

let gridFSBucket = null;

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yousayideliver');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    const db = mongoose.connection.db;
    gridFSBucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'uploads'
    });
    console.log('GridFS Bucket "uploads" successfully initialized.');
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export const getGridFSBucket = () => {
  if (!gridFSBucket) {
    throw new Error('GridFS Bucket is not initialized. Call connectDB first.');
  }
  return gridFSBucket;
};
