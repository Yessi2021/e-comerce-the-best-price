const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const multer = require('multer'); // Para manejar la subida de imágenes
const path = require('path');

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Función para generar el slug
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Reemplaza espacios con guiones
    .replace(/[^\w\-]+/g, '') // Elimina caracteres especiales
    .replace(/\-\-+/g, '-'); // Reemplaza múltiples guiones por uno solo
};

// Ruta para procesar la creación del producto
router.post('/products', upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, comparePrice, category, stock, featured, onSale } = req.body;

    // Generar el slug automáticamente a partir del nombre
    const slug = slugify(name);

    // Manejar las imágenes subidas
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    // Crear un nuevo producto
    const newProduct = new Product({
      name,
      slug,
      description,
      price,
      comparePrice: comparePrice || 0,
      category,
      stock,
      images,
      featured: !!featured, // Convertir a booleano
      onSale: !!onSale // Convertir a booleano
    });

    // Guardar en la base de datos
    await newProduct.save();

    // Redirigir a la lista de productos
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Error al crear el producto:', error);
    res.status(500).send('Error al crear el producto');
  }
});


// acualizar producto
// Ruta para procesar la actualización
router.post('/:id', upload.array('images', 5), async (req, res) => {
  const productId = req.params.id;
  const updatedFields = req.body;
  
  console.log('Datos recibidos para actualizar:', updatedFields);
  console.log('ID del producto a actualizar:', productId);

  try {
    const product = await Product.findById(productId);
    if (!product) {
      req.flash('error_msg', 'Producto no encontrado.');
      return res.redirect('/admin/products');
    }

    // Actualizar campos básicos
    product.name = updatedFields.name;
    product.slug = slugify(updatedFields.name); // Regenerar el slug si cambió el nombre
    product.description = updatedFields.description;
    product.price = updatedFields.price;
    product.comparePrice = updatedFields.comparePrice || 0;
    product.category = updatedFields.category;
    product.stock = updatedFields.stock;
    product.featured = !!updatedFields.featured; // Convertir a booleano
    product.onSale = !!updatedFields.onSale; // Convertir a booleano

    // Manejar imágenes nuevas si fueron subidas
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      product.images = newImages; // Sobrescribe las imágenes anteriores
    }
    // Si no se subieron nuevas imágenes, se mantienen las actuales

    // Guardar los cambios
    await product.save();

    req.flash('success_msg', 'Producto actualizado correctamente.');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    req.flash('error_msg', 'Hubo un error al actualizar el producto.');
    res.redirect('/admin/products');
  }
});

// Ruta para eliminar un producto
router.delete('/:id', async (req, res) => {
  const productId = req.params.id;
  console.log('Eliminando producto con ID:', productId);

  try {
    const product = await Product.findById(productId);
    if (!product) {
      req.flash('error_msg', 'Producto no encontrado.');
      return res.redirect('/admin/products');
    }

    // Eliminar el producto de la base de datos
    await Product.findByIdAndDelete(productId);

    req.flash('success_msg', 'Producto eliminado correctamente.');
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    req.flash('error_msg', 'Hubo un error al eliminar el producto.');
    res.redirect('/admin/products');
  }
});


module.exports = router;