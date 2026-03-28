const tagService = require('../../services/admin/tag.service');
const catchAsync = require('../../utils/catch.async');

const tagController = {
  getAllTags: catchAsync(async (req, res) => {
    const tags = await tagService.getAllTags(req.query);
    res.json({
      success: true,
      data: tags
    });
  }),

  getTagById: catchAsync(async (req, res) => {
    const tag = await tagService.getTagById(req.params.id);
    res.json({
      success: true,
      data: tag
    });
  }),

  createTag: catchAsync(async (req, res) => {
    const tag = await tagService.createTag(req.body);
    res.status(201).json({
      success: true,
      data: tag
    });
  }),

  updateTag: catchAsync(async (req, res) => {
    const tag = await tagService.updateTag(req.params.id, req.body);
    res.json({
      success: true,
      data: tag
    });
  }),

  deleteTag: catchAsync(async (req, res) => {
    await tagService.deleteTag(req.params.id);
    res.json({
      success: true,
      message: 'Etiket başarıyla silindi'
    });
  })
};

module.exports = tagController; 