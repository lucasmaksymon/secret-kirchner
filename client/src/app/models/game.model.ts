/**
 * Modelos e interfaces para El Secreto de Kirchner
 */

export interface Role {
  type: 'libertario' | 'kirchnerista' | 'el_jefe';
  team: 'libertarios' | 'kirchneristas';
  isElJefe?: boolean;
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  role: Role | null;
  isDead: boolean;
  isReady: boolean;
  wasInvestigated: boolean;
  votes: any[];
  isAI?: boolean;
}

export interface Policy {
  type: 'kirchnerista' | 'libertario';
  name: string;
  id: string;
}

export interface GameState {
  roomId: string;
  roomName: string;
  hostId: string;
  phase: GamePhase;
  players: Player[];
  presidentIndex: number;
  cabinetChiefId: string | null;
  nominatedCabinetChiefId: string | null;
  libertarianPolicies: number;
  kirchneristaPolicies: number;
  failedGovernments: number;
  vetoUnlocked: boolean;
  deckSize: number;
  discardSize: number;
  gameStarted: boolean;
  gameOver: boolean;
  winner: string | null;
  winReason: string | null;
  waitingForHost?: boolean;
  pendingAction?: string | null;
}

export type GamePhase = 
  | 'lobby'
  | 'role_reveal'
  | 'nomination'
  | 'election'
  | 'legislative_president'
  | 'legislative_cabinet'
  | 'executive_power'
  | 'veto_decision'
  | 'game_over';

export interface RoomInfo {
  roomId: string;
  roomName: string;
  playerCount: number;
  maxPlayers: number;
}

export interface KnownPlayer {
  id: string;
  name: string;
  role: string;
}

export interface ChatMessage {
  playerName: string;
  playerId: string;
  message: string;
  timestamp: number;
}

export type PowerType = 'peek' | 'investigate' | 'special-election' | 'execution' | 'veto';

export interface PowerInfo {
  type: PowerType;
  name: string;
  description: string;
  icon: string;
}

export const POWER_INFO: Record<PowerType, PowerInfo> = {
  'peek': {
    type: 'peek',
    name: 'Intervenir INDEC',
    description: 'Como buen estadista, manipulás las estadísticas y ves las próximas 3 cartas',
    icon: '📊'
  },
  'investigate': {
    type: 'investigate',
    name: 'Investigar con AFIP',
    description: 'Usás el poder del Estado para investigar la lealtad de un jugador',
    icon: '🕵️'
  },
  'special-election': {
    type: 'special-election',
    name: 'Sesión Especial del Congreso',
    description: 'Convocás una sesión especial y elegís al próximo Presidente',
    icon: '🏛️'
  },
  'execution': {
    type: 'execution',
    name: 'Operación Traslado',
    description: 'Alguien va a tener un pequeño accidente... Eliminás a un jugador',
    icon: '💀'
  },
  'veto': {
    type: 'veto',
    name: 'Veto Presidencial',
    description: 'El Presidente y Jefe de Gabinete pueden rechazar ambas cartas',
    icon: '🚫'
  }
};

