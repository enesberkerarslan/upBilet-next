const venueStructureService = require('../../services/admin/venueStructure.service');

// Create a new venue structure
exports.createVenueStructure = async (req, res) => {
  try {
    const venueStructure = await venueStructureService.createVenueStructure(req.body);
    res.status(201).json(venueStructure);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all venue structures
exports.getAllVenueStructures = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await venueStructureService.getAllVenueStructures(page, limit);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get venue structure by ID
exports.getVenueStructureById = async (req, res) => {
  try {
    const venueStructure = await venueStructureService.getVenueStructureById(req.params.id);
    res.status(200).json(venueStructure);
  } catch (error) {
    res.status(error.message === 'Venue structure not found' ? 404 : 500)
      .json({ message: error.message });
  }
};

// Get venue structure by venue ID
exports.getVenueStructureByVenueId = async (req, res) => {
  try {
    const venueStructure = await venueStructureService.getVenueStructureByVenueId(req.params.venueId);
    res.status(200).json(venueStructure);
  } catch (error) {
    res.status(error.message === 'Venue structure not found for this venue' ? 404 : 500)
      .json({ message: error.message });
  }
};

// Update venue structure
exports.updateVenueStructure = async (req, res) => {
  try {
    const venueStructure = await venueStructureService.updateVenueStructure(req.params.id, req.body);
    res.status(200).json(venueStructure);
  } catch (error) {
    res.status(error.message === 'Venue structure not found' ? 404 : 400)
      .json({ message: error.message });
  }
};

// Delete venue structure
exports.deleteVenueStructure = async (req, res) => {
  try {
    await venueStructureService.deleteVenueStructure(req.params.id);
    res.status(200).json({ message: 'Venue structure deleted successfully' });
  } catch (error) {
    res.status(error.message === 'Venue structure not found' ? 404 : 500)
      .json({ message: error.message });
  }
};

// Add category to venue structure
exports.addCategory = async (req, res) => {
  try {
    const venueStructure = await venueStructureService.addCategory(
      req.params.id,
      req.body
    );
    res.status(200).json(venueStructure);
  } catch (error) {
    res.status(error.message === 'Venue structure not found' ? 404 : 400)
      .json({ message: error.message });
  }
};

// Add block to category
exports.addBlock = async (req, res) => {
  try {
    const venueStructure = await venueStructureService.addBlock(
      req.params.id,
      req.params.categoryId,
      req.body
    );
    res.status(200).json(venueStructure);
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400)
      .json({ message: error.message });
  }
};

// Update category in venue structure
exports.updateCategory = async (req, res) => {
  try {
    const venueStructure = await venueStructureService.updateCategory(
      req.params.id,
      req.params.categoryId,
      req.body
    );
    res.status(200).json(venueStructure);
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400)
      .json({ message: error.message });
  }
};

// Update block in category
exports.updateBlock = async (req, res) => {
  try {
    const venueStructure = await venueStructureService.updateBlock(
      req.params.id,
      req.params.categoryId,
      req.params.blockId,
      req.body
    );
    res.status(200).json(venueStructure);
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400)
      .json({ message: error.message });
  }
};

// Delete category from venue structure
exports.deleteCategory = async (req, res) => {
  try {
    const venueStructure = await venueStructureService.deleteCategory(
      req.params.id,
      req.params.categoryId
    );
    res.status(200).json({ message: 'Category deleted successfully', venueStructure });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400)
      .json({ message: error.message });
  }
};

// Delete block from category
exports.deleteBlock = async (req, res) => {
  try {
    const venueStructure = await venueStructureService.deleteBlock(
      req.params.id,
      req.params.categoryId,
      req.params.blockId
    );
    res.status(200).json({ message: 'Block deleted successfully', venueStructure });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400)
      .json({ message: error.message });
  }
}; 