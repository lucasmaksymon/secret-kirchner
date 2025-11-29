import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GameStateService } from '../../services/game-state.service';
import { SocketService } from '../../services/socket.service';
import { GameState, Player } from '../../models/game.model';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent implements OnInit, OnDestroy {
  gameState: GameState | null = null;
  currentPlayerId: string | null = null;
  lastMessage: string | null = null;
  private destroy$ = new Subject<void>();
  
  accordionStates = {
    rules: false,
    flow: false,
    powers: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameStateService: GameStateService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    // Obtener roomId de la ruta
    const roomId = this.route.snapshot.paramMap.get('roomId');
    
    if (roomId) {
      // Verificar si ya tenemos el gameState (ya estamos en la sala)
      const currentState = this.gameStateService.getGameStateValue();
      
      if (!currentState || currentState.roomId !== roomId) {
        // No estamos en esta sala, intentar unirse o reconectar
        this.handleRoomAccess(roomId);
      }
    }

    // Subscribe to game state
    this.gameStateService.gameState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.gameState = state;
        
        // Redirect to game if started
        if (state?.gameStarted && state?.phase !== 'lobby') {
          this.router.navigate(['/game', state.roomId]);
        }
      });

    // Subscribe to current player ID
    this.gameStateService.currentPlayerId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        this.currentPlayerId = id;
      });

    // Subscribe to AI added events
    this.socketService.on('ai-added')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.showMessage(data.message || 'IA agregada correctamente');
      });

    // Subscribe to errors
    this.gameStateService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        if (error) {
          this.showMessage(error, true);
          // Si es un error de sala no encontrada, redirigir al home después de un tiempo
          if (error.includes('no encontrada') || error.includes('no existe')) {
            setTimeout(() => {
              this.router.navigate(['/']);
            }, 3000);
          }
        }
      });
  }

  private handleRoomAccess(roomId: string): void {
    // Intentar obtener sesión guardada
    const session = this.gameStateService.getStoredSession();
    
    if (session && session.roomId === roomId && session.playerId) {
      // Intentar reconectar
      console.log('🔄 Intentando reconectar a la sala:', roomId);
      this.socketService.rejoinRoom(roomId, session.playerId);
    } else {
      // No hay sesión, necesitamos el nombre del jugador
      // Intentar obtenerlo del localStorage o pedirlo
      const storedPlayerName = localStorage.getItem('playerName');
      
      if (storedPlayerName) {
        console.log('🔌 Uniéndose a la sala:', roomId);
        this.socketService.joinRoom(roomId, storedPlayerName);
      } else {
        // No hay nombre guardado, redirigir al home para que lo ingrese
        console.log('⚠️ No hay nombre de jugador guardado. Redirigiendo al home...');
        this.router.navigate(['/'], { 
          queryParams: { 
            roomId: roomId,
            join: 'true'
          } 
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isHost(): boolean {
    return this.gameState?.hostId === this.currentPlayerId;
  }

  canStartGame(): boolean {
    if (!this.gameState) return false;
    return (
      this.isHost() &&
      this.gameState.players.length >= 5 &&
      this.gameState.players.length <= 10
    );
  }

  startGame(): void {
    if (this.canStartGame()) {
      this.socketService.startGame();
    }
  }

  copyRoomLink(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.showMessage('✅ Link copiado al portapapeles. ¡Compártelo con tus amigos!');
    }).catch(() => {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showMessage('✅ Link copiado al portapapeles. ¡Compártelo con tus amigos!');
    });
  }

  shareRoomLink(): void {
    const url = window.location.href;
    const roomName = this.gameState?.roomName || 'Sala';
    
    // Intentar usar Web Share API si está disponible
    if (navigator.share) {
      navigator.share({
        title: `¡Únete a ${roomName}!`,
        text: `¡Únete a mi partida de El Secreto de Kirchner!`,
        url: url
      }).catch(() => {
        // Si el usuario cancela, usar copiar como fallback
        this.copyRoomLink();
      });
    } else {
      // Fallback: copiar al portapapeles
      this.copyRoomLink();
    }
  }

  addAI(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): void {
    if (this.isHost()) {
      this.socketService.addAI(difficulty);
    }
  }

  removeAI(aiPlayerId: string): void {
    if (this.isHost()) {
      this.socketService.removeAI(aiPlayerId);
    }
  }

  showMessage(message: string, isError: boolean = false): void {
    this.lastMessage = message;
    setTimeout(() => {
      this.lastMessage = null;
    }, 3000);
  }

  leaveLobby(): void {
    this.socketService.disconnect();
    this.router.navigate(['/']);
  }

  toggleAccordion(section: 'rules' | 'flow' | 'powers'): void {
    // Si el acordeón ya está abierto, lo cerramos
    if (this.accordionStates[section]) {
      this.accordionStates[section] = false;
    } else {
      // Cerramos todos los acordeones
      Object.keys(this.accordionStates).forEach(key => {
        this.accordionStates[key as keyof typeof this.accordionStates] = false;
      });
      // Abrimos solo el seleccionado
      this.accordionStates[section] = true;
    }
  }
}

