/**
 * Configuración de entorno del servidor
 */

const DEFAULT_PORT = 3000;
const DEFAULT_CLIENT_URL = 'http://localhost:4200';

/**
 * Obtiene la configuración del entorno
 */
function getConfig() {
  return {
    port: process.env.PORT || DEFAULT_PORT,
    clientUrl: process.env.CLIENT_URL || DEFAULT_CLIENT_URL,
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || DEFAULT_CLIENT_URL
  };
}

module.exports = {
  getConfig
};

