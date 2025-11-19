/**
 * Sistema de Inteligencia Artificial para El Secreto de Kirchner
 * Implementa comportamiento de bots con diferentes niveles de dificultad
 */

const { isElJefe, isKirchnerista, TEAM_TYPES } = require('./roles');

// Niveles de dificultad
const AI_DIFFICULTY = {
  EASY: 'easy',      // Decisiones muy aleatorias
  MEDIUM: 'medium',  // Estrategia básica
  HARD: 'hard'       // Estrategia avanzada
};

class AIPlayer {
  constructor(difficulty = AI_DIFFICULTY.MEDIUM) {
    this.difficulty = difficulty;
    this.suspicionLevels = {}; // Registro de sospecha sobre otros jugadores
    this.trustLevels = {};     // Registro de confianza en otros jugadores
  }

  /**
   * Decide nominación de Jefe de Gabinete
   */
  nominateCabinetChief(gameState, aiPlayer) {
    const eligiblePlayers = gameState.alivePlayers.filter(p => {
      if (p.id === aiPlayer.id) return false;
      if (p.isDead) return false;
      
      // Term limits
      if (gameState.alivePlayers.length > 5) {
        if (p.id === gameState.previousCabinetChiefId) return false;
      }
      
      return true;
    });

    if (eligiblePlayers.length === 0) return null;

    // Estrategia según rol
    if (isKirchnerista(aiPlayer.role)) {
      return this._kirchneristaNomination(gameState, aiPlayer, eligiblePlayers);
    } else {
      return this._libertarianNomination(gameState, aiPlayer, eligiblePlayers);
    }
  }

  /**
   * Estrategia de nominación para kirchneristas
   */
  _kirchneristaNomination(gameState, aiPlayer, eligiblePlayers) {
    // Si soy El Jefe y hay 3+ decretos kirchneristas, intentar ser nominado es imposible
    // Nominar a otro kirchnerista conocido si es posible
    
    if (this.difficulty === AI_DIFFICULTY.HARD) {
      // Buscar jugadores con alta confianza
      const trusted = eligiblePlayers.filter(p => 
        (this.trustLevels[p.id] || 0) > 0
      );
      
      if (trusted.length > 0) {
        return this._selectRandom(trusted).id;
      }
    }

    // Por defecto, selección aleatoria
    return this._selectRandom(eligiblePlayers).id;
  }

  /**
   * Estrategia de nominación para libertarios
   */
  _libertarianNomination(gameState, aiPlayer, eligiblePlayers) {
    if (this.difficulty === AI_DIFFICULTY.HARD) {
      // Evitar jugadores sospechosos
      const lesssuspicious = eligiblePlayers.filter(p => 
        (this.suspicionLevels[p.id] || 0) < 3
      );
      
      if (lesssuspicious.length > 0) {
        return this._selectRandom(lesssuspicious).id;
      }
    }

    return this._selectRandom(eligiblePlayers).id;
  }

  /**
   * Decide voto en elección
   */
  voteOnGovernment(gameState, aiPlayer) {
    const presidentId = gameState.players[gameState.presidentIndex].id;
    const cabinetChiefId = gameState.nominatedCabinetChiefId;
    const president = gameState.getPlayerById(presidentId);
    const cabinetChief = gameState.getPlayerById(cabinetChiefId);

    // Kirchneristas
    if (isKirchnerista(aiPlayer.role)) {
      return this._kirchneristaVote(gameState, aiPlayer, president, cabinetChief);
    } 
    // Libertarios
    else {
      return this._libertarianVote(gameState, aiPlayer, president, cabinetChief);
    }
  }

  /**
   * Voto kirchnerista
   */
  _kirchneristaVote(gameState, aiPlayer, president, cabinetChief) {
    // Si alguno es kirchnerista conocido, votar Ja!
    if (isKirchnerista(president.role) || isKirchnerista(cabinetChief.role)) {
      return this._randomizeDecision(true, 0.9); // 90% Ja
    }

    // Si hay muchos gobiernos fallidos, considerar votar Ja para evitar caos
    if (gameState.failedGovernments >= 2) {
      return this._randomizeDecision(true, 0.7);
    }

    // Si hay muchos decretos libertarios, votar Ja para tener oportunidad
    if (gameState.libertarianPolicies >= 3) {
      return this._randomizeDecision(true, 0.6);
    }

    // Por defecto, comportamiento más cauteloso
    return this._randomizeDecision(true, 0.4);
  }

  /**
   * Voto libertario
   */
  _libertarianVote(gameState, aiPlayer, president, cabinetChief) {
    // Si hay 3+ decretos kirchneristas y el JG podría ser El Jefe, votar Nein
    if (gameState.kirchneristaPolicies >= 3) {
      if (this.suspicionLevels[cabinetChief.id] >= 2) {
        return this._randomizeDecision(false, 0.9); // 90% Nein
      }
    }

    // Confiar en gobiernos anteriores exitosos
    if (this.trustLevels[president.id] > 0 || this.trustLevels[cabinetChief.id] > 0) {
      return this._randomizeDecision(true, 0.7);
    }

    // Si hay muchos gobiernos fallidos, votar Ja
    if (gameState.failedGovernments >= 2) {
      return this._randomizeDecision(true, 0.8);
    }

    // Por defecto, algo conservador
    return this._randomizeDecision(true, 0.55);
  }

