// Archivo principal para Railway (más simple, sin keep-alive)
const { spawn } = require('child_process');
const path = require('path');

// Inicia el servidor web directamente
console.log('Iniciando servidor web...');
require('./server.js');
