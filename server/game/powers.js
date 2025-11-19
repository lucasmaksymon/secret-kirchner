/**
 * Poderes presidenciales para El Secreto de Kirchner
 */

const POWER_TYPES = {
  PEEK: 'peek',                    // Intervenir INDEC - ver 3 cartas
  INVESTIGATE: 'investigate',       // Investigar con AFIP - ver lealtad
  SPECIAL_ELECTION: 'special-election', // Sesión Especial - elegir próximo presidente
  EXECUTION: 'execution',           // Operación Traslado - eliminar jugador
  VETO: 'veto'                     // Veto Presidencial
};

/**
 * Ejecuta el poder "Intervenir INDEC" (peek)
 * Permite ver las próximas 3 cartas del mazo
 */
function executePeekPower(deck) {
  const topThree = deck.slice(0, 3);
  return {
    success: true,
    cards: topThree,
    message: '🔍 Interviniste el INDEC y conoces las próximas 3 cartas'
  };
}

/**
 * Ejecuta el poder "Investigar con AFIP" (investigate)
 * Revela si un jugador es Libertario o Kirchnerista
 */
function executeInvestigatePower(targetPlayer) {
  if (!targetPlayer) {
    return {
      success: false,
      message: 'Debes seleccionar un jugador para investigar'
    };
  }

  if (targetPlayer.isDead) {
    return {
      success: false,
      message: 'No puedes investigar a un jugador eliminado'
    };
  }

  // Revela el equipo (pero no si es El Jefe específicamente)
  const loyalty = targetPlayer.role.team;
  
  return {
    success: true,
    playerId: targetPlayer.id,
    playerName: targetPlayer.name,
    loyalty: loyalty,
    message: `🕵️ La AFIP investigó a ${targetPlayer.name}: es ${loyalty === 'libertarios' ? 'LIBERTARIO' : 'KIRCHNERISTA'}`
  };
}

/**
 * Ejecuta el poder "Sesión Especial del Congreso" (special election)
 * Permite al presidente elegir al próximo presidente
 */
function executeSpecialElectionPower(targetPlayer, currentPresident) {
  if (!targetPlayer) {
    return {
      success: false,
      message: 'Debes seleccionar el próximo Presidente'
    };
  }

  if (targetPlayer.isDead) {
    return {
      success: false,
      message: 'No puedes elegir a un jugador eliminado'
    };
  }

  if (targetPlayer.id === currentPresident.id) {
    return {
      success: false,
      message: 'No puedes elegirte a ti mismo'
    };
  }

  return {
    success: true,
    nextPresidentId: targetPlayer.id,
    nextPresidentName: targetPlayer.name,
    message: `🏛️ Sesión Especial: ${targetPlayer.name} será el próximo Presidente`
  };
}

/**
 * Ejecuta el poder "Operación Traslado" (execution)
 * Elimina a un jugador del juego
 */
function executeExecutionPower(targetPlayer, players) {
  if (!targetPlayer) {
    return {
      success: false,
      message: 'Debes seleccionar un jugador para la Operación Traslado'
    };
  }

  if (targetPlayer.isDead) {
    return {
      success: false,
      message: 'Este jugador ya fue eliminado'
    };
  }

  // Verificar si el jugador eliminado era El Jefe
  const wasElJefe = targetPlayer.role.type === 'el_jefe';
  
  // Marcar jugador como muerto
  targetPlayer.isDead = true;
  
  // Verificar condición de victoria
  let gameOver = null;
  if (wasElJefe) {
    gameOver = {
      winner: 'libertarios',
      reason: `¡El Jefe fue descubierto en la Operación Traslado!`
    };
  }

  return {
    success: true,
    executedPlayerId: targetPlayer.id,
    executedPlayerName: targetPlayer.name,
    wasElJefe: wasElJefe,
    gameOver: gameOver,
    message: `💀 ${targetPlayer.name} fue eliminado en una Operación Traslado${wasElJefe ? ' ¡Era El Jefe!' : ''}`
  };
}

/**
 * Verifica si el poder de veto está disponible
 */
function isVetoUnlocked(kirchneristaCount) {
  return kirchneristaCount >= 5;
}

/**
 * Ejecuta el veto presidencial
 * Tanto el Presidente como el Jefe de Gabinete deben estar de acuerdo
 */
function executeVetoPower(presidentAgrees, cabinetChiefAgrees, failedGovernments) {
  if (!presidentAgrees || !cabinetChiefAgrees) {
    return {
      success: false,
      message: 'Ambos deben estar de acuerdo para usar el Veto Presidencial'
    };
  }

  // El veto aumenta el contador de gobiernos fallidos
  const newFailedCount = failedGovernments + 1;
  
  return {
    success: true,
    failedGovernments: newFailedCount,
    message: '🚫 ¡Veto Presidencial! Las cartas fueron descartadas',
    chaosTriggered: newFailedCount >= 3
  };
}

/**
 * Valida si un poder puede ser ejecutado
 */
function canExecutePower(powerType, gameState, targetPlayer = null) {
  switch (powerType) {
    case POWER_TYPES.PEEK:
      return gameState.deck.length >= 3;
    
    case POWER_TYPES.INVESTIGATE:
      if (!targetPlayer) return false;
      if (targetPlayer.isDead) return false;
      if (targetPlayer.wasInvestigated) return false;
      return true;
    
    case POWER_TYPES.SPECIAL_ELECTION:
      if (!targetPlayer) return false;
      if (targetPlayer.isDead) return false;
      return true;
    
    case POWER_TYPES.EXECUTION:
      if (!targetPlayer) return false;
      if (targetPlayer.isDead) return false;
      return true;
    
    case POWER_TYPES.VETO:
      return gameState.kirchneristaCount >= 5;
    
    default:
      return false;
  }
}

/**
 * Mensajes satíricos para cada poder
 */
const POWER_DESCRIPTIONS = {
  [POWER_TYPES.PEEK]: {
    name: 'Intervenir INDEC',
    description: 'Como buen estadista, manipulás las estadísticas y ves las próximas 3 cartas',
    icon: '📊'
  },
  [POWER_TYPES.INVESTIGATE]: {
    name: 'Investigar con AFIP',
    description: 'Usás el poder del Estado para investigar la lealtad de un jugador',
    icon: '🕵️'
  },
  [POWER_TYPES.SPECIAL_ELECTION]: {
    name: 'Sesión Especial del Congreso',
    description: 'Convocás una sesión especial y elegís al próximo Presidente',
    icon: '🏛️'
  },
  [POWER_TYPES.EXECUTION]: {
    name: 'Operación Traslado',
    description: 'Alguien va a tener un pequeño accidente... Eliminás a un jugador',
    icon: '💀'
  },
  [POWER_TYPES.VETO]: {
    name: 'Veto Presidencial',
    description: 'El Presidente y Jefe de Gabinete pueden rechazar ambas cartas',
    icon: '🚫'
  }
};

module.exports = {
  POWER_TYPES,
  POWER_DESCRIPTIONS,
  executePeekPower,
  executeInvestigatePower,
  executeSpecialElectionPower,
  executeExecutionPower,
  executeVetoPower,
  isVetoUnlocked,
  canExecutePower
};

