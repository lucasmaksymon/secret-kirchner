/**
 * @fileoverview Sistema de roles para El Secreto de Kirchner
 * @module game/roles
 */

/** @type {Object<string, string>} Tipos de roles */
const ROLE_TYPES = {
  LIBERTARIO: 'libertario',
  KIRCHNERISTA: 'kirchnerista',
  EL_JEFE: 'el_jefe'
};

/** @type {Object<string, string>} Tipos de equipos */
const TEAM_TYPES = {
  LIBERTARIOS: 'libertarios',
  KIRCHNERISTAS: 'kirchneristas'
};

/**
 * Configuración de roles por número de jugadores
 * @type {Object<number, Object>}
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
 * Genera y distribuye roles aleatoriamente según el número de jugadores
 * @param {number} playerCount - Número de jugadores (5-10)
 * @returns {Array<Object>} Array de roles mezclados
 * @throws {Error} Si el número de jugadores es inválido
 */
function generateRoles(playerCount) {
  if (!ROLE_DISTRIBUTION[playerCount]) {
    throw new Error(`Número de jugadores inválido: ${playerCount}. Debe ser entre 5 y 10.`);
  }

  const config = ROLE_DISTRIBUTION[playerCount];
  const roles = [];

  for (let i = 0; i < config.libertarios; i++) {
    roles.push({
      type: ROLE_TYPES.LIBERTARIO,
      team: TEAM_TYPES.LIBERTARIOS
    });
  }

  for (let i = 0; i < config.kirchneristas; i++) {
    roles.push({
      type: ROLE_TYPES.KIRCHNERISTA,
      team: TEAM_TYPES.KIRCHNERISTAS
    });
  }

  roles.push({
    type: ROLE_TYPES.EL_JEFE,
    team: TEAM_TYPES.KIRCHNERISTAS,
    isElJefe: true
  });

  return shuffleArray(roles);
}

/**
 * Obtiene información sobre quién conoce a quién al inicio del juego
 * @param {Array<Object>} players - Array de jugadores con roles asignados
 * @returns {Object<string, Object>} Mapa de jugadores y quiénes conocen
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
 * Mezcla un array aleatoriamente usando el algoritmo Fisher-Yates
 * @param {Array} array - Array a mezclar
 * @returns {Array} Nuevo array mezclado
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
 * Verifica si un rol pertenece al equipo kirchnerista
 * @param {Object} role - Rol a verificar
 * @returns {boolean} True si es kirchnerista
 */
function isKirchnerista(role) {
  return role.team === TEAM_TYPES.KIRCHNERISTAS;
}

/**
 * Verifica si un rol es El Jefe
 * @param {Object} role - Rol a verificar
 * @returns {boolean} True si es El Jefe
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

