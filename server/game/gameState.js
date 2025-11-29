/**
 * @fileoverview Estado del juego para El Secreto de Kirchner
 * @module game/gameState
 */

const { v4: uuidv4 } = require('uuid');
const { generateRoles, getInitialKnowledge, isElJefe, TEAM_TYPES } = require('./roles');
const { createPolicyDeck, drawPolicies, discardPolicy, checkVictoryCondition, getPowerForTrack } = require('./policies');
const { canExecutePower } = require('./powers');
const { GAME_CONFIG, ERROR_MESSAGES } = require('../config/constants');

/** @type {Object<string, string>} Fases del juego */
const GAME_PHASES = {
  LOBBY: 'lobby',
  ROLE_REVEAL: 'role_reveal',
  NOMINATION: 'nomination',
  ELECTION: 'election',
  LEGISLATIVE_PRESIDENT: 'legislative_president',
  LEGISLATIVE_CABINET: 'legislative_cabinet',
  EXECUTIVE_POWER: 'executive_power',
  VETO_DECISION: 'veto_decision',
  GAME_OVER: 'game_over'
};

/**
 * Clase que maneja el estado completo del juego
 * @class GameState
 */
class GameState {
  /**
   * Crea una instancia de GameState
   * @param {string} roomId - ID único de la sala
   * @param {string} roomName - Nombre de la sala
   * @param {string|null} hostId - ID del jugador host (null al crear)
   */
  constructor(roomId, roomName, hostId) {
    this.roomId = roomId;
    this.roomName = roomName;
    this.hostId = hostId;
    this.phase = GAME_PHASES.LOBBY;
    
    /** @type {Array<Object>} Lista de jugadores */
    this.players = [];
    /** @type {Array<Object>} Jugadores vivos */
    this.alivePlayers = [];
    /** @type {Array<Object>} Jugadores eliminados */
    this.deadPlayers = [];
    
    /** @type {number} Índice del presidente actual */
    this.presidentIndex = -1;
    /** @type {string|null} ID del Jefe de Gabinete actual */
    this.cabinetChiefId = null;
    /** @type {string|null} ID del presidente anterior */
    this.previousPresidentId = null;
    /** @type {string|null} ID del Jefe de Gabinete anterior */
    this.previousCabinetChiefId = null;
    
    /** @type {string|null} ID del Jefe de Gabinete nominado */
    this.nominatedCabinetChiefId = null;
    /** @type {Object<string, boolean>} Votos emitidos */
    this.votes = {};
    
    /** @type {Array<Object>} Mazo de decretos */
    this.deck = [];
    /** @type {Array<Object>} Pila de descarte */
    this.discardPile = [];
    /** @type {Array<Object>} Cartas actuales en juego */
    this.currentPolicyCards = [];
    /** @type {Object|null} Carta descartada por el presidente */
    this.presidentDiscardedCard = null;
    
    /** @type {number} Contador de decretos libertarios */
    this.libertarianPolicies = 0;
    /** @type {number} Contador de decretos kirchneristas */
    this.kirchneristaPolicies = 0;
    
    /** @type {string|null} Poder presidencial actual */
    this.currentPower = null;
    /** @type {boolean} Indica si hay un poder en progreso */
    this.powerInProgress = false;
    
    /** @type {number} Contador de gobiernos fallidos */
    this.failedGovernments = 0;
    /** @type {boolean} Indica si el veto está desbloqueado */
    this.vetoUnlocked = false;
    /** @type {boolean} Indica si se solicitó un veto */
    this.vetoRequested = false;
    /** @type {boolean|null} Respuesta del presidente al veto */
    this.presidentVetoResponse = null;
    /** @type {boolean|null} Respuesta del Jefe de Gabinete al veto */
    this.cabinetChiefVetoResponse = null;
    
    /** @type {boolean} Indica si hay una sesión especial activa */
    this.specialElectionActive = false;
    
    /** @type {boolean} Indica si el juego ha comenzado */
    this.gameStarted = false;
    /** @type {boolean} Indica si el juego terminó */
    this.gameOver = false;
    /** @type {string|null} Equipo ganador */
    this.winner = null;
    /** @type {string|null} Razón de la victoria */
    this.winReason = null;
    
    /** @type {boolean} Indica si se está esperando al host */
    this.waitingForHost = false;
    /** @type {string|null} Acción pendiente */
    this.pendingAction = null;
    
    /** @type {Object} Configuración del juego */
    this.settings = {
      maxPlayers: GAME_CONFIG.MAX_PLAYERS,
      minPlayers: GAME_CONFIG.MIN_PLAYERS
    };
  }

