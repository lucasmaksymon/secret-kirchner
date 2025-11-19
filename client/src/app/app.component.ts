import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from './services/game-state.service';
import { SocketService } from './services/socket.service';

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
export class AppComponent implements OnInit {
  title = 'El Secreto de Kirchner';
  
  constructor(
    private gameStateService: GameStateService,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Intentar reconectar si hay una sesión guardada
    const session = this.gameStateService.getStoredSession();
    if (session) {
      console.log('🔄 Intentando reconectar a la sala:', session.roomId);
      this.socketService.rejoinRoom(session.roomId, session.playerId);
      
      // Suscribirse a eventos de reconexión
      this.socketService.on('room-rejoined').subscribe((data: any) => {
        console.log('✅ Reconectado exitosamente');
        // Navegar a la ruta apropiada
        if (data.gameState.gameStarted && data.gameState.phase !== 'lobby') {
          this.router.navigate(['/game', session.roomId]);
        } else {
          this.router.navigate(['/lobby', session.roomId]);
        }
      });

      this.socketService.on('error').subscribe((error: any) => {
        console.error('❌ Error al reconectar:', error);
        // Limpiar sesión si falla la reconexión
        if (error.message?.includes('no encontrada') || error.message?.includes('no existe')) {
          this.gameStateService.clearSession();
          this.router.navigate(['/']);
        }
      });
    }
  }
}

