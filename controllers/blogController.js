import Blog from '../models/Blog.js';
import mongoose from 'mongoose';

// Helper function to slugify text
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove non-word chars
    .replace(/[\s_-]+/g, '-')     // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens
};

// @desc    Get all published blogs
// @route   GET /api/blogs
// @access  Public
export const getPublishedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true }).sort({ createdAt: -1 });

    const fileIds = blogs.map(b => b.imageFileId).filter(id => id != null);
    const db = mongoose.connection.db;
    const filesCollection = db.collection('uploads.files');
    const files = await filesCollection.find({ _id: { $in: fileIds } }).toArray();

    const fileMap = {};
    files.forEach(f => {
      fileMap[f._id.toString()] = { contentType: f.contentType, filename: f.filename };
    });

    const enrichedBlogs = blogs.map(b => {
      const bObj = b.toObject();
      bObj.mediaInfo = bObj.imageFileId && fileMap[bObj.imageFileId.toString()] ? fileMap[bObj.imageFileId.toString()] : null;
      return bObj;
    });

    res.status(200).json(enrichedBlogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single blog by slug
// @route   GET /api/blogs/post/:slug
// @access  Public
export const getBlogBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Check if draft and request is by guest
    // Note: If admin is viewing, we could allow draft view, but keeping it simple.
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all blogs (including drafts)
// @route   GET /api/blogs/all
// @access  Private (Admin)
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });

    const fileIds = blogs.map(b => b.imageFileId).filter(id => id != null);
    const db = mongoose.connection.db;
    const filesCollection = db.collection('uploads.files');
    const files = await filesCollection.find({ _id: { $in: fileIds } }).toArray();

    const fileMap = {};
    files.forEach(f => {
      fileMap[f._id.toString()] = { contentType: f.contentType, filename: f.filename };
    });

    const enrichedBlogs = blogs.map(b => {
      const bObj = b.toObject();
      bObj.mediaInfo = bObj.imageFileId && fileMap[bObj.imageFileId.toString()] ? fileMap[bObj.imageFileId.toString()] : null;
      return bObj;
    });

    res.status(200).json(enrichedBlogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new blog post
// @route   POST /api/blogs
// @access  Private (Admin)
export const createBlog = async (req, res) => {
  const { title, summary, content, imageFileId, tags, published, author } = req.body;

  try {
    if (!title || !summary || !content) {
      return res.status(400).json({ message: 'Title, summary, and content are required' });
    }

    // Generate unique slug
    let baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;
    while (await Blog.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const blog = await Blog.create({
      title,
      slug,
      summary,
      content,
      imageFileId: imageFileId || null,
      tags: tags || [],
      published: published !== undefined ? published : false,
      author: author || 'You Say I Deliver Team'
    });

    const blogObj = blog.toObject();
    if (blogObj.imageFileId) {
      const db = mongoose.connection.db;
      const file = await db.collection('uploads.files').findOne({ _id: blogObj.imageFileId });
      if (file) {
        blogObj.mediaInfo = { contentType: file.contentType, filename: file.filename };
      }
    }

    res.status(201).json(blogObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a blog post
// @route   PUT /api/blogs/:id
// @access  Private (Admin)
export const updateBlog = async (req, res) => {
  const { id } = req.params;
  const { title, summary, content, imageFileId, tags, published, author, slug } = req.body;

  try {
    let blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Update slug if title changed or custom slug provided
    if (title && title !== blog.title && !slug) {
      let baseSlug = slugify(title);
      let newSlug = baseSlug;
      let counter = 1;
      while (await Blog.findOne({ slug: newSlug, _id: { $ne: id } })) {
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      blog.slug = newSlug;
    } else if (slug && slug !== blog.slug) {
      let finalSlug = slugify(slug);
      const exists = await Blog.findOne({ slug: finalSlug, _id: { $ne: id } });
      if (exists) {
        return res.status(400).json({ message: 'Custom slug is already in use by another article' });
      }
      blog.slug = finalSlug;
    }

    blog.title = title || blog.title;
    blog.summary = summary || blog.summary;
    blog.content = content || blog.content;
    if (imageFileId !== undefined) {
      blog.imageFileId = imageFileId;
    }
    blog.tags = tags || blog.tags;
    blog.published = published !== undefined ? published : blog.published;
    blog.author = author || blog.author;

    const updatedBlog = await blog.save();
    
    const blogObj = updatedBlog.toObject();
    if (blogObj.imageFileId) {
      const db = mongoose.connection.db;
      const file = await db.collection('uploads.files').findOne({ _id: blogObj.imageFileId });
      if (file) {
        blogObj.mediaInfo = { contentType: file.contentType, filename: file.filename };
      }
    }

    res.status(200).json(blogObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a blog post
// @route   DELETE /api/blogs/:id
// @access  Private (Admin)
export const deleteBlog = async (req, res) => {
  const { id } = req.params;

  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    await blog.deleteOne();
    res.status(200).json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
