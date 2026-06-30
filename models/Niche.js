import mongoose from 'mongoose';

const nicheSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, {
  timestamps: true
});

const Niche = mongoose.model('Niche', nicheSchema);
export default Niche;
