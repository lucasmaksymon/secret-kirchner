/**
 * Sistema de roles para El Secreto de Kirchner
 * Distribución de roles según número de jugadores
 */

const ROLE_TYPES = {
  LIBERTARIO: 'libertario',
  KIRCHNERISTA: 'kirchnerista',
  EL_JEFE: 'el_jefe'
};

const TEAM_TYPES = {
  LIBERTARIOS: 'libertarios',
  KIRCHNERISTAS: 'kirchneristas'
};

/**
 * Configuración de roles por número de jugadores
 * Basado en Secret Hitler pero adaptado
 */
const ROLE_DISTRIBUTION = {
  5: {
    libertarios: 3,
    kirchneristas: 1,
    el_jefe: 1,
    description: '3 Libertarios, 2 Kirchneristas (1 es El Jefe)'
  },
  6: {
    libertarios: 4,
    kirchneristas: 1,
    el_jefe: 1,
    description: '4 Libertarios, 2 Kirchneristas (1 es El Jefe)'
  },
  7: {
    libertarios: 4,
    kirchneristas: 2,
    el_jefe: 1,
    description: '4 Libertarios, 3 Kirchneristas (1 es El Jefe)'
  },
  8: {
    libertarios: 5,
    kirchneristas: 2,
    el_jefe: 1,
    description: '5 Libertarios, 3 Kirchneristas (1 es El Jefe)'
  },
  9: {
    libertarios: 5,
    kirchneristas: 3,
    el_jefe: 1,
    description: '5 Libertarios, 4 Kirchneristas (1 es El Jefe)'
  },
  10: {
    libertarios: 6,
    kirchneristas: 3,
    el_jefe: 1,
    description: '6 Libertarios, 4 Kirchneristas (1 es El Jefe)'
  }
};

/**
 * Genera y distribuye roles aleatoriamente
 * @param {number} playerCount - Número de jugadores
 * @returns {Array} Array de roles mezclados
 */
function generateRoles(playerCount) {
  if (!ROLE_DISTRIBUTION[playerCount]) {
    throw new Error(`Número de jugadores inválido: ${playerCount}. Debe ser entre 5 y 10.`);
  }

  const config = ROLE_DISTRIBUTION[playerCount];
  const roles = [];

  // Agregar libertarios
  for (let i = 0; i < config.libertarios; i++) {
    roles.push({
      type: ROLE_TYPES.LIBERTARIO,
      team: TEAM_TYPES.LIBERTARIOS
    });
  }

  // Agregar kirchneristas regulares
  for (let i = 0; i < config.kirchneristas; i++) {
    roles.push({
      type: ROLE_TYPES.KIRCHNERISTA,
      team: TEAM_TYPES.KIRCHNERISTAS
    });
  }

  // Agregar El Jefe
  roles.push({
    type: ROLE_TYPES.EL_JEFE,
    team: TEAM_TYPES.KIRCHNERISTAS,
    isElJefe: true
  });

  // Mezclar roles
  return shuffleArray(roles);
}

/**
 * Obtiene información sobre quién conoce a quién al inicio
 * @param {Array} players - Array de jugadores con roles asignados
 * @returns {Object} Mapa de jugadores y quiénes conocen
 */
function getInitialKnowledge(players) {
  const knowledge = {};

  players.forEach(player => {
    knowledge[player.id] = {
      role: player.role,
      knows: [],
      knownBy: []
    };
  });

  // Los kirchneristas se conocen entre sí
  const kirchneristas = players.filter(p => p.role.team === TEAM_TYPES.KIRCHNERISTAS);
  
  kirchneristas.forEach(kirchnerista => {
    kirchneristas.forEach(otherKirchnerista => {
      if (kirchnerista.id !== otherKirchnerista.id) {
        knowledge[kirchnerista.id].knows.push({
          id: otherKirchnerista.id,
          name: otherKirchnerista.name,
          role: otherKirchnerista.role.type
        });
      }
    });
  });

  // Caso especial: si son 5-6 jugadores, El Jefe no sabe quién es el kirchnerista
  const playerCount = players.length;
  if (playerCount <= 6) {
    const elJefe = players.find(p => p.role.type === ROLE_TYPES.EL_JEFE);
    if (elJefe) {
      knowledge[elJefe.id].knows = [];
    }
  }

  return knowledge;
}

/**
 * Mezcla un array aleatoriamente (Fisher-Yates shuffle)
 * @param {Array} array - Array a mezclar
 * @returns {Array} Array mezclado
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Verifica si un rol es kirchnerista
 */
function isKirchnerista(role) {
  return role.team === TEAM_TYPES.KIRCHNERISTAS;
}

/**
 * Verifica si un rol es El Jefe
 */
function isElJefe(role) {
  return role.type === ROLE_TYPES.EL_JEFE;
}

module.exports = {
  ROLE_TYPES,
  TEAM_TYPES,
  ROLE_DISTRIBUTION,
  generateRoles,
  getInitialKnowledge,
  isKirchnerista,
  isElJefe
};

