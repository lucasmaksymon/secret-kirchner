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

  constructor(
    private gameStateService: GameStateService,
    private socketService: SocketService
  ) {
    this.gameState$ = this.gameStateService.gameState$;
  }

  ngOnInit(): void {}

  isPresident(): boolean {
    return this.gameStateService.isCurrentPlayerPresident();
  }

  getCurrentPower(): string | null {
    const state = this.gameStateService.getGameStateValue();
    return state?.phase === 'executive_power' ? 'execution' : null; // Simplified, should come from state
  }

  selectPlayer(playerId: string): void {
    this.selectedPlayerId = playerId;
  }

  executePower(): void {
    if (!this.isPresident()) return;

    const power = this.getCurrentPower();
    
    if (power === 'peek') {
      this.socketService.executePeek();
    } else if (power === 'investigate' && this.selectedPlayerId) {
      this.socketService.executeInvestigate(this.selectedPlayerId);
    } else if (power === 'special-election' && this.selectedPlayerId) {
      this.socketService.executeSpecialElection(this.selectedPlayerId);
    } else if (power === 'execution' && this.selectedPlayerId) {
      if (confirm('¿Estás seguro de que querés eliminar a este jugador?')) {
        this.socketService.executeExecution(this.selectedPlayerId);
      }
    }

    this.selectedPlayerId = null;
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

