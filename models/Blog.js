import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  summary: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  imageFileId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null // GridFS image reference
  },
  tags: {
    type: [String],
    default: []
  },
  published: {
    type: Boolean,
    default: false
  },
  author: {
    type: String,
    default: 'You Say I Deliver Team'
  }
}, {
  timestamps: true
});

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
