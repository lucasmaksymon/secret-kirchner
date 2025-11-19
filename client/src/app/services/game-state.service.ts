import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameState, Player, Role, Policy, KnownPlayer, ChatMessage } from '../models/game.model';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private gameStateSubject = new BehaviorSubject<GameState | null>(null);
  public gameState$ = this.gameStateSubject.asObservable();

  private currentPlayerIdSubject = new BehaviorSubject<string | null>(null);
  public currentPlayerId$ = this.currentPlayerIdSubject.asObservable();

  private currentRoleSubject = new BehaviorSubject<Role | null>(null);
  public currentRole$ = this.currentRoleSubject.asObservable();

  private knownPlayersSubject = new BehaviorSubject<KnownPlayer[]>([]);
  public knownPlayers$ = this.knownPlayersSubject.asObservable();

  private currentCardsSubject = new BehaviorSubject<Policy[]>([]);
  public currentCards$ = this.currentCardsSubject.asObservable();

  private chatMessagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public chatMessages$ = this.chatMessagesSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private socketService: SocketService) {
    this.initializeSocketListeners();
  }

  private initializeSocketListeners(): void {
    // Lobby events
    this.socketService.on('room-created').subscribe((data: any) => {
      this.currentPlayerIdSubject.next(data.playerId);
      this.gameStateSubject.next(data.gameState);
      // Guardar en localStorage para reconexión
      this.saveSession(data.gameState.roomId, data.playerId);
    });

    this.socketService.on('room-joined').subscribe((data: any) => {
      this.currentPlayerIdSubject.next(data.playerId);
      this.gameStateSubject.next(data.gameState);
      // Guardar en localStorage para reconexión
      this.saveSession(data.gameState.roomId, data.playerId);
    });

    this.socketService.on('room-rejoined').subscribe((data: any) => {
      this.currentPlayerIdSubject.next(data.playerId);
      this.gameStateSubject.next(data.gameState);
      if (data.role) {
        this.currentRoleSubject.next(data.role);
      }
      if (data.knownPlayers) {
        this.knownPlayersSubject.next(data.knownPlayers);
      }
    });

    this.socketService.on('player-joined').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
    });

    this.socketService.on('player-left').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
    });

    this.socketService.on('ai-added').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
    });

    // Game events
    this.socketService.on('game-started').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
    });

    this.socketService.on('role-assigned').subscribe((data: any) => {
      this.currentRoleSubject.next(data.role);
      this.knownPlayersSubject.next(data.knownPlayers);
    });

    this.socketService.on('game-update').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
    });

    // Nomination & Voting
    this.socketService.on('cabinet-chief-nominated').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
    });

    this.socketService.on('vote-cast').subscribe((data: any) => {
      // Update UI to show vote was cast
    });

    this.socketService.on('vote-result').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
    });

    // Legislative phase
    this.socketService.on('draw-policies').subscribe((data: any) => {
      this.currentCardsSubject.next(data.cards);
    });

    this.socketService.on('president-discarded').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
    });

    this.socketService.on('receive-policies').subscribe((data: any) => {
      this.currentCardsSubject.next(data.cards);
    });

    this.socketService.on('policy-enacted').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
      this.currentCardsSubject.next([]);
    });

    this.socketService.on('round-completed').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
    });

    // Powers
    this.socketService.on('executive-power-available').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
    });

    this.socketService.on('power-executed').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
    });

    this.socketService.on('peek-result').subscribe((data: any) => {
      this.currentCardsSubject.next(data.cards);
    });

    this.socketService.on('investigate-result').subscribe((data: any) => {
      // Show investigation result to president
    });

    // Veto
    this.socketService.on('veto-requested').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
    });

    this.socketService.on('veto-result').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
    });

    // Chaos
    this.socketService.on('chaos-triggered').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
    });

    // Game Over
    this.socketService.on('game-over').subscribe((data: any) => {
      this.gameStateSubject.next(data.gameState);
    });

    // Chat
    this.socketService.on('chat-message').subscribe((data: ChatMessage) => {
      const currentMessages = this.chatMessagesSubject.value;
      this.chatMessagesSubject.next([...currentMessages, data]);
    });

    // Errors
    this.socketService.on('error').subscribe((data: any) => {
      this.errorSubject.next(data.message);
      setTimeout(() => this.errorSubject.next(null), 5000);
    });
  }

  // Helper methods
  // Helper method to get current state value
  getGameStateValue(): GameState | null {
    return this.gameStateSubject.value;
  }

  getCurrentPlayer(): Player | null {
    const gameState = this.gameStateSubject.value;
    const playerId = this.currentPlayerIdSubject.value;
    
    if (!gameState || !playerId) return null;
    
    return gameState.players.find(p => p.id === playerId) || null;
  }

  isCurrentPlayerPresident(): boolean {
    const gameState = this.gameStateSubject.value;
    const player = this.getCurrentPlayer();
    
    if (!gameState || !player) return false;
    
    return gameState.players[gameState.presidentIndex]?.id === player.id;
  }

  isCurrentPlayerCabinetChief(): boolean {
    const gameState = this.gameStateSubject.value;
    const player = this.getCurrentPlayer();
    
    if (!gameState || !player) return false;
    
    return gameState.cabinetChiefId === player.id;
  }

  getPresident(): Player | null {
    const gameState = this.gameStateSubject.value;
    if (!gameState) return null;
    
    return gameState.players[gameState.presidentIndex] || null;
  }

  getCabinetChief(): Player | null {
    const gameState = this.gameStateSubject.value;
    if (!gameState || !gameState.cabinetChiefId) return null;
    
    return gameState.players.find(p => p.id === gameState.cabinetChiefId) || null;
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  // Persistencia de sesión
  private saveSession(roomId: string, playerId: string): void {
    localStorage.setItem('sk_roomId', roomId);
    localStorage.setItem('sk_playerId', playerId);
  }

  getStoredSession(): { roomId: string; playerId: string } | null {
    const roomId = localStorage.getItem('sk_roomId');
    const playerId = localStorage.getItem('sk_playerId');
    
    if (roomId && playerId) {
      return { roomId, playerId };
    }
    
    return null;
  }

  clearSession(): void {
    localStorage.removeItem('sk_roomId');
    localStorage.removeItem('sk_playerId');
  }
}

