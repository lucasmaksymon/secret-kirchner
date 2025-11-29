import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from './services/game-state.service';
import { SocketService } from './services/socket.service';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .app-container {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'El Secreto de Kirchner';
  private reconnectSubscriptions: Subscription[] = [];
  private reconnectTimeout: any = null;
  
  constructor(
    private gameStateService: GameStateService,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Intentar reconectar si hay una sesión guardada
    const session = this.gameStateService.getStoredSession();
    if (session) {
      this.attemptReconnection(session.roomId, session.playerId);
    }
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.reconnectSubscriptions.forEach(sub => sub.unsubscribe());
    this.reconnectSubscriptions = [];
    
    // Limpiar timeout si existe
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
  }

  private attemptReconnection(roomId: string, playerId: string): void {
    console.log('🔄 Intentando reconectar a la sala:', roomId);
    
    // Configurar timeout de 5 segundos para la reconexión
    this.reconnectTimeout = setTimeout(() => {
      console.warn('⏱️ Timeout al reconectar. La sala puede no existir o el servidor está inactivo.');
      this.handleReconnectionFailure('La sala ya no existe o el servidor está inactivo. Por favor, crea una nueva sala.');
    }, 5000);

    // Suscribirse a éxito de reconexión (solo una vez)
    const successSub = this.socketService.on('room-rejoined')
      .pipe(take(1))
      .subscribe((data: any) => {
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        console.log('✅ Reconectado exitosamente');
        // Navegar a la ruta apropiada
        if (data.gameState?.gameStarted && data.gameState?.phase !== 'lobby') {
          this.router.navigate(['/game', roomId]);
        } else {
          this.router.navigate(['/lobby', roomId]);
        }
        this.cleanupReconnectionSubscriptions();
      });
    
    this.reconnectSubscriptions.push(successSub);

    // Suscribirse a errores (solo una vez)
    const errorSub = this.socketService.on('error')
      .pipe(take(1))
      .subscribe((error: any) => {
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        console.error('❌ Error al reconectar:', error);
        
        // Limpiar sesión si la sala no existe
        const errorMessage = error.message || error.toString();
        if (errorMessage.includes('no encontrada') || 
            errorMessage.includes('no existe') ||
            errorMessage.includes('Jugador no encontrado')) {
          this.handleReconnectionFailure('La sala ya no existe. El servidor puede haberse reiniciado.');
        }
      });
    
    this.reconnectSubscriptions.push(errorSub);

    // Intentar reconectar
    this.socketService.rejoinRoom(roomId, playerId);
  }

  private handleReconnectionFailure(message: string): void {
    console.warn('⚠️', message);
    this.gameStateService.clearSession();
    this.cleanupReconnectionSubscriptions();
    // Navegar al home
    this.router.navigate(['/']);
  }

  private cleanupReconnectionSubscriptions(): void {
    this.reconnectSubscriptions.forEach(sub => sub.unsubscribe());
    this.reconnectSubscriptions = [];
  }
}

