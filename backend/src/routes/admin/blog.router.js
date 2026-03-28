const express = require('express');
const router = express.Router();
const blogController = require('../../controllers/admin/blog.controller');
const { protect } = require('../../middleware/auth.middleware');

// Create a new blog post
router.post('/', blogController.createBlog);

// Get all blog posts
router.get('/', blogController.getAllBlogs);

// Search blogs
router.get('/search', blogController.searchBlogs);

// Get a single blog post by slug
router.get('/slug/:slug', blogController.getBlogBySlug);

// Get a single blog post
router.get('/:id', blogController.getBlogById);

// Update a blog post
router.put('/:id', blogController.updateBlog);

// Delete a blog post
router.delete('/:id', blogController.deleteBlog);

module.exports = router; 