  /**
   * Presidente descarta una carta
   */
  presidentDiscard(cards, aiPlayer, gameState) {
    if (isKirchnerista(aiPlayer.role)) {
      // Kirchneristas quieren promulgar decretos kirchneristas
      const libertarianIndex = cards.findIndex(c => c.type === 'libertarian');
      if (libertarianIndex !== -1) return libertarianIndex;
      
      // Si solo hay kirchneristas, descartar uno
      return 0;
    } else {
      // Libertarios quieren promulgar decretos libertarios
      const kirchneristaIndex = cards.findIndex(c => c.type === 'kirchnerista');
      if (kirchneristaIndex !== -1) return kirchneristaIndex;
      
      // Si solo hay libertarios, descartar uno
      return 0;
    }
  }

  /**
   * Jefe de Gabinete elige carta para promulgar
   */
  cabinetChiefEnact(cards, aiPlayer, gameState) {
    if (isKirchnerista(aiPlayer.role)) {
      // Promulgar kirchnerista si está disponible
      const kirchneristaIndex = cards.findIndex(c => c.type === 'kirchnerista');
      if (kirchneristaIndex !== -1) return kirchneristaIndex;
      
      // Si no hay opción, promulgar lo que haya
      return 0;
    } else {
      // Promulgar libertario si está disponible
      const libertarianIndex = cards.findIndex(c => c.type === 'libertarian');
      if (libertarianIndex !== -1) return libertarianIndex;
      
      // Si no hay opción, promulgar lo que haya
      return 0;
    }
  }

  /**
   * Decide si solicitar veto
   */
  shouldRequestVeto(cards, aiPlayer, gameState) {
    if (!gameState.vetoUnlocked) return false;

    if (isKirchnerista(aiPlayer.role)) {
      // Si ambas cartas son libertarias, considerar veto
      const allLibertarian = cards.every(c => c.type === 'libertarian');
      if (allLibertarian) {
        return this._randomizeDecision(true, 0.7);
      }
    } else {
      // Si ambas cartas son kirchneristas y hay 4+ decretos, considerar veto
      const allKirchnerista = cards.every(c => c.type === 'kirchnerista');
      if (allKirchnerista && gameState.kirchneristaPolicies >= 4) {
        return this._randomizeDecision(true, 0.8);
      }
    }

    return false;
  }

  /**
   * Respuesta del presidente al veto
   */
  respondToVeto(aiPlayer, gameState) {
    // Generalmente aceptar el veto si hay buenas razones
    if (gameState.failedGovernments >= 1) {
      return this._randomizeDecision(false, 0.7); // Rechazar para evitar caos
    }

    return this._randomizeDecision(true, 0.6); // Aceptar veto
  }

  /**
   * Elige jugador para investigar
   */
  chooseInvestigationTarget(gameState, aiPlayer) {
    const eligiblePlayers = gameState.alivePlayers.filter(p => {
      if (p.id === aiPlayer.id) return false;
      if (p.wasInvestigated) return false;
      if (p.isDead) return false;
      return true;
    });

    if (eligiblePlayers.length === 0) return null;

    if (this.difficulty === AI_DIFFICULTY.HARD) {
      // Investigar a los más sospechosos
      const suspicious = eligiblePlayers.filter(p => 
        (this.suspicionLevels[p.id] || 0) > 0
      );
      
      if (suspicious.length > 0) {
        return this._selectRandom(suspicious).id;
      }
    }

    return this._selectRandom(eligiblePlayers).id;
  }

  /**
   * Elige jugador para elección especial
   */
  chooseSpecialElectionTarget(gameState, aiPlayer) {
    const eligiblePlayers = gameState.alivePlayers.filter(p => {
      if (p.id === aiPlayer.id) return false;
      if (p.isDead) return false;
      return true;
    });

    if (eligiblePlayers.length === 0) return null;

    if (isKirchnerista(aiPlayer.role)) {
      // Elegir aliados conocidos
      if (this.difficulty === AI_DIFFICULTY.HARD) {
        const trusted = eligiblePlayers.filter(p => 
          (this.trustLevels[p.id] || 0) > 0
        );
        
        if (trusted.length > 0) {
          return this._selectRandom(trusted).id;
        }
      }
    } else {
      // Elegir jugadores confiables
      if (this.difficulty === AI_DIFFICULTY.HARD) {
        const trusted = eligiblePlayers.filter(p => 
          (this.trustLevels[p.id] || 0) > 0 && 
          (this.suspicionLevels[p.id] || 0) === 0
        );
        
        if (trusted.length > 0) {
          return this._selectRandom(trusted).id;
        }
      }
    }

    return this._selectRandom(eligiblePlayers).id;
  }

