// Archivo para mantener la aplicación activa (solo necesario en Render, no en Railway)
const axios = require('axios');

// URL de tu aplicación - se tomará de las variables de entorno
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Función para hacer ping a la aplicación
async function pingApplication() {
  try {
    console.log(`Ping a ${APP_URL} a las ${new Date().toISOString()}`);
    const response = await axios.get(APP_URL);
    console.log(`Ping exitoso - Status: ${response.status}`);
  } catch (error) {
    console.error('Error al hacer ping:', error.message);
  }
}

// Solo ejecutar si se solicita explícitamente (no necesario en Railway)
if (process.env.ENABLE_KEEP_ALIVE === 'true') {
  // Programar un ping cada 14 minutos
  setInterval(pingApplication, 14 * 60 * 1000);
  
  // Ejecutar un ping inicial
  pingApplication();
  console.log('Sistema keep-alive activado');
} else {
  console.log('Sistema keep-alive desactivado (no es necesario en Railway)');
}