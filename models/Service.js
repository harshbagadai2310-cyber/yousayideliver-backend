import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  phase: {
    type: String,
    required: true,
    enum: ['Phase 1', 'Phase 2', 'Phase 3', 'Elite'],
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  originalPrice: {
    type: String,
    default: ''
  },
  savings: {
    type: String,
    default: ''
  },
  features: {
    type: [String],
    default: []
  },
  ctaLabel: {
    type: String,
    default: 'Book Now'
  }
}, {
  timestamps: true
});

const Service = mongoose.model('Service', serviceSchema);
export default Service;
