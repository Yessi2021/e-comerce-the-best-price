const express = require('express');
const router = express.Router();
const Category = require('../models/Category'); // Importa el modelo de categoría

// Ruta para eliminar una categoría
router.post('/eliminar/:id', async (req, res) => {
    console.log('Eliminando categoría...');
    
    try {
        const categoryId = req.params.id;

        // Buscar y eliminar la categoría por su ID
        const deletedCategory = await Category.findByIdAndDelete(categoryId);

        if (!deletedCategory) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }

        // Respuesta exitosa
        res.status(200).json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar la categoría' });
    }
});



module.exports = router;


