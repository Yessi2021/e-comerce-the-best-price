// Authentication middleware

// Check if user is authenticated
exports.isAuth = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  
  req.flash('error_msg', 'Please log in to access this page');
  res.redirect('/auth/login');
};

// Check if user is an admin
exports.isAdmin = (req, res, next) => {
  if (req.session.isAdmin) {
    return next();
  }
  
  req.flash('error_msg', 'You do not have permission to access this page');
  res.redirect('/');
};

// Guest middleware - redirect logged in users away from login/register pages
exports.isGuest = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  
  res.redirect('/');
};