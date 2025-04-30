const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Checkout page
router.get('/', async (req, res) => {
  try {
    // Find user's cart
    const cart = await Cart.findOne({ user: req.session.user.id })
      .populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      req.flash('error_msg', 'Your cart is empty');
      return res.redirect('/cart');
    }
    
    // Get user info for address
    const user = await User.findById(req.session.user.id);
    
    // Calculate totals
    let cartTotal = cart.getTotal();
    let discountAmount = 0;
    
    // Apply offer discount if any
    if (req.session.appliedOffer) {
      const offer = req.session.appliedOffer;
      
      if (offer.type === 'percentage') {
        discountAmount = (cartTotal * offer.value) / 100;
      } else {
        discountAmount = offer.value;
      }
      
      // Ensure discount doesn't exceed cart total
      discountAmount = Math.min(discountAmount, cartTotal);
    }
    
    const finalTotal = cartTotal - discountAmount;
    
    res.render('shop/checkout', {
      title: 'Checkout',
      cart,
      user,
      cartTotal,
      discountAmount,
      finalTotal,
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading checkout');
    res.redirect('/cart');
  }
});

// Process checkout
router.post('/', async (req, res) => {
  try {
    const {
      name, street, city, state, postalCode, country,
      paymentMethod
    } = req.body;
    
    // Validate address
    if (!name || !street || !city || !state || !postalCode || !country) {
      req.flash('error_msg', 'Please provide complete shipping information');
      return res.redirect('/checkout');
    }
    
    // Find user's cart
    const cart = await Cart.findOne({ user: req.session.user.id })
      .populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      req.flash('error_msg', 'Your cart is empty');
      return res.redirect('/cart');
    }
    
    // Check if products are in stock
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      
      if (!product || product.stock < item.quantity) {
        req.flash('error_msg', `Not enough stock for ${product.name}`);
        return res.redirect('/cart');
      }
    }
    
    // Calculate totals
    let cartTotal = cart.getTotal();
    let discountAmount = 0;
    
    // Apply offer discount if any
    if (req.session.appliedOffer) {
      const offer = req.session.appliedOffer;
      
      if (offer.type === 'percentage') {
        discountAmount = (cartTotal * offer.value) / 100;
      } else {
        discountAmount = offer.value;
      }
      
      // Ensure discount doesn't exceed cart total
      discountAmount = Math.min(discountAmount, cartTotal);
    }
    
    const finalTotal = cartTotal - discountAmount;
    
    let paymentId = null;
    let orderStatus = 'pending';
    
    // Process payment (simulado)
    if (paymentMethod === 'stripe') {
      // Generar un ID de pago simulado para tarjeta
      paymentId = 'CARD_PAYMENT_' + Date.now();
      orderStatus = 'paid'; // Consideramos el pago como realizado
    } else if (paymentMethod === 'cod') {
      // Cash on delivery
      paymentId = 'COD_' + Date.now();
      orderStatus = 'pending'; // Pago pendiente hasta la entrega
    } else {
      req.flash('error_msg', 'Invalid payment method');
      return res.redirect('/checkout');
    }
    
    // Create order
    const order = new Order({
      user: req.session.user.id,
      items: cart.items.map(item => ({
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price
      })),
      total: finalTotal,
      paymentId,
      status: orderStatus,
      shippingAddress: {
        name,
        street,
        city,
        state,
        postalCode,
        country
      }
    });
    
    await order.save();
    
    // Update user's orders
    await User.findByIdAndUpdate(
      req.session.user.id,
      { $push: { orders: order._id } }
    );
    
    // Update product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
    }
    
    // Clear cart
    cart.items = [];
    await cart.save();
    
    // Clear applied offer
    delete req.session.appliedOffer;
    
    // Redirect to order confirmation
    res.redirect(`/checkout/order-confirmation/${order._id}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error processing order');
    res.redirect('/checkout');
  }
});

// Order confirmation page
router.get('/order-confirmation/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('items.product');
    
    if (!order || order.user.toString() !== req.session.user.id) {
      req.flash('error_msg', 'Order not found');
      return res.redirect('/');
    }
    
    res.render('shop/order-confirmation', {
      title: 'Order Confirmation',
      order
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading order confirmation');
    res.redirect('/');
  }
});

// User orders
router.get('/my-orders', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user.id })
      .sort({ createdAt: -1 });
    
    res.render('shop/my-orders', {
      title: 'My Orders',
      orders
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading orders');
    res.redirect('/');
  }
});

// Order details
router.get('/my-orders/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('items.product');
    
    if (!order || order.user.toString() !== req.session.user.id) {
      req.flash('error_msg', 'Order not found');
      return res.redirect('/checkout/my-orders');
    }
    
    res.render('shop/order-details', {
      title: 'Order Details',
      order
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading order details');
    res.redirect('/checkout/my-orders');
  }
});

module.exports = router;