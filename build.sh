#!/bin/bash
# Este script se ejecutará durante el despliegue en Render.com

# Instalar dependencias
npm install

# Crear directorio para archivos subidos si no existe
mkdir -p public/uploads

# Establecer permisos para la carpeta de uploads
chmod -R 777 public/uploads

echo "Build completed successfully!"