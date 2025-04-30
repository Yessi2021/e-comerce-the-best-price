# EcomShop - Monolithic E-commerce Application

A complete, monolithic e-commerce application built with Node.js, Express, and MongoDB.

## Features

- User authentication and registration
- Product catalog with categories and search
- Shopping cart functionality
- Checkout process with Stripe integration
- Admin dashboard for managing products, categories, and orders
- Responsive design for all devices

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Template Engine**: EJS
- **Payment Processing**: Stripe
- **CSS**: Custom CSS with responsive design

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)
- Stripe account for payment processing

### Installation

1. Clone the repository
2. Create a `.env` file based on `.env.example`
3. Install dependencies:
   ```
   npm install
   ```
4. Seed the database (optional):
   ```
   node seeds/index.js
   ```
5. Start the application:
   ```
   npm start
   ```

## Project Structure

- `/models` - Database models
- `/routes` - Route handlers
- `/views` - EJS templates
- `/middleware` - Custom middleware
- `/public` - Static assets
- `/seeds` - Database seed data

## Default Admin Login

- Email: admin@example.com
- Password: admin123

## License

This project is licensed under the MIT License.