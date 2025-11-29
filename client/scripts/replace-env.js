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

console.log('🔧 Reemplazando variables de entorno...');
console.log(`   SERVER_URL (env): ${process.env.SERVER_URL || 'NO DEFINIDA'}`);
console.log(`   SOCKET_URL (env): ${process.env.SOCKET_URL || 'NO DEFINIDA'}`);
console.log(`   SERVER_URL (usado): ${serverUrl}`);
console.log(`   SOCKET_URL (usado): ${socketUrl}`);

// Validar que las URLs no sean localhost en producción
if ((serverUrl.includes('localhost') || socketUrl.includes('localhost')) && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  ADVERTENCIA: Se están usando URLs de localhost en producción!');
  console.warn('   Asegúrate de que las variables SERVER_URL y SOCKET_URL estén configuradas en Render');
}

// Reemplazar las URLs - múltiples patrones para asegurar que funcione
// Patrón 1: process.env['SERVER_URL'] || 'http://localhost:3000'
content = content.replace(
  /serverUrl:\s*process\.env\['SERVER_URL'\]\s*\|\|\s*'[^']*'/g,
  `serverUrl: '${serverUrl}'`
);

// Patrón 2: process.env["SERVER_URL"] || 'http://localhost:3000'
content = content.replace(
  /serverUrl:\s*process\.env\["SERVER_URL"\]\s*\|\|\s*"[^"]*"/g,
  `serverUrl: '${serverUrl}'`
);

// Patrón 1: process.env['SOCKET_URL'] || 'http://localhost:3000'
content = content.replace(
  /socketUrl:\s*process\.env\['SOCKET_URL'\]\s*\|\|\s*'[^']*'/g,
  `socketUrl: '${socketUrl}'`
);

// Patrón 2: process.env["SOCKET_URL"] || 'http://localhost:3000'
content = content.replace(
  /socketUrl:\s*process\.env\["SOCKET_URL"\]\s*\|\|\s*"[^"]*"/g,
  `socketUrl: '${socketUrl}'`
);

// Escribir el archivo actualizado
fs.writeFileSync(envFile, content, 'utf8');

console.log('✅ Variables de entorno actualizadas correctamente');
console.log('📄 Archivo environment.prod.ts actualizado');

