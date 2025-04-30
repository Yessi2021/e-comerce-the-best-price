const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isGuest } = require('../middleware/auth');

// GET login page
router.get('/login', isGuest, (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

// POST login
router.post('/login', isGuest, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      req.flash('error_msg', 'Please fill in all fields');
      return res.redirect('/auth/login');
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }
    
    // Set session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email
    };
    
    // Check if admin
    req.session.isAdmin = user.role === 'admin';
    
    req.flash('success_msg', 'You are now logged in');
    
    // Redirect to admin dashboard for admin users
    if (req.session.isAdmin) {
      return res.redirect('/admin/dashboard');
    }
    
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Server error');
    res.redirect('/auth/login');
  }
});

// GET register page
router.get('/register', isGuest, (req, res) => {
  res.render('auth/register', { title: 'Register' });
});

// POST register
router.post('/register', isGuest, async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    
    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      req.flash('error_msg', 'Please fill in all fields');
      return res.redirect('/auth/register');
    }
    
    if (password !== confirmPassword) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect('/auth/register');
    }
    
    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error_msg', 'Email is already registered');
      return res.redirect('/auth/register');
    }
    
    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      role: 'customer'
    });
    
    await newUser.save();
    
    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Server error');
    res.redirect('/auth/register');
  }
});

// GET logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.redirect('/');
    }
    res.redirect('/auth/login');
  });
});

module.exports = router;