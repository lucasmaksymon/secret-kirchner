/**
 * Configuración de entorno para producción
 * NOTA: Este archivo se modifica automáticamente por el script replace-env.js durante el build
 * Las variables SERVER_URL y SOCKET_URL se reemplazan con los valores de las variables de entorno
 */
export const environment = {
  production: true,
  development: false, // Modo desarrollo desactivado en producción
  serverUrl: process.env['SERVER_URL'] || 'http://localhost:3000',
  socketUrl: process.env['SOCKET_URL'] || 'http://localhost:3000'
};