  /**
   * Elige jugador para ejecutar
   */
  chooseExecutionTarget(gameState, aiPlayer) {
    const eligiblePlayers = gameState.alivePlayers.filter(p => {
      if (p.id === aiPlayer.id) return false;
      if (p.isDead) return false;
      return true;
    });

    if (eligiblePlayers.length === 0) return null;

    if (isKirchnerista(aiPlayer.role)) {
      // Ejecutar libertarios conocidos o sospechosos de ser El Jefe
      // En este caso, kirchneristas pueden querer eliminar amenazas
      if (this.difficulty === AI_DIFFICULTY.HARD) {
        const threats = eligiblePlayers.filter(p => 
          (this.suspicionLevels[p.id] || 0) < 0 // Negativo = sospecha de ser libertario
        );
        
        if (threats.length > 0) {
          return this._selectRandom(threats).id;
        }
      }
    } else {
      // Libertarios ejecutan a los más sospechosos de ser kirchneristas
      if (this.difficulty === AI_DIFFICULTY.HARD) {
        // Ordenar por sospecha
        const sorted = [...eligiblePlayers].sort((a, b) => 
          (this.suspicionLevels[b.id] || 0) - (this.suspicionLevels[a.id] || 0)
        );
        
        if (sorted.length > 0 && (this.suspicionLevels[sorted[0].id] || 0) > 0) {
          return sorted[0].id;
        }
      }
    }

    return this._selectRandom(eligiblePlayers).id;
  }

  /**
   * Actualiza niveles de confianza/sospecha basado en acciones
   */
  updateTrustLevels(gameState, presidentId, cabinetChiefId, enactedPolicy) {
    if (!enactedPolicy) return;

    // Si se promulgó un decreto kirchnerista, aumentar sospecha
    if (enactedPolicy.type === 'kirchnerista') {
      this.suspicionLevels[presidentId] = (this.suspicionLevels[presidentId] || 0) + 1;
      this.suspicionLevels[cabinetChiefId] = (this.suspicionLevels[cabinetChiefId] || 0) + 1;
      this.trustLevels[presidentId] = (this.trustLevels[presidentId] || 0) - 1;
      this.trustLevels[cabinetChiefId] = (this.trustLevels[cabinetChiefId] || 0) - 1;
    } 
    // Si se promulgó libertario, reducir sospecha
    else {
      this.suspicionLevels[presidentId] = (this.suspicionLevels[presidentId] || 0) - 1;
      this.suspicionLevels[cabinetChiefId] = (this.suspicionLevels[cabinetChiefId] || 0) - 1;
      this.trustLevels[presidentId] = (this.trustLevels[presidentId] || 0) + 1;
      this.trustLevels[cabinetChiefId] = (this.trustLevels[cabinetChiefId] || 0) + 1;
    }
  }

  /**
   * Actualiza después de investigación
   */
  updateAfterInvestigation(targetId, loyalty) {
    if (loyalty === TEAM_TYPES.KIRCHNERISTAS) {
      this.suspicionLevels[targetId] = 5; // Alta sospecha
      this.trustLevels[targetId] = -5;
    } else {
      this.suspicionLevels[targetId] = -5; // Baja sospecha (es libertario)
      this.trustLevels[targetId] = 5;
    }
  }

  /**
   * Selecciona elemento aleatorio de array
   */
  _selectRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Aleatoriza una decisión con cierta probabilidad
   */
  _randomizeDecision(preferredDecision, probability) {
    // Ajustar por dificultad
    let adjustedProbability = probability;
    
    if (this.difficulty === AI_DIFFICULTY.EASY) {
      adjustedProbability = 0.5; // Completamente aleatorio
    } else if (this.difficulty === AI_DIFFICULTY.MEDIUM) {
      adjustedProbability = (probability + 0.5) / 2; // Promedio
    }

    return Math.random() < adjustedProbability ? preferredDecision : !preferredDecision;
  }

  /**
   * Genera un mensaje de chat aleatorio (opcional)
   */
  generateChatMessage(context, gameState) {
    // Mensajes opcionales para hacer el juego más interesante
    const messages = {
      afterVote: [
        "Espero que hayamos tomado la decisión correcta...",
        "¡Vamos que vamos!",
        "No confío en este gobierno",
        "Hay que ser estratégicos"
      ],
      afterPolicy: [
        "Interesante decreto...",
        "Esto se está poniendo tenso",
        "¿Alguien más sospecha de esto?",
        "Hay que mantenerse alerta"
      ]
    };

    const contextMessages = messages[context] || [];
    if (contextMessages.length === 0 || Math.random() > 0.3) {
      return null; // 70% de las veces no enviar mensaje
    }

    return this._selectRandom(contextMessages);
  }
}

/**
 * Genera nombres para IAs
 */
function generateAIName(index) {
  const names = [
    "Bot Néstor",
    "Bot Cristina", 
    "Bot Milei",
    "Bot Macri",
    "Bot Alberto",
    "Bot Massa",
    "Bot Scioli",
    "Bot Bullrich",
    "Bot Larreta",
    "Bot Kicillof"
  ];
  
  return names[index % names.length];
}

module.exports = {
  AIPlayer,
  AI_DIFFICULTY,
  generateAIName
};

