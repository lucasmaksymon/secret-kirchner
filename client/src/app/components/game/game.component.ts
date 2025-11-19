import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GameStateService } from '../../services/game-state.service';
import { SocketService } from '../../services/socket.service';
import { GameState, Role, KnownPlayer } from '../../models/game.model';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {
  gameState: GameState | null = null;
  currentRole: Role | null = null;
  currentPlayerId: string | null = null;
  knownPlayers: KnownPlayer[] = [];
  showRoleReveal: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private gameStateService: GameStateService,
    private socketService: SocketService
  ) {}

  getTeamClass(): string {
    if (!this.currentRole) return '';
    return this.currentRole.team === 'libertarios' ? 'team-libertario' : 'team-kirchnerista';
  }

  getTeamName(): string {
    if (!this.currentRole) return '';
    return this.currentRole.team === 'libertarios' ? 'LIBERTARIO' : 'KIRCHNERISTA';
  }

  ngOnInit(): void {
    // Subscribe to game state
    this.gameStateService.gameState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.gameState = state;
      });

    // Subscribe to current player ID
    this.gameStateService.currentPlayerId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        this.currentPlayerId = id;
      });

    // Subscribe to current role
    this.gameStateService.currentRole$
      .pipe(takeUntil(this.destroy$))
      .subscribe(role => {
        if (role && !this.currentRole) {
          this.currentRole = role;
          this.showRoleReveal = true;
          
          // Hide role reveal after 5 seconds
          setTimeout(() => {
            this.showRoleReveal = false;
          }, 5000);
        }
      });

    // Subscribe to known players
    this.gameStateService.knownPlayers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(players => {
        this.knownPlayers = players;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getPhaseTitle(): string {
    if (!this.gameState) return '';

    switch (this.gameState.phase) {
      case 'role_reveal':
        return '🎭 Revelando Roles';
      case 'nomination':
        return '🗳️ Fase de Nominación';
      case 'election':
        return '✋ Votación en Progreso';
      case 'legislative_president':
        return '📜 Legislación - Presidente';
      case 'legislative_cabinet':
        return '📜 Legislación - Jefe de Gabinete';
      case 'executive_power':
        return '💼 Poder Presidencial';
      case 'veto_decision':
        return '🚫 Decisión de Veto';
      case 'game_over':
        return '🏁 Juego Terminado';
      default:
        return '';
    }
  }

  getRoleTeamName(): string {
    if (!this.currentRole) return '';
    return this.currentRole.team === 'libertarios' ? 'LIBERTARIOS' : 'KIRCHNERISTAS';
  }

  getRoleDescription(): string {
    if (!this.currentRole) return '';
    
    if (this.currentRole.type === 'el_jefe') {
      return '¡Sos EL JEFE! Líder secreto de los Kirchneristas. Cuidado, si te descubren y te eliminan, pierden.';
    } else if (this.currentRole.type === 'kirchnerista') {
      return 'Sos un Kirchnerista. Conocés a tus compañeros y a El Jefe. Trabajen juntos para aprobar 6 decretos kirchneristas.';
    } else {
      return 'Sos un Libertario. No sabés quién es quién. Debés descubrir a El Jefe antes de que sea demasiado tarde.';
    }
  }

  isHost(): boolean {
    return this.gameState?.hostId === this.currentPlayerId;
  }

  continueRound(): void {
    this.socketService.continueRound();
  }
}

