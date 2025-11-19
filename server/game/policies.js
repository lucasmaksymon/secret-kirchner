/**
 * Sistema de decretos (políticas) para El Secreto de Kirchner
 */

const POLICY_TYPES = {
  KIRCHNERISTA: 'kirchnerista',
  LIBERTARIO: 'libertario'
};

// Nombres satíricos para los decretos
const KIRCHNERISTA_POLICY_NAMES = [
  'Cepo Cambiario Total',
  'Plan Platita Universal',
  'Estatización Sorpresa',
  'Reforma Judicial Express',
  'Intervención INDEC 2.0',
  'Subsidio a Todo',
  'Expropiación Estratégica',
  'Controles de Precios',
  'Dólar Solidario Plus',
  'Cadena Nacional Obligatoria',
  'Empleo Público Masivo'
];

const LIBERTARIO_POLICY_NAMES = [
  'Motosierra a Ministerios',
  'Dólar Libre Total',
  'Desregulación Express',
  'Privatización Now',
  'Ajuste Fiscal Libertario',
  'Fin del Banco Central'
];

/**
 * Crea un mazo inicial de decretos
 * 11 Kirchneristas, 6 Libertarios (como el original)
 */
function createPolicyDeck() {
  const deck = [];
  
  // Agregar 11 decretos kirchneristas
  for (let i = 0; i < 11; i++) {
    deck.push({
      type: POLICY_TYPES.KIRCHNERISTA,
      name: KIRCHNERISTA_POLICY_NAMES[i % KIRCHNERISTA_POLICY_NAMES.length],
      id: `K${i + 1}`
    });
  }
  
  // Agregar 6 decretos libertarios
  for (let i = 0; i < 6; i++) {
    deck.push({
      type: POLICY_TYPES.LIBERTARIO,
      name: LIBERTARIO_POLICY_NAMES[i % LIBERTARIO_POLICY_NAMES.length],
      id: `L${i + 1}`
    });
  }
  
  return shuffleDeck(deck);
}

/**
 * Mezcla el mazo de decretos
 */
function shuffleDeck(deck) {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

/**
 * Roba 3 cartas del mazo
 * Si quedan menos de 3 cartas, mezcla la pila de descarte
 */
function drawPolicies(deck, discardPile) {
  let currentDeck = [...deck];
  let currentDiscard = [...discardPile];
  
  // Si no hay suficientes cartas, mezclar descarte
  if (currentDeck.length < 3) {
    currentDeck = [...currentDeck, ...shuffleDeck(currentDiscard)];
    currentDiscard = [];
  }
  
  const drawnCards = currentDeck.splice(0, 3);
  
  return {
    cards: drawnCards,
    remainingDeck: currentDeck,
    discardPile: currentDiscard
  };
}

/**
 * Descarta una carta
 */
function discardPolicy(cards, cardIndex) {
  if (cardIndex < 0 || cardIndex >= cards.length) {
    throw new Error('Índice de carta inválido');
  }
  
  const remaining = [...cards];
  const discarded = remaining.splice(cardIndex, 1)[0];
  
  return {
    remaining,
    discarded
  };
}

/**
 * Verifica si se alcanzó la condición de victoria
 */
function checkVictoryCondition(kirchneristaCount, libertarioCount) {
  if (libertarioCount >= 5) {
    return {
      winner: 'libertarios',
      reason: '5 decretos libertarios aprobados'
    };
  }
  
  if (kirchneristaCount >= 6) {
    return {
      winner: 'kirchneristas',
      reason: '6 decretos kirchneristas aprobados'
    };
  }
  
  return null;
}

/**
 * Obtiene el poder presidencial según el número de decretos kirchneristas
 */
function getPowerForTrack(kirchneristaCount, playerCount) {
  // Los poderes varían según el número de jugadores
  const powerTracks = {
    5: [null, null, 'peek', 'execution', 'execution'],
    6: [null, null, 'peek', 'execution', 'execution'],
    7: [null, 'investigate', 'special-election', 'execution', 'execution'],
    8: [null, 'investigate', 'special-election', 'execution', 'execution'],
    9: ['investigate', 'investigate', 'special-election', 'execution', 'execution'],
    10: ['investigate', 'investigate', 'special-election', 'execution', 'execution']
  };
  
  const track = powerTracks[playerCount] || powerTracks[7];
  return track[kirchneristaCount - 1] || null;
}

/**
 * Nombres satíricos de los poderes presidenciales
 */
const POWER_NAMES = {
  'peek': 'Intervenir INDEC',
  'investigate': 'Investigar con AFIP',
  'special-election': 'Sesión Especial del Congreso',
  'execution': 'Operación Traslado',
  'veto': 'Veto Presidencial'
};

module.exports = {
  POLICY_TYPES,
  KIRCHNERISTA_POLICY_NAMES,
  LIBERTARIO_POLICY_NAMES,
  POWER_NAMES,
  createPolicyDeck,
  shuffleDeck,
  drawPolicies,
  discardPolicy,
  checkVictoryCondition,
  getPowerForTrack
};

