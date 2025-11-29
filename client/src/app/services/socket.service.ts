import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.socketUrl);
    
    // Log connection errors only
    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.IO:', error);
    });
  }

  // Métodos para emitir eventos
  emit(event: string, data?: any): void {
    this.socket.emit(event, data);
  }

  // Métodos para escuchar eventos
  on<T = any>(event: string): Observable<T> {
    return new Observable(observer => {
      this.socket.on(event, (data: T) => {
        observer.next(data);
      });

      return () => {
        this.socket.off(event);
      };
    });
  }

  // Lobby
  createRoom(roomName: string, playerName: string): void {
    this.emit('create-room', { roomName, playerName });
  }

  joinRoom(roomId: string, playerName: string): void {
    this.emit('join-room', { roomId, playerName });
  }

  rejoinRoom(roomId: string, playerId: string): void {
    this.emit('rejoin-room', { roomId, playerId });
  }

  getRooms(): void {
    this.emit('get-rooms');
  }

  startGame(): void {
    this.emit('start-game');
  }

  continueRound(): void {
    this.emit('continue-round');
  }

  // IA
  addAI(difficulty?: 'easy' | 'medium' | 'hard'): void {
    this.emit('add-ai', { difficulty });
  }

  removeAI(aiPlayerId: string): void {
    this.emit('remove-ai', { aiPlayerId });
  }

  // Nominación y votación
  nominateCabinetChief(cabinetChiefId: string): void {
    this.emit('nominate-cabinet-chief', { cabinetChiefId });
  }

  castVote(vote: boolean): void {
    this.emit('cast-vote', { vote });
  }

  // Legislación
  presidentDiscard(cardIndex: number): void {
    this.emit('president-discard', { cardIndex });
  }

  cabinetChiefEnact(cardIndex: number): void {
    this.emit('cabinet-chief-enact', { cardIndex });
  }

  // Veto
  requestVeto(): void {
    this.emit('request-veto');
  }

  respondVeto(accepts: boolean): void {
    this.emit('respond-veto', { accepts });
  }

  // Poderes presidenciales
  executePeek(): void {
    this.emit('execute-peek');
  }

  executeInvestigate(targetPlayerId: string): void {
    this.emit('execute-investigate', { targetPlayerId });
  }

  executeSpecialElection(targetPlayerId: string): void {
    this.emit('execute-special-election', { targetPlayerId });
  }

  executeExecution(targetPlayerId: string): void {
    this.emit('execute-execution', { targetPlayerId });
  }

  // Chat
  sendMessage(message: string): void {
    this.emit('send-message', { message });
  }

  // Desconexión
  disconnect(): void {
    this.socket.disconnect();
  }
}

