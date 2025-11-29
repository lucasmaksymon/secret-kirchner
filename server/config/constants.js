/**
 * Constantes de configuración del servidor
 */

const DEFAULT_PORT = 3000;
const DEFAULT_CLIENT_URL = 'http://localhost:4200';

const GAME_CONFIG = {
  MIN_PLAYERS: 5,
  MAX_PLAYERS: 10,
  ROOM_ID_LENGTH: 6,
  MAX_AI_NAME_ATTEMPTS: 50
};

const SOCKET_EVENTS = {
  // Lobby
  CREATE_ROOM: 'create-room',
  JOIN_ROOM: 'join-room',
  REJOIN_ROOM: 'rejoin-room',
  GET_ROOMS: 'get-rooms',
  START_GAME: 'start-game',
  ADD_AI: 'add-ai',
  REMOVE_AI: 'remove-ai',
  
  // Game
  NOMINATE_CABINET_CHIEF: 'nominate-cabinet-chief',
  CAST_VOTE: 'cast-vote',
  PRESIDENT_DISCARD: 'president-discard',
  CABINET_CHIEF_ENACT: 'cabinet-chief-enact',
  REQUEST_VETO: 'request-veto',
  RESPOND_VETO: 'respond-veto',
  
  // Powers
  EXECUTE_PEEK: 'execute-peek',
  EXECUTE_INVESTIGATE: 'execute-investigate',
  EXECUTE_SPECIAL_ELECTION: 'execute-special-election',
  EXECUTE_EXECUTION: 'execute-execution',
  
  // Chat
  SEND_MESSAGE: 'send-message',
  
  // Voice
  VOICE_JOIN: 'voice-join',
  VOICE_LEAVE: 'voice-leave',
  VOICE_OFFER: 'voice-offer',
  VOICE_ANSWER: 'voice-answer',
  VOICE_ICE_CANDIDATE: 'voice-ice-candidate',
  VOICE_MUTE_STATUS: 'voice-mute-status'
};

const AI_DELAYS = {
  MIN: 2000,  // 2 segundos
  MAX: 4000   // 4 segundos
};

const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: 'Sala no encontrada',
  PLAYER_NOT_FOUND: 'Jugador no encontrado',
  GAME_STARTED: 'El juego ya comenzó',
  ROOM_FULL: 'La sala está llena',
  DUPLICATE_NAME: 'Ya existe un jugador con ese nombre',
  NOT_HOST: 'Solo el host puede realizar esta acción',
  INVALID_PHASE: 'No es el momento adecuado para esta acción',
  INVALID_PLAYER: 'Jugador inválido o no encontrado',
  MIN_PLAYERS: `Se necesitan al menos ${GAME_CONFIG.MIN_PLAYERS} jugadores`,
  MAX_PLAYERS: `Máximo ${GAME_CONFIG.MAX_PLAYERS} jugadores`,
  AI_NOT_FOUND: 'Jugador IA no encontrado',
  NOT_AI: 'El jugador no es una IA',
  CANNOT_ADD_AI_AFTER_START: 'No se pueden agregar IAs una vez iniciado el juego'
};

module.exports = {
  DEFAULT_PORT,
  DEFAULT_CLIENT_URL,
  GAME_CONFIG,
  SOCKET_EVENTS,
  ERROR_MESSAGES,
  AI_DELAYS
};