  /**
   * Agrega un jugador a la sala
   * @param {string} socketId - ID del socket del jugador
   * @param {string} playerName - Nombre del jugador
   * @param {boolean} [isAI=false] - Indica si es un jugador IA
   * @returns {Object} Resultado con success, player y message
   */
  addPlayer(socketId, playerName, isAI = false) {
    if (!socketId || !playerName) {
      return { success: false, message: 'SocketId y nombre de jugador son requeridos' };
    }

    if (typeof playerName !== 'string' || playerName.trim().length === 0) {
      return { success: false, message: 'Nombre de jugador inválido' };
    }

    if (this.gameStarted) {
      return { success: false, message: ERROR_MESSAGES.GAME_STARTED };
    }

    if (this.players.length >= this.settings.maxPlayers) {
      return { success: false, message: ERROR_MESSAGES.ROOM_FULL };
    }

    const existingPlayer = this.players.find(p => p.name === playerName.trim());
    if (existingPlayer) {
      return { success: false, message: ERROR_MESSAGES.DUPLICATE_NAME };
    }

    const player = {
      id: uuidv4(),
      socketId: socketId,
      name: playerName.trim(),
      role: null,
      isDead: false,
      isReady: false,
      wasInvestigated: false,
      votes: [],
      isAI: isAI
    };

    this.players.push(player);
    
    return { 
      success: true, 
      player: player,
      message: `${playerName} se unió a la sala` 
    };
  }

  /**
   * Remueve un jugador de la sala
   * @param {string} socketId - ID del socket del jugador a remover
   * @returns {Object|null} Jugador removido o null si no existe
   */
  removePlayer(socketId) {
    const playerIndex = this.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) return null;

    const player = this.players.splice(playerIndex, 1)[0];
    
    if (this.hostId === player.id && this.players.length > 0) {
      this.hostId = this.players[0].id;
    }

