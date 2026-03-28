const Blog = require('../../models/blog.model');
const { logger } = require('../../utils/logger');

class BlogService {
  // Create a new blog post
  async createBlog(blogData) {
    const blog = new Blog(blogData);
    const resp = await blog.save();
    console.log(resp);
    return resp;
  }

  // Get all blog posts with pagination
  async getAllBlogs(page = 1, limit = 13) {
    const skip = (page - 1) * limit;
    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Blog.countDocuments();
    
    return {
      blogs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlogs: total
    };
  }

  // Get a single blog post by ID
  async getBlogById(id) {
    const blog = await Blog.findById(id);
    if (!blog) {
      throw new Error('Blog not found');
    }
    return blog;
  }

  // Get a single blog post by slug
  async getBlogBySlug(slug) {
    const blog = await Blog.findOne({ slug });
    if (!blog) {
      throw new Error('Blog not found');
    }
    return blog;
  }

  // Update a blog post
  async updateBlog(id, updateData) {
    const blog = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!blog) {
      throw new Error('Blog not found');
    }
    return blog;
  }

  // Delete a blog post
  async deleteBlog(id) {
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) {
      throw new Error('Blog not found');
    }
    return blog;
  }

  // Search blogs by title
  async searchBlogs(searchQuery, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const blogs = await Blog.find(
      { $text: { $search: searchQuery } },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .skip(skip)
    .limit(limit);

    const total = await Blog.countDocuments({ $text: { $search: searchQuery } });

    return {
      blogs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBlogs: total
    };
  }
}

module.exports = new BlogService(); 