const Tag = require('../../models/tag.model');
const { logger } = require('../../utils/logger');

// Get all tags (public)
const getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find({})
      .select('name slug tag')
      .sort({ name: 1 });

    res.json({
      success: true,
      tags
    });
  } catch (error) {
    logger.error('Get all tags error:', error);
    res.status(500).json({
      success: false,
      error: 'Kategoriler getirilirken hata oluştu'
    });
  }
};

module.exports = {
  getAllTags
};
