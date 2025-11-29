/**
 * Utilidad de logging para el servidor
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

const LOG_LEVEL = process.env.LOG_LEVEL || LOG_LEVELS.INFO;

/**
 * Logger con niveles de log
 */
class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  error(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(`❌ [${this.context}]`, message, ...args);
    }
  }

  warn(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(`⚠️ [${this.context}]`, message, ...args);
    }
  }

  info(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.log(`ℹ️ [${this.context}]`, message, ...args);
    }
  }

  debug(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(`🔍 [${this.context}]`, message, ...args);
    }
  }

  shouldLog(level) {
    const levels = [LOG_LEVELS.ERROR, LOG_LEVELS.WARN, LOG_LEVELS.INFO, LOG_LEVELS.DEBUG];
    const currentLevelIndex = levels.indexOf(LOG_LEVEL);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }
}

/**
 * Crea un logger para un contexto específico
 */
function createLogger(context) {
  return new Logger(context);
}

module.exports = {
  Logger,
  createLogger,
  LOG_LEVELS
};

