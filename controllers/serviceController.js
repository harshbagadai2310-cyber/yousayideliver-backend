import Service from '../models/Service.js';

// @desc    Get all services
// @route   GET /api/services
// @access  Public
export const getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ phase: 1, createdAt: 1 });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new service/bundle
// @route   POST /api/services
// @access  Private (Admin)
export const createService = async (req, res) => {
  const { title, phase, description, price, features, ctaLabel } = req.body;

  try {
    if (!title || !phase || !description || !price) {
      return res.status(400).json({ message: 'Title, phase, description, and price are required' });
    }

    const service = await Service.create({
      title,
      phase,
      description,
      price,
      features: features || [],
      ctaLabel: ctaLabel || 'Book Now'
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a service/bundle
// @route   PUT /api/services/:id
// @access  Private (Admin)
export const updateService = async (req, res) => {
  const { id } = req.params;
  const { title, phase, description, price, features, ctaLabel } = req.body;

  try {
    let service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    service.title = title || service.title;
    service.phase = phase || service.phase;
    service.description = description || service.description;
    service.price = price !== undefined ? price : service.price;
    service.features = features || service.features;
    service.ctaLabel = ctaLabel || service.ctaLabel;

    const updatedService = await service.save();
    res.status(200).json(updatedService);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a service/bundle
// @route   DELETE /api/services/:id
// @access  Private (Admin)
export const deleteService = async (req, res) => {
  const { id } = req.params;

  try {
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    await service.deleteOne();
    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
