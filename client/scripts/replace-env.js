/**
 * Script para reemplazar variables de entorno en environment.prod.ts
 * Se ejecuta antes del build de producción
 */

const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '../src/environments/environment.prod.ts');

// Leer el archivo
let content = fs.readFileSync(envFile, 'utf8');

// Obtener variables de entorno o usar valores por defecto
const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
const socketUrl = process.env.SOCKET_URL || process.env.SERVER_URL || 'http://localhost:3000';

// Reemplazar las URLs (manteniendo la coma al final)
content = content.replace(
  /serverUrl:\s*process\.env\['SERVER_URL'\]\s*\|\|\s*'[^']*'(,?)/,
  `serverUrl: '${serverUrl}'$1`
);

content = content.replace(
  /socketUrl:\s*process\.env\['SOCKET_URL'\]\s*\|\|\s*'[^']*'(,?)/,
  `socketUrl: '${socketUrl}'$1`
);

// Escribir el archivo actualizado
fs.writeFileSync(envFile, content, 'utf8');

console.log('✅ Variables de entorno actualizadas:');
console.log(`   SERVER_URL: ${serverUrl}`);
console.log(`   SOCKET_URL: ${socketUrl}`);

