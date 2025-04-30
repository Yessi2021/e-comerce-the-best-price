const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Offer = require('../models/Offer');

// Home page
router.get('/', async (req, res) => {
  try {
    // Get featured products
    const featuredProducts = await Product.find({ featured: true, active: true })
      .limit(8)
      .populate('category');
    
    // Get categories for navigation
    const categories = await Category.find({ active: true, parent: null })
      .limit(6);

     // const userName = req.session.user.name;
     const userName = req.session.user ? req.session.user.name : null;
      
    console.log("User name:", userName);
    
    // Get on sale products
    const saleProducts = await Product.find({ onSale: true, active: true })
      .limit(4)
      .populate('category');
    
    // Get current offers
    const currentOffers = await Offer.find({
      active: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).limit(3);
    
    res.render('shop/home', {
      title: 'Home',
      featuredProducts,
      categories,
      saleProducts,
      currentOffers,
      userName
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Server Error', error: err.message });
  }
});

// Product listing page
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    
    // Build query based on filters
    const query = { active: true };
    
    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Price range filter
    if (req.query.minPrice && req.query.maxPrice) {
      query.price = {
        $gte: parseFloat(req.query.minPrice),
        $lte: parseFloat(req.query.maxPrice)
      };
    } else if (req.query.minPrice) {
      query.price = { $gte: parseFloat(req.query.minPrice) };
    } else if (req.query.maxPrice) {
      query.price = { $lte: parseFloat(req.query.maxPrice) };
    }
    
    // Sale filter
    if (req.query.onSale === 'true') {
      query.onSale = true;
    }
    
    // Get products
    const products = await Product.find(query)
      .sort(req.query.sort || '-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('category');
    
    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);
    
    // Get categories for filter
    const categories = await Category.find({ active: true });
    
    res.render('shop/products', {
      title: 'Products',
      products,
      categories,
      currentPage: page,
      totalPages,
      totalProducts,
      filters: req.query
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Server Error', error: err.message });
  }
});

// Product detail page
router.get('/products/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, active: true })
      .populate('category');
    
    if (!product) {
      return res.status(404).render('404', { title: 'Product Not Found' });
    }
    
    // Get related products from same category
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      active: true
    })
    .limit(4);
    
    res.render('shop/product-detail', {
      title: product.name,
      product,
      relatedProducts
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Server Error', error: err.message });
  }
});

// Category page
router.get('/category/:slug', async (req, res) => {
  console.log("Category slug:", req.params.slug);
  
  try {
    const category = await Category.findOne({ slug: req.params.slug, active: true });
    
    if (!category) {
      return res.status(404).render('404', { title: 'Category Not Found' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    
    // Get products in this category
    const products = await Product.find({ category: category._id, active: true })
      .sort(req.query.sort || '-createdAt')
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const totalProducts = await Product.countDocuments({ 
      category: category._id, 
      active: true 
    });
    const totalPages = Math.ceil(totalProducts / limit);
    
    // Get subcategories
    const subcategories = await Category.find({ 
      parent: category._id,
      active: true
    });
    
    res.render('shop/category', {
      title: category.name,
      category,
      products,
      subcategories,
      currentPage: page,
      totalPages,
      filters: req.query
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Server Error', error: err.message });
  }
});

// Search
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query) {
      return res.redirect('/products');
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;
    
    // Search in name and description
    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ],
      active: true
    };
    
    // Get products
    const products = await Product.find(searchQuery)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('category');
    
    // Get total count for pagination
    const totalProducts = await Product.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalProducts / limit);
    
    res.render('shop/search-results', {
      title: `Search: ${query}`,
      query,
      products,
      currentPage: page,
      totalPages,
      totalProducts
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Server Error', error: err.message });
  }
});

module.exports = router;