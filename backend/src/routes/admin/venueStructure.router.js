const express = require('express');
const router = express.Router();
const venueStructureController = require('../../controllers/admin/venueStructure.controller');
const { protect } = require('../../middleware/auth.middleware');

// Tüm rotalar için authentication gerekli
router.use(protect);
// Create a new venue structure
router.post('/', venueStructureController.createVenueStructure);

// Get all venue structures
router.get('/', venueStructureController.getAllVenueStructures);

// Get venue structure by ID
router.get('/:id', venueStructureController.getVenueStructureById);

// Get venue structure by venue ID
router.get('/venue/:venueId', venueStructureController.getVenueStructureByVenueId);

// Update venue structure
router.put('/:id', venueStructureController.updateVenueStructure);

// Delete venue structure
router.delete('/:id', venueStructureController.deleteVenueStructure);

// Add category to venue structure
router.post('/:id/categories', venueStructureController.addCategory);

// Add block to category
router.post('/:id/categories/:categoryId/blocks', venueStructureController.addBlock);

// Update category in venue structure
router.put('/:id/categories/:categoryId', venueStructureController.updateCategory);

// Update block in category
router.put('/:id/categories/:categoryId/blocks/:blockId', venueStructureController.updateBlock);

// Delete category from venue structure
router.delete('/:id/categories/:categoryId', venueStructureController.deleteCategory);

// Delete block from category
router.delete('/:id/categories/:categoryId/blocks/:blockId', venueStructureController.deleteBlock);

module.exports = router; 