const express = require('express');
const router = express.Router();
const publicBlogController = require('../../controllers/public/blog.controller');

// Get all published blogs
router.get('/', publicBlogController.getAllBlogs);

// Search blogs
router.get('/search', publicBlogController.searchBlogs);

// Get blog by slug
router.get('/slug/:slug', publicBlogController.getBlogBySlug);

module.exports = router;
