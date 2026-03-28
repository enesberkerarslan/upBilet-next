const Blog = require('../../models/blog.model');
const { logger } = require('../../utils/logger');

// Get all published blogs
const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 13;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBlogs = await Blog.countDocuments({});
    const totalPages = Math.ceil(totalBlogs / limit);

    res.json({
      success: true,
      blogs,
      currentPage: page,
      totalPages,
      totalBlogs
    });
  } catch (error) {
    logger.error('Get all blogs error:', error);
    res.status(500).json({
      success: false,
      error: 'Bloglar getirilirken hata oluştu'
    });
  }
};

// Get blog by slug
const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({ 
      slug
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog bulunamadı'
      });
    }

    res.json({
      success: true,
      blog
    });
  } catch (error) {
    logger.error('Get blog by slug error:', error);
    res.status(500).json({
      success: false,
      error: 'Blog getirilirken hata oluştu'
    });
  }
};

// Search blogs
const searchBlogs = async (req, res) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Arama terimi gerekli'
      });
    }

    const blogs = await Blog.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBlogs = await Blog.countDocuments({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ]
    });

    const totalPages = Math.ceil(totalBlogs / limit);

    res.json({
      success: true,
      blogs,
      currentPage: page,
      totalPages,
      totalBlogs
    });
  } catch (error) {
    logger.error('Search blogs error:', error);
    res.status(500).json({
      success: false,
      error: 'Blog arama hatası'
    });
  }
};

module.exports = {
  getAllBlogs,
  getBlogBySlug,
  searchBlogs
};