    return player;
  }

  /**
   * Inicia el juego, asigna roles y crea el mazo
   * @returns {Object} Resultado con success, message y knowledge
   */
  startGame() {
    if (this.players.length < this.settings.minPlayers) {
      return { 
        success: false, 
        message: ERROR_MESSAGES.MIN_PLAYERS
      };
    }

    if (this.players.length > this.settings.maxPlayers) {
      return { 
        success: false, 
        message: ERROR_MESSAGES.MAX_PLAYERS
      };
    }

    try {
      const roles = generateRoles(this.players.length);
      this.players.forEach((player, index) => {
        player.role = roles[index];
      });

      this.deck = createPolicyDeck();
      this.discardPile = [];
      this.alivePlayers = [...this.players];
      this.presidentIndex = Math.floor(Math.random() * this.players.length);
      this.gameStarted = true;
      this.phase = GAME_PHASES.ROLE_REVEAL;

      return { 
        success: true, 
        message: '¡El juego ha comenzado!',
        knowledge: getInitialKnowledge(this.players)
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Error al iniciar: ${error.message}` 
      };
    }
  }

  /**
   * Avanza a la fase de nominación
   * @returns {Object} Resultado con success, presidentId y message
   */
  startNominationPhase() {
    this.phase = GAME_PHASES.NOMINATION;
    this.nominatedCabinetChiefId = null;
    this.votes = {};
    
    return {
      success: true,
      presidentId: this.getCurrentPresident().id,
      message: 'Fase de nominación'
    };
  }

  /**
   * Pausa el juego esperando que el host continúe
   * @param {string} action - Acción a ejecutar cuando el host continúe
   * @param {string} [message='Esperando que el host continúe...'] - Mensaje de espera
   * @returns {Object} Resultado con success, message y waitingForHost
   */
  pauseForHost(action, message = 'Esperando que el host continúe...') {
    this.waitingForHost = true;
    this.pendingAction = action;
    return {
      success: true,
      message: message,
      waitingForHost: true
    };
  }

  /**
   * El host continúa a la siguiente fase
   * @returns {Object} Resultado con success, action y message
   */
  hostContinue() {
    if (!this.waitingForHost) {
      return {
        success: false,
        message: 'El juego no está esperando continuación'
      };
    }

    this.waitingForHost = false;
    const action = this.pendingAction;
    this.pendingAction = null;

    return {
      success: true,
      action: action,
      message: 'Continuando juego...'
    };
  }

  /**
   * Nomina un Jefe de Gabinete
   * @param {string} presidentId - ID del presidente que nomina
   * @param {string} cabinetChiefId - ID del jugador a nominar
   * @returns {Object} Resultado con success, cabinetChiefId y message
   */
  nominateCabinetChief(presidentId, cabinetChiefId) {
    if (!presidentId || !cabinetChiefId) {
      return { success: false, message: 'IDs de presidente y candidato requeridos' };
    }

    if (this.phase !== GAME_PHASES.NOMINATION) {
      return { success: false, message: ERROR_MESSAGES.INVALID_PHASE };
    }

    const president = this.getCurrentPresident();
    if (!president || president.id !== presidentId) {
      return { success: false, message: 'No eres el Presidente' };
    }

    const nominee = this.getPlayerById(cabinetChiefId);
    if (!nominee) {
      return { success: false, message: ERROR_MESSAGES.PLAYER_NOT_FOUND };
    }

    if (nominee.isDead) {
      return { success: false, message: 'No puedes nominar a un jugador eliminado' };
    }

    // Verificar term limits
    if (this.alivePlayers.length > 5 && cabinetChiefId === this.previousCabinetChiefId) {
      return { success: false, message: 'No se puede renominar al Jefe de Gabinete anterior' };
    }

    this.nominatedCabinetChiefId = cabinetChiefId;
    this.phase = GAME_PHASES.ELECTION;
    this.votes = {};

    return {
      success: true,
      cabinetChiefId: cabinetChiefId,
      message: `${nominee.name} ha sido nominado como Jefe de Gabinete`
    };
  }

  /**
   * Registra un voto en la elección actual
   * @param {string} playerId - ID del jugador que vota
   * @param {boolean} vote - true para "Ja!" (sí), false para "Nein!" (no)
   * @returns {Object} Resultado con success
   */
  castVote(playerId, vote) {
    if (!playerId || typeof vote !== 'boolean') {
      return { success: false, message: 'PlayerId y voto válido requeridos' };
    }

    if (this.phase !== GAME_PHASES.ELECTION) {
      return { success: false, message: ERROR_MESSAGES.INVALID_PHASE };
    }

    const player = this.getPlayerById(playerId);
    if (!player || player.isDead) {
      return { success: false, message: 'No puedes votar' };
    }

    this.votes[playerId] = vote; // true = Ja! (sí), false = Nein! (no)

    return { success: true };
  }

  /**
   * Cuenta los votos y determina el resultado de la elección
   * @returns {Object} Resultado con approved, jaVotes, neinVotes y posiblemente gameOver
   */
  countVotes() {
    const votesArray = Object.values(this.votes);
    const jaVotes = votesArray.filter(v => v === true).length;
    const neinVotes = votesArray.filter(v => v === false).length;
    const majority = Math.ceil(this.alivePlayers.length / 2);
    const approved = jaVotes >= majority;

    if (approved) {
      this.cabinetChiefId = this.nominatedCabinetChiefId;
      this.failedGovernments = 0;
      
      const cabinetChief = this.getPlayerById(this.cabinetChiefId);
      if (this.kirchneristaPolicies >= 3 && isElJefe(cabinetChief.role)) {
        this.gameOver = true;
        this.winner = TEAM_TYPES.KIRCHNERISTAS;
        this.winReason = '¡El Jefe fue elegido Jefe de Gabinete con 3+ decretos kirchneristas!';
        this.phase = GAME_PHASES.GAME_OVER;
        
        return {
          approved: true,
          gameOver: true,
          winner: this.winner,
          winReason: this.winReason
        };
      }

      this.phase = GAME_PHASES.LEGISLATIVE_PRESIDENT;
      
      return {
        approved: true,
        jaVotes: jaVotes,
        neinVotes: neinVotes
      };
    } else {
      this.failedGovernments++;
      
      if (this.failedGovernments >= 3) {
        return this.triggerChaos();
      }

      this.advancePresident();
      this.phase = GAME_PHASES.NOMINATION;
      
      return {
        approved: false,
        jaVotes: jaVotes,
        neinVotes: neinVotes,
        failedGovernments: this.failedGovernments
      };
    }
  }

  /**
   * Roba 3 cartas para el Presidente
   * @returns {Object} Resultado con success y cards
   */
  presidentDrawCards() {
    if (this.phase !== GAME_PHASES.LEGISLATIVE_PRESIDENT) {
      return { success: false, message: 'No es fase legislativa del presidente' };
    }

    const result = drawPolicies(this.deck, this.discardPile);
    this.deck = result.remainingDeck;
    this.discardPile = result.discardPile;
    this.currentPolicyCards = result.cards;

    return {
      success: true,
      cards: result.cards
    };
  }

  /**
   * Presidente descarta una carta de las 3 recibidas
   * @param {number} cardIndex - Índice de la carta a descartar (0-2)
   * @returns {Object} Resultado con success y remainingCards
   */
  presidentDiscardCard(cardIndex) {
    if (typeof cardIndex !== 'number' || cardIndex < 0) {
      return { success: false, message: 'Índice de carta inválido' };
    }

    if (this.phase !== GAME_PHASES.LEGISLATIVE_PRESIDENT) {
      return { success: false, message: ERROR_MESSAGES.INVALID_PHASE };
    }

    if (this.currentPolicyCards.length !== 3) {
      return { success: false, message: 'Primero debes robar las cartas' };
    }

    if (cardIndex >= this.currentPolicyCards.length) {
      return { success: false, message: 'Índice de carta fuera de rango' };
    }

    const result = discardPolicy(this.currentPolicyCards, cardIndex);
    this.presidentDiscardedCard = result.discarded;
    this.discardPile.push(result.discarded);
    this.currentPolicyCards = result.remaining;

    if (this.kirchneristaPolicies >= 5) {
      this.vetoUnlocked = true;
    }

    this.phase = GAME_PHASES.LEGISLATIVE_CABINET;

    return {
      success: true,
      remainingCards: 2
    };
  }

  /**
   * Jefe de Gabinete elige una carta para promulgar
   * @param {number} cardIndex - Índice de la carta a promulgar (0-1)
   * @returns {Object} Resultado con success, enactedPolicy y posiblemente gameOver/power
   */
  cabinetChiefEnactPolicy(cardIndex) {
    if (typeof cardIndex !== 'number' || cardIndex < 0) {
      return { success: false, message: 'Índice de carta inválido' };
    }

    if (this.phase !== GAME_PHASES.LEGISLATIVE_CABINET && this.phase !== GAME_PHASES.VETO_DECISION) {
      return { success: false, message: ERROR_MESSAGES.INVALID_PHASE };
    }

    if (this.currentPolicyCards.length !== 2) {
      return { success: false, message: 'Error en el estado del juego' };
    }

    if (cardIndex >= this.currentPolicyCards.length) {
      return { success: false, message: 'Índice de carta fuera de rango' };
    }

    // La carta promulgada es la que el usuario seleccionó
    const enactedPolicy = this.currentPolicyCards[cardIndex];
    
    // La carta descartada es la otra (la que NO se promulgó)
    const discardedIndex = cardIndex === 0 ? 1 : 0;
    const discardedPolicy = this.currentPolicyCards[discardedIndex];
    
    this.discardPile.push(discardedPolicy);
    this.currentPolicyCards = [];
    this.presidentDiscardedCard = null;

    if (enactedPolicy.type === 'kirchnerista') {
      this.kirchneristaPolicies++;
    } else {
      this.libertarianPolicies++;
    }

    const victory = checkVictoryCondition(this.kirchneristaPolicies, this.libertarianPolicies);
    if (victory) {
      this.gameOver = true;
      this.winner = victory.winner;
      this.winReason = victory.reason;
      this.phase = GAME_PHASES.GAME_OVER;
      
      return {
        success: true,
        enactedPolicy: enactedPolicy,
        gameOver: true,
        winner: this.winner,
        winReason: this.winReason
      };
    }

    const power = getPowerForTrack(this.kirchneristaPolicies, this.players.length);
    if (enactedPolicy.type === 'kirchnerista' && power) {
      this.currentPower = power;
      this.phase = GAME_PHASES.EXECUTIVE_POWER;
      
      return {
        success: true,
        enactedPolicy: enactedPolicy,
        power: power
      };
    }

    this.completeRound();
    
    return {
      success: true,
      enactedPolicy: enactedPolicy
    };
  }

  /**
   * Solicita el veto presidencial
   * @param {string} cabinetChiefId - ID del Jefe de Gabinete que solicita
   * @returns {Object} Resultado con success
   */
  requestVeto(cabinetChiefId) {
    if (!this.vetoUnlocked) {
      return { success: false, message: 'El veto no está desbloqueado' };
    }

    if (this.cabinetChiefId !== cabinetChiefId) {
      return { success: false, message: 'Solo el Jefe de Gabinete puede solicitar el veto' };
    }

    this.vetoRequested = true;
    this.phase = GAME_PHASES.VETO_DECISION;

    return { success: true };
  }

  /**
   * Respuesta del Presidente al veto
   * @param {string} presidentId - ID del presidente
   * @param {boolean} accepts - true si acepta el veto, false si lo rechaza
   * @returns {Object} Resultado con success y estado del veto
   */
  respondToVeto(presidentId, accepts) {
    if (!this.vetoRequested) {
      return { success: false, message: 'No hay veto solicitado' };
    }

    const president = this.getCurrentPresident();
    if (president.id !== presidentId) {
      return { success: false, message: 'No eres el Presidente' };
    }

    if (!accepts) {
      // Presidente rechaza el veto, Jefe de Gabinete debe elegir
      this.vetoRequested = false;
      this.phase = GAME_PHASES.LEGISLATIVE_CABINET;
      return { 
        success: true, 
        vetoRejected: true,
        message: 'El Presidente rechazó el veto' 
      };
    }

    this.failedGovernments++;
    this.discardPile.push(...this.currentPolicyCards);
    this.currentPolicyCards = [];
    this.vetoRequested = false;

    if (this.failedGovernments >= 3) {
      return this.triggerChaos();
    }

    this.completeRound();

    return {
      success: true,
      vetoAccepted: true,
      failedGovernments: this.failedGovernments
    };
  }

  /**
   * Completa una ronda y avanza al siguiente presidente
   */
  completeRound() {
    const president = this.getCurrentPresident();
    const cabinetChief = this.getPlayerById(this.cabinetChiefId);
    
    this.previousPresidentId = president ? president.id : null;
    this.previousCabinetChiefId = cabinetChief ? cabinetChief.id : null;

    this.nominatedCabinetChiefId = null;
    this.cabinetChiefId = null;
    this.votes = {};
    this.currentPower = null;
    this.vetoRequested = false;

    if (!this.specialElectionActive) {
      this.advancePresident();
    }
    this.specialElectionActive = false;
    this.phase = GAME_PHASES.NOMINATION;
  }

  /**
   * Avanza al siguiente presidente en la lista de jugadores
   */
  advancePresident() {
    do {
      this.presidentIndex = (this.presidentIndex + 1) % this.players.length;
    } while (this.players[this.presidentIndex].isDead);
  }

  /**
   * Obtiene el presidente actual
   * @returns {Object|null} Jugador presidente o null
   */
  getCurrentPresident() {
    return this.players[this.presidentIndex];
  }

  /**
   * Obtiene un jugador por ID
   * @param {string} playerId - ID del jugador
   * @returns {Object|undefined} Jugador encontrado
   */
  getPlayerById(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  /**
   * Obtiene todos los jugadores IA
   * @returns {Array<Object>} Lista de jugadores IA
   */
  getAIPlayers() {
    return this.players.filter(p => p.isAI);
  }

  /**
   * Verifica si un jugador es IA
   * @param {string} playerId - ID del jugador
   * @returns {boolean} True si es IA
   */
  isAIPlayer(playerId) {
    const player = this.getPlayerById(playerId);
    return player ? player.isAI === true : false;
  }

  /**
   * Activa el caos electoral (3 gobiernos fallidos)
   * @returns {Object} Resultado con chaos, revealedPolicy y posiblemente gameOver
   */
  triggerChaos() {
    if (this.deck.length === 0) {
      const result = drawPolicies(this.deck, this.discardPile);
      this.deck = result.remainingDeck;
      this.discardPile = result.discardPile;
    }

    const topCard = this.deck.shift();
    
    if (topCard.type === 'kirchnerista') {
      this.kirchneristaPolicies++;
    } else {
      this.libertarianPolicies++;
    }

    this.failedGovernments = 0;

    const victory = checkVictoryCondition(this.kirchneristaPolicies, this.libertarianPolicies);
    if (victory) {
      this.gameOver = true;
      this.winner = victory.winner;
      this.winReason = `${victory.reason} (por caos electoral)`;
      this.phase = GAME_PHASES.GAME_OVER;
    } else {
      this.advancePresident();
      this.phase = GAME_PHASES.NOMINATION;
    }

    return {
      chaos: true,
      revealedPolicy: topCard,
      gameOver: this.gameOver,
      winner: this.winner,
      winReason: this.winReason
    };
  }

  /**
   * Serializa el estado del juego para enviar a clientes
   * @returns {Object} Estado serializado del juego
   */
  toJSON() {
    return {
      roomId: this.roomId,
      roomName: this.roomName,
      hostId: this.hostId,
      phase: this.phase,
      players: this.players,
      presidentIndex: this.presidentIndex,
      cabinetChiefId: this.cabinetChiefId,
      nominatedCabinetChiefId: this.nominatedCabinetChiefId,
      libertarianPolicies: this.libertarianPolicies,
      kirchneristaPolicies: this.kirchneristaPolicies,
      failedGovernments: this.failedGovernments,
      vetoUnlocked: this.vetoUnlocked,
      deckSize: this.deck.length,
      discardSize: this.discardPile.length,
      gameStarted: this.gameStarted,
      gameOver: this.gameOver,
      winner: this.winner,
      winReason: this.winReason,
      waitingForHost: this.waitingForHost,
      pendingAction: this.pendingAction
    };
  }
}

module.exports = { GameState, GAME_PHASES };

