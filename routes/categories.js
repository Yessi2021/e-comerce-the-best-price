const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/Category'); // Importa el modelo

const router = express.Router();

// Ruta para mostrar el formulario de creación de categoría
router.get('/categories/create', (req, res) => {
  res.render('createCategory'); // Renderiza una vista EJS para el formulario
});

// Ruta para procesar la creación de una categoría
router.post('/categories', async (req, res) => {
  try {
    const { name, description, parent } = req.body;
    console.log(" se ejecuta el post de categories", req.body);
    
    // Validar que se proporcione al menos el nombre
    if (!name) {
      return res.status(400).send('El nombre de la categoría es obligatorio');
    }

    // Generar el slug automáticamente (opcional)
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    // Crear la nueva categoría
    const newCategory = new Category({
      name,
      slug,
      description,
      parent: parent || null, // Si no se proporciona un padre, será null
    });

    // Guardar en la base de datos
    await newCategory.save();

    // Redirigir a la lista de categorías o mostrar un mensaje de éxito
    res.redirect('/categories');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al crear la categoría');
  }
});


// actualizar
// Ruta para mostrar el formulario de edición de una categoría
router.get('/edit/:id', async (req, res) => {
  try {
      const { id } = req.params;
console.log(" se ejecuta el get de edit", req.params.id);

      // Buscar la categoría por su slug
      const category = await Category.findById(id);
    console.log(" se ejecuta el get de edit", category);
      if (!category) {
          return res.status(404).send('Categoría no encontrada');
      }

      // Renderizar la vista de edición con los datos de la categoría
      res.render('admin/categories/edit', { category, title: 'Editar Categoría' });
  } catch (error) {
      console.error('Error al cargar la categoría:', error);
      res.status(500).send('Error al cargar la categoría');
  }
});

// Ruta para procesar la edición de una categoría
// Ruta para procesar la actualización de una categoría
router.put('/edit/:id', async (req, res) => {
  try {
    const { id } = req.params; // Obtener el ID de la categoría desde los parámetros de la URL
    const { name, description } = req.body; // Obtener los datos enviados desde el formulario

    // Validar que se proporcione al menos el nombre
    if (!name) {
      return res.status(400).send('El nombre de la categoría es obligatorio');
    }

    // Actualizar la categoría en la base de datos
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, description },
      { new: true } // Devuelve la categoría actualizada
    );

    if (!updatedCategory) {
      return res.status(404).send('Categoría no encontrada');
    }

    // Redirigir a la lista de categorías después de la actualización
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Error al actualizar la categoría:', error);
    res.status(500).send('Error al actualizar la categoría');
  }
});

module.exports = router;