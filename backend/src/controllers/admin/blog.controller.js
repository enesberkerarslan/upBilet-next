const blogService = require('../../services/admin/blog.service');

// Create a new blog post
exports.createBlog = async (req, res) => {
  try {
    const blog = await blogService.createBlog(req.body);
    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all blog posts
exports.getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 13;
    const result = await blogService.getAllBlogs(page, limit);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single blog post by ID
exports.getBlogById = async (req, res) => {
  try {
    const blog = await blogService.getBlogById(req.params.id);
    res.status(200).json(blog);
  } catch (error) {
    res.status(error.message === 'Blog not found' ? 404 : 500)
      .json({ message: error.message });
  }
};

// Get a single blog post by slug
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await blogService.getBlogBySlug(req.params.slug);
    res.status(200).json(blog);
  } catch (error) {
    res.status(error.message === 'Blog not found' ? 404 : 500)
      .json({ message: error.message });
  }
};

// Update a blog post
exports.updateBlog = async (req, res) => {
  try {
    const blog = await blogService.updateBlog(req.params.id, req.body);
    res.status(200).json(blog);
  } catch (error) {
    res.status(error.message === 'Blog not found' ? 404 : 400)
      .json({ message: error.message });
  }
};

// Delete a blog post
exports.deleteBlog = async (req, res) => {
  try {
    await blogService.deleteBlog(req.params.id);
    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(error.message === 'Blog not found' ? 404 : 500)
      .json({ message: error.message });
  }
};

// Search blogs by title
exports.searchBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await blogService.searchBlogs(req.query.q, page, limit);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 