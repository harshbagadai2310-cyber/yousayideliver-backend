import mongoose from 'mongoose';

const portfolioItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  niche: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Niche',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  imageFileId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null // Points to the GridFS bucket file ID
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const PortfolioItem = mongoose.model('PortfolioItem', portfolioItemSchema);
export default PortfolioItem;
