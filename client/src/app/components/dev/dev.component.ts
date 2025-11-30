import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { GameStateService } from '../../services/game-state.service';
import { GameState, Player, Role } from '../../models/game.model';

@Component({
  selector: 'app-dev',
  templateUrl: './dev.component.html',
  styleUrls: ['./dev.component.scss']
})
export class DevComponent implements OnInit, OnDestroy {
  isDevelopment = environment.development;
  
  screens = [
    { name: 'Home', route: '/', component: 'HomeComponent' },
    { name: 'Lobby', component: 'LobbyComponent', standalone: true },
    { name: 'Game', component: 'GameComponent', standalone: true },
    { name: 'Board', component: 'BoardComponent', standalone: true },
    { name: 'Chat', component: 'ChatComponent', standalone: true },
    { name: 'Executive Power', component: 'ExecutivePowerComponent', standalone: true },
    { name: 'Game Over', component: 'GameOverComponent', standalone: true },
    { name: 'Player List', component: 'PlayerListComponent', standalone: true },
    { name: 'Policy Cards', component: 'PolicyCardsComponent', standalone: true },
    { name: 'Voting', component: 'VotingComponent', standalone: true },
    { name: 'Voice Chat', component: 'VoiceChatComponent', standalone: true }
  ];

  selectedScreen: string | null = null;
  private mockGameState: GameState | null = null;

  constructor(
    public router: Router,
    private gameStateService: GameStateService
  ) {}

  ngOnInit(): void {
    if (!this.isDevelopment) {
      this.router.navigate(['/']);
      return;
    }

    // Crear datos mock para desarrollo
    this.createMockGameState();
  }

  ngOnDestroy(): void {
    // Limpiar datos mock al salir
    try {
      (this.gameStateService as any).gameStateSubject?.next(null);
    } catch (error) {
      console.warn('No se pudieron limpiar datos mock:', error);
    }
  }

  createMockGameState(): void {
    const mockPlayers: Player[] = [
      {
        id: 'player1',
        socketId: 'socket1',
        name: 'Jugador 1',
        role: { type: 'libertario', team: 'libertarios' },
        isDead: false,
        isReady: true,
        wasInvestigated: false,
        votes: [],
        isAI: false
      },
      {
        id: 'player2',
        socketId: 'socket2',
        name: 'Jugador 2',
        role: { type: 'libertario', team: 'libertarios' },
        isDead: false,
        isReady: true,
        wasInvestigated: false,
        votes: [],
        isAI: false
      },
      {
        id: 'player3',
        socketId: 'socket3',
        name: 'Jugador 3',
        role: { type: 'kirchnerista', team: 'kirchneristas' },
        isDead: false,
        isReady: true,
        wasInvestigated: false,
        votes: [],
        isAI: false
      },
      {
        id: 'player4',
        socketId: 'socket4',
        name: 'El Jefe',
        role: { type: 'el_jefe', team: 'kirchneristas', isElJefe: true },
        isDead: false,
        isReady: true,
        wasInvestigated: false,
        votes: [],
        isAI: false
      },
      {
        id: 'player5',
        socketId: 'socket5',
        name: 'Jugador 5',
        role: { type: 'libertario', team: 'libertarios' },
        isDead: false,
        isReady: true,
        wasInvestigated: false,
        votes: [],
        isAI: false
      },
      {
        id: 'player6',
        socketId: 'socket6',
        name: 'Jugador 6',
        role: { type: 'libertario', team: 'libertarios' },
        isDead: false,
        isReady: true,
        wasInvestigated: false,
        votes: [],
        isAI: false
      },
      {
        id: 'player7',
        socketId: 'socket7',
        name: 'Jugador 7',
        role: { type: 'libertario', team: 'libertarios' },
        isDead: false,
        isReady: true,
        wasInvestigated: false,
        votes: [],
        isAI: false
      },
      {
        id: 'player8',
        socketId: 'socket8',
        name: 'Jugador 8',
        role: { type: 'libertario', team: 'libertarios' },
        isDead: false,
        isReady: true,
        wasInvestigated: false,
        votes: [],
        isAI: false
      },
      {
        id: 'player9',
        socketId: 'socket9',
        name: 'Jugador 5',
        role: { type: 'libertario', team: 'libertarios' },
        isDead: false,
        isReady: true,
        wasInvestigated: false,
        votes: [],
        isAI: false
      },
      {
        id: 'player10',
        socketId: 'socket10',
        name: 'Jugador 10',
        role: { type: 'libertario', team: 'libertarios' },
        isDead: false,
        isReady: true,
        wasInvestigated: false,
        votes: [],
        isAI: false
      }
    ];

    this.mockGameState = {
      roomId: 'dev-room',
      roomName: 'Sala de Desarrollo',
      hostId: 'player1',
      phase: 'nomination',
      players: mockPlayers,
      presidentIndex: 0,
      cabinetChiefId: null,
      nominatedCabinetChiefId: null,
      libertarianPolicies: 2,
      kirchneristaPolicies: 1,
      failedGovernments: 0,
      vetoUnlocked: false,
      deckSize: 10,
      discardSize: 5,
      gameStarted: true,
      gameOver: false,
      winner: null,
      winReason: null,
      currentPower: null
    };

    // Inyectar datos mock en el servicio
    this.injectMockData();
    
    // También inyectar rol mock para el jugador actual
    try {
      (this.gameStateService as any).currentRoleSubject?.next(mockPlayers[0].role);
    } catch (error) {
      console.warn('No se pudo inyectar rol mock:', error);
    }
  }

  private injectMockData(): void {
    try {
      (this.gameStateService as any).gameStateSubject?.next(this.mockGameState);
      (this.gameStateService as any).currentPlayerIdSubject?.next('player1');
    } catch (error) {
      console.warn('No se pudieron inyectar datos mock:', error);
    }
  }

  navigateToScreen(screen: any): void {
    if (screen.route) {
      // Para rutas, abrir en nueva pestaña
      window.open(screen.route, '_blank');
    } else {
      // Para componentes standalone, mostrar en el panel
      this.selectedScreen = screen.component;
      
      // Actualizar fase del juego según el componente seleccionado
      if (this.mockGameState) {
        let phase = this.mockGameState.phase;
        let currentPower = this.mockGameState.currentPower;
        
        switch(screen.component) {
          case 'VotingComponent':
            phase = 'election';
            break;
          case 'PolicyCardsComponent':
            phase = 'legislative_president';
            break;
          case 'ExecutivePowerComponent':
            phase = 'executive_power';
            currentPower = 'peek';
            break;
          case 'GameOverComponent':
            phase = 'game_over';
            this.mockGameState.gameOver = true;
            this.mockGameState.winner = 'libertarios';
            this.mockGameState.winReason = '5 decretos libertarios aprobados';
            break;
        }
        
        this.mockGameState.phase = phase;
        this.mockGameState.currentPower = currentPower;
        
        // Resetear gameOver si no es GameOverComponent
        if (screen.component !== 'GameOverComponent') {
          this.mockGameState.gameOver = false;
          this.mockGameState.winner = null;
          this.mockGameState.winReason = null;
        }
        
        this.injectMockData();
      }
    }
  }

  getComponentName(screen: any): string {
    return screen.component.replace('Component', '').toLowerCase();
  }
}

