/**
 * Estado del juego para El Secreto de Kirchner
 * Maneja toda la lógica del flujo del juego
 */

const { v4: uuidv4 } = require('uuid');
const { generateRoles, getInitialKnowledge, isElJefe, TEAM_TYPES } = require('./roles');
const { createPolicyDeck, drawPolicies, discardPolicy, checkVictoryCondition, getPowerForTrack } = require('./policies');
const { canExecutePower } = require('./powers');

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

class GameState {
  constructor(roomId, roomName, hostId) {
    this.roomId = roomId;
    this.roomName = roomName;
    this.hostId = hostId;
    this.phase = GAME_PHASES.LOBBY;
    
    // Jugadores
    this.players = [];
    this.alivePlayers = [];
    this.deadPlayers = [];
    
    // Gobierno actual
    this.presidentIndex = -1;
    this.cabinetChiefId = null;
    this.previousPresidentId = null;
    this.previousCabinetChiefId = null;
    
    // Elección
    this.nominatedCabinetChiefId = null;
    this.votes = {};
    
    // Legislación
    this.deck = [];
    this.discardPile = [];
    this.currentPolicyCards = [];
    this.presidentDiscardedCard = null;
    
    // Tablero
    this.libertarianPolicies = 0;
    this.kirchneristaPolicies = 0;
    
    // Poderes presidenciales
    this.currentPower = null;
    this.powerInProgress = false;
    
    // Caos y veto
    this.failedGovernments = 0;
    this.vetoUnlocked = false;
    this.vetoRequested = false;
    this.presidentVetoResponse = null;
    this.cabinetChiefVetoResponse = null;
    
    // Sesión especial
    this.specialElectionActive = false;
    
    // Estado del juego
    this.gameStarted = false;
    this.gameOver = false;
    this.winner = null;
    this.winReason = null;
    
    // Control de flujo por host
    this.waitingForHost = false;
    this.pendingAction = null; // Acción pendiente después de que el host continúe
    
    // Configuración
    this.settings = {
      maxPlayers: 10,
      minPlayers: 5
    };
  }

