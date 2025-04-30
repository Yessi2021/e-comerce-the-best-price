const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');
const Offer = require('../models/Offer');

// Admin Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Get counts for dashboard
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    const userCount = await User.countDocuments({ role: 'customer' });
    const orderCount = await Order.countDocuments();
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');
    
    // Get low stock products
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .sort({ stock: 1 })
      .limit(5);
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      productCount,
      categoryCount,
      userCount,
      orderCount,
      recentOrders,
      lowStockProducts
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading dashboard');
    res.redirect('/admin/dashboard');
  }
});

// Category Management
// List all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().populate('parent');
    res.render('admin/categories/index', { title: 'Categories', categories });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading categories');
    res.redirect('/admin/dashboard');
  }
});

// Create category form
router.get('/categories/new', async (req, res) => {
  try {
    const categories = await Category.find(); // For parent category selection
    res.render('admin/categories/new', { title: 'Add Category', categories });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading form');
    res.redirect('/admin/categories');
  }
});

// Create category
router.post('/categories', upload.single('image'), async (req, res) => {
  try {
    const { name, description, parent } = req.body;
    
    // Create slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    
    // Create category
    const newCategory = new Category({
      name,
      slug,
      description,
      parent: parent || null,
      image: req.file ? `/uploads/${req.file.filename}` : null
    });
    
    await newCategory.save();
    
    req.flash('success_msg', 'Category added successfully');
    res.redirect('/admin/categories');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating category');
    res.redirect('/admin/categories/new');
  }
});

// Edit category form
router.get('/categories/:id/edit', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    const categories = await Category.find();
    
    res.render('admin/categories/edit', {
      title: 'Edit Category',
      category,
      categories
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading category');
    res.redirect('/admin/categories');
  }
});

// Update category
router.put('/categories/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, description, parent, active } = req.body;
    
    const updateData = {
      name,
      description,
      parent: parent || null,
      active: active === 'on'
    };
    
    // Only update image if new one is uploaded
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }
    
    await Category.findByIdAndUpdate(req.params.id, updateData);
    
    req.flash('success_msg', 'Category updated successfully');
    res.redirect('/admin/categories');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating category');
    res.redirect(`/admin/categories/${req.params.id}/edit`);
  }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', 'Category deleted successfully');
    res.redirect('/admin/categories');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting category');
    res.redirect('/admin/categories');
  }
});

// Product Management
// List all products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    res.render('admin/products/index', { title: 'Products', products });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading products');
    res.redirect('/admin/dashboard');
  }
});

// Create product form
router.get('/products/new', async (req, res) => {
  try {
    const categories = await Category.find({ active: true });
    res.render('admin/products/new', { title: 'Add Product', categories });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading form');
    res.redirect('/admin/products');
  }
});

// Create product
router.post('/products', upload.array('images', 5), async (req, res) => {
  try {
    const { 
      name, description, price, comparePrice, 
      category, stock, featured, onSale
    } = req.body;
    
    // Create slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    
    // Create product
    const newProduct = new Product({
      name,
      slug,
      description,
      price,
      comparePrice: comparePrice || 0,
      category,
      stock,
      featured: featured === 'on',
      onSale: onSale === 'on',
      images: req.files.map(file => `/uploads/${file.filename}`)
    });
    
    await newProduct.save();
    
    req.flash('success_msg', 'Product added successfully');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating product');
    res.redirect('/admin/products/new');
  }
});

// Edit product form
router.get('/products/:id/edit', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const categories = await Category.find({ active: true });
    
    res.render('admin/products/edit', {
      title: 'Edit Product',
      product,
      categories
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading product');
    res.redirect('/admin/products');
  }
});

// Update product
router.put('/products/:id', upload.array('images', 5), async (req, res) => {
  try {
    const { 
      name, description, price, comparePrice, 
      category, stock, featured, onSale, active
    } = req.body;
    
    const updateData = {
      name,
      description,
      price,
      comparePrice: comparePrice || 0,
      category,
      stock,
      featured: featured === 'on',
      onSale: onSale === 'on',
      active: active === 'on'
    };
    
    // Only update images if new ones are uploaded
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => `/uploads/${file.filename}`);
    }
    
    await Product.findByIdAndUpdate(req.params.id, updateData);
    
    req.flash('success_msg', 'Product updated successfully');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating product');
    res.redirect(`/admin/products/${req.params.id}/edit`);
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', 'Product deleted successfully');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting product');
    res.redirect('/admin/products');
  }
});

// Order Management
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    
    res.render('admin/orders/index', { title: 'Orders', orders });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading orders');
    res.redirect('/admin/dashboard');
  }
});

// View order details
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product');
    
    res.render('admin/orders/view', { title: 'Order Details', order });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading order');
    res.redirect('/admin/orders');
  }
});

// Update order status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    await Order.findByIdAndUpdate(req.params.id, { status });
    
    req.flash('success_msg', 'Order status updated');
    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating order');
    res.redirect(`/admin/orders/${req.params.id}`);
  }
});

// Offer Management
router.get('/offers', async (req, res) => {
  try {
    const offers = await Offer.find();
    res.render('admin/offers/index', { title: 'Offers', offers });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading offers');
    res.redirect('/admin/dashboard');
  }
});

// Create offer form
router.get('/offers/new', async (req, res) => {
  try {
    const products = await Product.find({ active: true });
    const categories = await Category.find({ active: true });
    
    res.render('admin/offers/new', {
      title: 'Add Offer',
      products,
      categories
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading form');
    res.redirect('/admin/offers');
  }
});

// Create offer
router.post('/offers', async (req, res) => {
  try {
    const {
      title, code, type, value, minimumPurchase,
      products, categories, active, startDate, endDate
    } = req.body;
    
    // Create offer
    const newOffer = new Offer({
      title,
      code: code.toUpperCase(),
      type,
      value,
      minimumPurchase: minimumPurchase || 0,
      products: products || [],
      categories: categories || [],
      active: active === 'on',
      startDate,
      endDate
    });
    
    await newOffer.save();
    
    req.flash('success_msg', 'Offer added successfully');
    res.redirect('/admin/offers');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating offer');
    res.redirect('/admin/offers/new');
  }
});

// Edit offer form
router.get('/offers/:id/edit', async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    const products = await Product.find({ active: true });
    const categories = await Category.find({ active: true });
    
    res.render('admin/offers/edit', {
      title: 'Edit Offer',
      offer,
      products,
      categories
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading offer');
    res.redirect('/admin/offers');
  }
});

// Update offer
router.put('/offers/:id', async (req, res) => {
  try {
    const {
      title, code, type, value, minimumPurchase,
      products, categories, active, startDate, endDate
    } = req.body;
    
    const updateData = {
      title,
      code: code.toUpperCase(),
      type,
      value,
      minimumPurchase: minimumPurchase || 0,
      products: products || [],
      categories: categories || [],
      active: active === 'on',
      startDate,
      endDate
    };
    
    await Offer.findByIdAndUpdate(req.params.id, updateData);
    
    req.flash('success_msg', 'Offer updated successfully');
    res.redirect('/admin/offers');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating offer');
    res.redirect(`/admin/offers/${req.params.id}/edit`);
  }
});

// Delete offer
router.delete('/offers/:id', async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', 'Offer deleted successfully');
    res.redirect('/admin/offers');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting offer');
    res.redirect('/admin/offers');
  }
});

module.exports = router;