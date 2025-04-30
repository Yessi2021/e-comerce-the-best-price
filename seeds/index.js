require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-monolith', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected for seeding'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Seed data
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    const admin = new User({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    await admin.save();
    console.log('Admin user created');
    
    // Create categories
    const categories = [
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and gadgets'
      },
      {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Apparel and fashion items'
      },
      {
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
        description: 'Products for your home and kitchen'
      }
    ];
    
    const createdCategories = await Category.insertMany(categories);
    console.log('Categories created');
    
    // Create subcategories
    const electronicsId = createdCategories[0]._id;
    const clothingId = createdCategories[1]._id;
    
    const subcategories = [
      {
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Mobile phones and accessories',
        parent: electronicsId
      },
      {
        name: 'Laptops',
        slug: 'laptops',
        description: 'Notebook computers and accessories',
        parent: electronicsId
      },
      {
        name: 'Men\'s Clothing',
        slug: 'mens-clothing',
        description: 'Clothing for men',
        parent: clothingId
      },
      {
        name: 'Women\'s Clothing',
        slug: 'womens-clothing',
        description: 'Clothing for women',
        parent: clothingId
      }
    ];
    
    const createdSubcategories = await Category.insertMany(subcategories);
    console.log('Subcategories created');
    
    // Create products
    const smartphonesId = createdSubcategories[0]._id;
    const laptopsId = createdSubcategories[1]._id;
    const mensClothingId = createdSubcategories[2]._id;
    const womensClothingId = createdSubcategories[3]._id;
    
    const products = [
      {
        name: 'Smartphone X',
        slug: 'smartphone-x',
        description: 'Latest smartphone with high-end features and camera',
        price: 699.99,
        comparePrice: 799.99,
        category: smartphonesId,
        stock: 20,
        featured: true,
        onSale: true
      },
      {
        name: 'Laptop Pro',
        slug: 'laptop-pro',
        description: 'Powerful laptop for professionals and creatives',
        price: 1299.99,
        comparePrice: 1499.99,
        category: laptopsId,
        stock: 10,
        featured: true
      },
      {
        name: 'Men\'s Casual Shirt',
        slug: 'mens-casual-shirt',
        description: 'Comfortable cotton casual shirt for everyday wear',
        price: 29.99,
        comparePrice: 39.99,
        category: mensClothingId,
        stock: 50,
        onSale: true
      },
      {
        name: 'Women\'s Summer Dress',
        slug: 'womens-summer-dress',
        description: 'Light and breathable summer dress',
        price: 49.99,
        comparePrice: 59.99,
        category: womensClothingId,
        stock: 30,
        featured: true
      },
      {
        name: 'Smartphone Y',
        slug: 'smartphone-y',
        description: 'Mid-range smartphone with great battery life',
        price: 349.99,
        category: smartphonesId,
        stock: 25
      },
      {
        name: 'Laptop Basic',
        slug: 'laptop-basic',
        description: 'Affordable laptop for everyday use',
        price: 599.99,
        category: laptopsId,
        stock: 15
      }
    ];
    
    await Product.insertMany(products);
    console.log('Products created');
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();