  /**
   * Agrega un jugador a la sala
   */
  addPlayer(socketId, playerName, isAI = false) {
    if (this.gameStarted) {
      return { success: false, message: 'El juego ya comenzó' };
    }

    if (this.players.length >= this.settings.maxPlayers) {
      return { success: false, message: 'La sala está llena' };
    }

    const existingPlayer = this.players.find(p => p.name === playerName);
    if (existingPlayer) {
      return { success: false, message: 'Ya existe un jugador con ese nombre' };
    }

    const player = {
      id: uuidv4(),
      socketId: socketId,
      name: playerName,
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
   */
  removePlayer(socketId) {
    const playerIndex = this.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) return null;

    const player = this.players.splice(playerIndex, 1)[0];
    
    // Si es el host, transferir a otro jugador
    if (this.hostId === player.id && this.players.length > 0) {
      this.hostId = this.players[0].id;
    }

    return player;
  }

  /**
   * Inicia el juego
   */
  startGame() {
    if (this.players.length < this.settings.minPlayers) {
      return { 
        success: false, 
        message: `Se necesitan al menos ${this.settings.minPlayers} jugadores` 
      };
    }

    if (this.players.length > this.settings.maxPlayers) {
      return { 
        success: false, 
        message: `Máximo ${this.settings.maxPlayers} jugadores` 
      };
    }

    try {
      // Generar y asignar roles
      const roles = generateRoles(this.players.length);
      this.players.forEach((player, index) => {
        player.role = roles[index];
      });

      // Crear mazo de decretos
      this.deck = createPolicyDeck();
      this.discardPile = [];

      // Inicializar jugadores vivos
      this.alivePlayers = [...this.players];

      // Establecer primer presidente (aleatorio)
      this.presidentIndex = Math.floor(Math.random() * this.players.length);

      // Cambiar fase
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
   */
  nominateCabinetChief(presidentId, cabinetChiefId) {
    if (this.phase !== GAME_PHASES.NOMINATION) {
      return { success: false, message: 'No es fase de nominación' };
    }

    const president = this.getCurrentPresident();
    if (president.id !== presidentId) {
      return { success: false, message: 'No eres el Presidente' };
    }

    const nominee = this.getPlayerById(cabinetChiefId);
    if (!nominee) {
      return { success: false, message: 'Jugador no encontrado' };
    }

    if (nominee.isDead) {
      return { success: false, message: 'No puedes nominar a un jugador eliminado' };
    }

    // Verificar term limits
    if (this.alivePlayers.length > 5) {
      if (cabinetChiefId === this.previousCabinetChiefId) {
        return { success: false, message: 'No se puede renominar al Jefe de Gabinete anterior' };
      }
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
   * Registra un voto
   */
  castVote(playerId, vote) {
    if (this.phase !== GAME_PHASES.ELECTION) {
      return { success: false, message: 'No es fase de votación' };
    }

    const player = this.getPlayerById(playerId);
    if (!player || player.isDead) {
      return { success: false, message: 'No puedes votar' };
    }

    this.votes[playerId] = vote; // true = Ja! (sí), false = Nein! (no)

    return { success: true };
  }

  /**
   * Cuenta los votos y determina el resultado
   */
  countVotes() {
    const votesArray = Object.values(this.votes);
    const jaVotes = votesArray.filter(v => v === true).length;
    const neinVotes = votesArray.filter(v => v === false).length;
    const majority = Math.ceil(this.alivePlayers.length / 2);

    const approved = jaVotes >= majority;

    if (approved) {
      // Gobierno aprobado
      this.cabinetChiefId = this.nominatedCabinetChiefId;
      this.failedGovernments = 0;
      
      // Verificar victoria kirchnerista si El Jefe es elegido después de 3 decretos
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

      // Avanzar a fase legislativa
      this.phase = GAME_PHASES.LEGISLATIVE_PRESIDENT;
      
      return {
        approved: true,
        jaVotes: jaVotes,
        neinVotes: neinVotes
      };
    } else {
      // Gobierno rechazado
      this.failedGovernments++;
      
      // Verificar caos (3 gobiernos fallidos)
      if (this.failedGovernments >= 3) {
        return this.triggerChaos();
      }

      // Avanzar al siguiente presidente
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
   * Presidente descarta una carta
   */
  presidentDiscardCard(cardIndex) {
    if (this.phase !== GAME_PHASES.LEGISLATIVE_PRESIDENT) {
      return { success: false, message: 'No es fase legislativa del presidente' };
    }

    if (this.currentPolicyCards.length !== 3) {
      return { success: false, message: 'Primero debes robar las cartas' };
    }

    const result = discardPolicy(this.currentPolicyCards, cardIndex);
    this.presidentDiscardedCard = result.discarded;
    this.discardPile.push(result.discarded);
    this.currentPolicyCards = result.remaining;

    // Verificar si el veto está desbloqueado
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
   */
  cabinetChiefEnactPolicy(cardIndex) {
    if (this.phase !== GAME_PHASES.LEGISLATIVE_CABINET && this.phase !== GAME_PHASES.VETO_DECISION) {
      return { success: false, message: 'No es tu turno' };
    }

    if (this.currentPolicyCards.length !== 2) {
      return { success: false, message: 'Error en el estado del juego' };
    }

    const result = discardPolicy(this.currentPolicyCards, cardIndex);
    const enactedPolicy = result.remaining[0];
    this.discardPile.push(result.discarded);
    this.currentPolicyCards = [];
    this.presidentDiscardedCard = null;

    // Promulgar decreto
    if (enactedPolicy.type === 'kirchnerista') {
      this.kirchneristaPolicies++;
    } else {
      this.libertarianPolicies++;
    }

    // Verificar condición de victoria
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

    // Verificar si hay poder presidencial
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

    // No hay poder, avanzar al siguiente presidente
    this.completeRound();
    
    return {
      success: true,
      enactedPolicy: enactedPolicy
    };
  }

  /**
   * Solicita el veto
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

    // Veto aceptado
    this.failedGovernments++;
    this.discardPile.push(...this.currentPolicyCards);
    this.currentPolicyCards = [];
    this.vetoRequested = false;

    // Verificar caos
    if (this.failedGovernments >= 3) {
      return this.triggerChaos();
    }

    // Avanzar al siguiente gobierno
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
    // Guardar gobierno anterior
    const president = this.getCurrentPresident();
    const cabinetChief = this.getPlayerById(this.cabinetChiefId);
    
    this.previousPresidentId = president ? president.id : null;
    this.previousCabinetChiefId = cabinetChief ? cabinetChief.id : null;

    // Limpiar estado
    this.nominatedCabinetChiefId = null;
    this.cabinetChiefId = null;
    this.votes = {};
    this.currentPower = null;
    this.vetoRequested = false;

    // Avanzar presidente
    if (!this.specialElectionActive) {
      this.advancePresident();
    }
    this.specialElectionActive = false;

    // Iniciar nueva nominación
    this.phase = GAME_PHASES.NOMINATION;
  }

  /**
   * Avanza al siguiente presidente
   */
  advancePresident() {
    do {
      this.presidentIndex = (this.presidentIndex + 1) % this.players.length;
    } while (this.players[this.presidentIndex].isDead);
  }

  /**
   * Obtiene el presidente actual
   */
  getCurrentPresident() {
    return this.players[this.presidentIndex];
  }

  /**
   * Obtiene un jugador por ID
   */
  getPlayerById(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  /**
   * Obtiene todos los jugadores IA
   */
  getAIPlayers() {
    return this.players.filter(p => p.isAI);
  }

  /**
   * Verifica si un jugador es IA
   */
  isAIPlayer(playerId) {
    const player = this.getPlayerById(playerId);
    return player ? player.isAI === true : false;
  }

  /**
   * Trigger caos electoral
   */
  triggerChaos() {
    // Revelar la carta superior del mazo
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

    // Verificar victoria
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

