import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { GameStateService } from '../../services/game-state.service';
import { SocketService } from '../../services/socket.service';
import { GameState, Player, POWER_INFO } from '../../models/game.model';

@Component({
  selector: 'app-executive-power',
  templateUrl: './executive-power.component.html',
  styleUrls: ['./executive-power.component.scss']
})
export class ExecutivePowerComponent implements OnInit {
  gameState$: Observable<GameState | null>;
  selectedPlayerId: string | null = null;
  powerInfo = POWER_INFO;

  peekResult$: Observable<any[] | null>;
  investigateResult$: Observable<{playerName: string, loyalty: string} | null>;

  constructor(
    private gameStateService: GameStateService,
    private socketService: SocketService
  ) {
    this.gameState$ = this.gameStateService.gameState$;
    this.peekResult$ = this.gameStateService.peekResult$;
    this.investigateResult$ = this.gameStateService.investigateResult$;
  }

  ngOnInit(): void {}

  isPresident(): boolean {
    return this.gameStateService.isCurrentPlayerPresident();
  }

  getCurrentPower(): string | null {
    const state = this.gameStateService.getGameStateValue();
    if (state?.phase === 'executive_power' && state?.currentPower) {
      return state.currentPower;
    }
    return null;
  }

  requiresPlayerSelection(): boolean {
    const power = this.getCurrentPower();
    return power === 'investigate' || power === 'special-election' || power === 'execution';
  }

  getPowerInfo() {
    const power = this.getCurrentPower();
    if (!power) return null;
    return POWER_INFO[power as keyof typeof POWER_INFO] || null;
  }

  selectPlayer(playerId: string): void {
    this.selectedPlayerId = playerId;
  }

  executePower(): void {
    if (!this.isPresident()) return;

    const power = this.getCurrentPower();
    if (!power) return;
    
    if (power === 'peek') {
      this.socketService.executePeek();
    } else if (power === 'investigate') {
      if (!this.selectedPlayerId) {
        alert('Debes seleccionar un jugador para investigar');
        return;
      }
      this.socketService.executeInvestigate(this.selectedPlayerId);
      this.selectedPlayerId = null;
    } else if (power === 'special-election') {
      if (!this.selectedPlayerId) {
        alert('Debes seleccionar al próximo Presidente');
        return;
      }
      this.socketService.executeSpecialElection(this.selectedPlayerId);
      this.selectedPlayerId = null;
    } else if (power === 'execution') {
      if (!this.selectedPlayerId) {
        alert('Debes seleccionar un jugador para ejecutar');
        return;
      }
      const selectedPlayer = this.getEligiblePlayers().find(p => p.id === this.selectedPlayerId);
      if (selectedPlayer && confirm(`¿Estás seguro de que querés eliminar a ${selectedPlayer.name}? Esta acción no se puede deshacer.`)) {
        this.socketService.executeExecution(this.selectedPlayerId);
        this.selectedPlayerId = null;
      }
    }
  }

  canSelectPlayer(player: Player): boolean {
    const state = this.gameStateService.getGameStateValue();
    if (!state || player.isDead) return false;
    
    const currentPlayer = this.gameStateService.getCurrentPlayer();
    if (!currentPlayer || player.id === currentPlayer.id) return false;

    // Additional logic for investigate (can't investigate already investigated)
    const power = this.getCurrentPower();
    if (power === 'investigate' && player.wasInvestigated) return false;

    return true;
  }

  getEligiblePlayers(): Player[] {
    const state = this.gameStateService.getGameStateValue();
    if (!state) return [];
    
    return state.players.filter((p: Player) => this.canSelectPlayer(p));
  }
}

