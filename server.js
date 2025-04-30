require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const categoryRoutes = require('./routes/categories.js');
const productsRoutes = require('./routes/products.js');

// Import middlewares
const { isAuth, isAdmin } = require('./middleware/auth');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Configurar method-override con opciones adicionales para mayor compatibilidad
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));
app.use(methodOverride('_method')); // Mantener la configuración original como respaldo

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI 
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Flash messages
app.use(flash());

// Middleware de registro para depuración
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  if (req.method === 'POST' && req.body._method) {
    console.log(`_method override: ${req.body._method}`);
  }
  next();
});

// Global variables middleware
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user;
  res.locals.isAdmin = req.session.isAdmin;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/admin', isAuth, isAdmin, adminRoutes);
app.use('/categories', isAuth, isAdmin, categoryRoutes);
app.use('/admin/products', isAuth, isAdmin, productsRoutes);
app.use('/admin/categories', require('./routes/eliminarCategoria'));
app.use('/cart', isAuth, cartRoutes);
app.use('/checkout', isAuth, checkoutRoutes);
app.use('/', shopRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Server Error',
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});