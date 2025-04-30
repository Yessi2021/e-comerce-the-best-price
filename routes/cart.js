const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Offer = require('../models/Offer');

// View cart
router.get('/', async (req, res) => {
  try {
    // Find or create cart for user
    let cart = await Cart.findOne({ user: req.session.user.id }).populate('items.product');
    
    if (!cart) {
      cart = new Cart({ user: req.session.user.id, items: [] });
      await cart.save();
    }
    
    // Get available offers
    const availableOffers = await Offer.find({
      active: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    
    res.render('shop/cart', {
      title: 'Shopping Cart',
      cart,
      cartTotal: cart.getTotal(),
      availableOffers
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading cart');
    res.redirect('/');
  }
});

// Add to cart
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const parsedQuantity = parseInt(quantity) || 1;
    
    // Find product
    const product = await Product.findById(productId);
    
    if (!product || !product.active) {
      req.flash('error_msg', 'Product not available');
      return res.redirect('/products');
    }
    
    // Check if enough stock
    if (product.stock < parsedQuantity) {
      req.flash('error_msg', 'Not enough stock available');
      return res.redirect(`/products/${product.slug}`);
    }
    
    // Find or create cart
    let cart = await Cart.findOne({ user: req.session.user.id });
    
    if (!cart) {
      cart = new Cart({ user: req.session.user.id, items: [] });
    }
    
    // Check if product already in cart
    const itemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId
    );
    
    if (itemIndex > -1) {
      // Product exists in cart, update quantity
      cart.items[itemIndex].quantity += parsedQuantity;
    } else {
      // Product not in cart, add new item
      cart.items.push({
        product: productId,
        quantity: parsedQuantity,
        price: product.price
      });
    }
    
    cart.updatedAt = Date.now();
    await cart.save();
    
    req.flash('success_msg', 'Product added to cart');
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding to cart');
    res.redirect('/products');
  }
});

// Update cart item quantity
router.post('/update', async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const parsedQuantity = parseInt(quantity);
    
    // Validate quantity
    if (parsedQuantity <= 0) {
      req.flash('error_msg', 'Quantity must be at least 1');
      return res.redirect('/cart');
    }
    
    // Find cart
    const cart = await Cart.findOne({ user: req.session.user.id });
    
    if (!cart) {
      req.flash('error_msg', 'Cart not found');
      return res.redirect('/cart');
    }
    
    // Find the item
    const itemIndex = cart.items.findIndex(item => 
      item._id.toString() === itemId
    );
    
    if (itemIndex === -1) {
      req.flash('error_msg', 'Item not found in cart');
      return res.redirect('/cart');
    }
    
    // Check stock
    const product = await Product.findById(cart.items[itemIndex].product);
    
    if (product.stock < parsedQuantity) {
      req.flash('error_msg', `Only ${product.stock} items available`);
      return res.redirect('/cart');
    }
    
    // Update quantity
    cart.items[itemIndex].quantity = parsedQuantity;
    cart.updatedAt = Date.now();
    await cart.save();
    
    req.flash('success_msg', 'Cart updated');
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating cart');
    res.redirect('/cart');
  }
});

// Remove item from cart
router.post('/remove', async (req, res) => {
  try {
    const { itemId } = req.body;
    
    // Find cart
    const cart = await Cart.findOne({ user: req.session.user.id });
    
    if (!cart) {
      req.flash('error_msg', 'Cart not found');
      return res.redirect('/cart');
    }
    
    // Remove item
    cart.items = cart.items.filter(item => 
      item._id.toString() !== itemId
    );
    
    cart.updatedAt = Date.now();
    await cart.save();
    
    req.flash('success_msg', 'Item removed from cart');
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error removing item');
    res.redirect('/cart');
  }
});

// Apply offer code
router.post('/apply-offer', async (req, res) => {
  try {
    const { offerCode } = req.body;
    
    // Find offer
    const offer = await Offer.findOne({
      code: offerCode.toUpperCase(),
      active: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    
    if (!offer) {
      req.flash('error_msg', 'Invalid or expired offer code');
      return res.redirect('/cart');
    }
    
    // Store offer in session
    req.session.appliedOffer = {
      id: offer._id,
      code: offer.code,
      type: offer.type,
      value: offer.value
    };
    
    req.flash('success_msg', 'Offer applied successfully');
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error applying offer');
    res.redirect('/cart');
  }
});

// Remove offer
router.post('/remove-offer', (req, res) => {
  // Remove offer from session
  delete req.session.appliedOffer;
  
  req.flash('success_msg', 'Offer removed');
  res.redirect('/cart');
});

// Clear cart
router.post('/clear', async (req, res) => {
  try {
    // Find cart
    const cart = await Cart.findOne({ user: req.session.user.id });
    
    if (cart) {
      cart.items = [];
      cart.updatedAt = Date.now();
      await cart.save();
    }
    
    req.flash('success_msg', 'Cart cleared');
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error clearing cart');
    res.redirect('/cart');
  }
});

module.exports = router;